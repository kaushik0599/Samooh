// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./SamoohTreasury.sol";

/// @notice Membership, proposals, voting, and execution authorization for
/// one Samooh. See docs/GOVERNANCE_SPEC.md — this contract is the
/// authoritative implementation of that spec.
contract SamoohGovernance is Ownable {
    enum ProposalState {
        Active,
        Approved,
        Rejected,
        Expired,
        Executed
    }

    struct Proposal {
        uint256 id;
        address proposer;
        address recipient;
        uint256 amount;
        string metadataURI;
        uint256 createdAt;
        uint256 votingDeadline;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 quorumVotesRequired;
        ProposalState state;
        bool executed;
    }

    error AlreadyMember();
    error NotMember();
    error AlreadyVoted();
    error ProposalNotActive();
    error VotingClosed();
    error InvalidRecipient();
    error ProposalNotApproved();
    error AlreadyExecuted();

    SamoohTreasury public immutable treasury;

    mapping(address => bool) private _isMember;
    address[] private _members;
    mapping(address => uint256) private _memberIndex; // index+1 in _members, 0 = absent

    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => mapping(address => bool)) private _hasVotedMap;
    uint256 public proposalCount;

    event MemberAdded(address indexed member, uint256 timestamp);
    event MemberRemoved(address indexed member, uint256 timestamp);
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address recipient,
        uint256 amount,
        uint256 votingDeadline
    );
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalApproved(uint256 indexed proposalId, uint256 votesFor, uint256 votesAgainst);
    event ProposalRejected(uint256 indexed proposalId, uint256 votesFor, uint256 votesAgainst);
    event ProposalExecuted(uint256 indexed proposalId, address recipient, uint256 amount);

    modifier onlyMember() {
        if (!_isMember[msg.sender]) revert NotMember();
        _;
    }

    constructor(
        address admin,
        address payable treasuryAddress,
        address[] memory initialMembers
    ) Ownable(admin) {
        treasury = SamoohTreasury(treasuryAddress);
        for (uint256 i = 0; i < initialMembers.length; i++) {
            _addMember(initialMembers[i]);
        }
    }

    // ---------------------------------------------------------------
    // Membership
    // ---------------------------------------------------------------

    function addMember(address account) external onlyOwner {
        _addMember(account);
    }

    function _addMember(address account) internal {
        if (_isMember[account]) revert AlreadyMember();
        _isMember[account] = true;
        _members.push(account);
        _memberIndex[account] = _members.length; // 1-based
        emit MemberAdded(account, block.timestamp);
    }

    function removeMember(address account) external onlyOwner {
        if (!_isMember[account]) revert NotMember();
        _isMember[account] = false;

        uint256 idx = _memberIndex[account]; // 1-based
        uint256 lastIdx = _members.length;
        if (idx != lastIdx) {
            address lastMember = _members[lastIdx - 1];
            _members[idx - 1] = lastMember;
            _memberIndex[lastMember] = idx;
        }
        _members.pop();
        delete _memberIndex[account];

        emit MemberRemoved(account, block.timestamp);
    }

    function memberCount() external view returns (uint256) {
        return _members.length;
    }

    function isMember(address account) external view returns (bool) {
        return _isMember[account];
    }

    function getMembers() external view returns (address[] memory) {
        return _members;
    }

    // ---------------------------------------------------------------
    // Proposals
    // ---------------------------------------------------------------

    function createProposal(
        address recipient,
        uint256 amount,
        string calldata metadataURI,
        uint256 votingPeriodSeconds
    ) external onlyMember returns (uint256) {
        if (amount > 0 && recipient == address(0)) revert InvalidRecipient();

        proposalCount += 1;
        uint256 id = proposalCount;
        uint256 deadline = block.timestamp + votingPeriodSeconds;
        uint256 quorum = _ceilHalf(_members.length);

        _proposals[id] = Proposal({
            id: id,
            proposer: msg.sender,
            recipient: recipient,
            amount: amount,
            metadataURI: metadataURI,
            createdAt: block.timestamp,
            votingDeadline: deadline,
            votesFor: 0,
            votesAgainst: 0,
            quorumVotesRequired: quorum,
            state: ProposalState.Active,
            executed: false
        });

        emit ProposalCreated(id, msg.sender, recipient, amount, deadline);
        return id;
    }

    function vote(uint256 proposalId, bool support) external onlyMember {
        Proposal storage p = _proposals[proposalId];
        if (p.state != ProposalState.Active) revert ProposalNotActive();
        if (block.timestamp > p.votingDeadline) revert VotingClosed();
        if (_hasVotedMap[proposalId][msg.sender]) revert AlreadyVoted();

        _hasVotedMap[proposalId][msg.sender] = true;
        if (support) {
            p.votesFor += 1;
        } else {
            p.votesAgainst += 1;
        }

        emit VoteCast(proposalId, msg.sender, support);
    }

    /// @notice Anyone may call this to persist the lazily-computed
    /// post-deadline outcome (Approved/Rejected/Expired) and emit the
    /// corresponding event. `executeProposal` calls this internally.
    /// No-op if the deadline hasn't passed or it's already resolved.
    function resolveProposal(uint256 proposalId) public {
        Proposal storage p = _proposals[proposalId];
        if (p.state != ProposalState.Active) return;
        if (block.timestamp <= p.votingDeadline) return;

        uint256 totalVotes = p.votesFor + p.votesAgainst;
        if (totalVotes < p.quorumVotesRequired) {
            p.state = ProposalState.Expired;
            return;
        }

        if (p.votesFor > p.votesAgainst) {
            p.state = ProposalState.Approved;
            emit ProposalApproved(proposalId, p.votesFor, p.votesAgainst);
        } else {
            p.state = ProposalState.Rejected;
            emit ProposalRejected(proposalId, p.votesFor, p.votesAgainst);
        }
    }

    function executeProposal(uint256 proposalId) external onlyMember {
        resolveProposal(proposalId);

        Proposal storage p = _proposals[proposalId];
        if (p.executed) revert AlreadyExecuted();
        if (p.state != ProposalState.Approved) revert ProposalNotApproved();

        p.executed = true;
        p.state = ProposalState.Executed;

        if (p.amount > 0) {
            treasury.executeTransfer(proposalId, p.recipient, p.amount);
        }

        emit ProposalExecuted(proposalId, p.recipient, p.amount);
    }

    // ---------------------------------------------------------------
    // Reads
    // ---------------------------------------------------------------

    function getProposal(uint256 id) external view returns (Proposal memory) {
        return _proposals[id];
    }

    function getProposalState(uint256 id) external view returns (ProposalState) {
        Proposal storage p = _proposals[id];
        if (p.state != ProposalState.Active) return p.state;
        if (block.timestamp <= p.votingDeadline) return ProposalState.Active;

        uint256 totalVotes = p.votesFor + p.votesAgainst;
        if (totalVotes < p.quorumVotesRequired) return ProposalState.Expired;
        if (p.votesFor > p.votesAgainst) return ProposalState.Approved;
        return ProposalState.Rejected;
    }

    function getVoteCounts(uint256 id) external view returns (uint256 votesFor, uint256 votesAgainst) {
        Proposal storage p = _proposals[id];
        return (p.votesFor, p.votesAgainst);
    }

    function hasVoted(uint256 id, address voter) external view returns (bool) {
        return _hasVotedMap[id][voter];
    }

    function getQuorum(uint256 id) external view returns (uint256 required, uint256 current) {
        Proposal storage p = _proposals[id];
        return (p.quorumVotesRequired, p.votesFor + p.votesAgainst);
    }

    function _ceilHalf(uint256 count) internal pure returns (uint256) {
        return (count * 50 + 99) / 100;
    }
}
