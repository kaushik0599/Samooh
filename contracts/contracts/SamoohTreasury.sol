// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Holds native POL for one Samooh. Funds move only via
/// `executeTransfer`, callable only by the paired SamoohGovernance
/// contract. There is no owner-only withdrawal path — this is the core
/// "no backend backdoor, no admin backdoor" guarantee documented in
/// docs/GOVERNANCE_SPEC.md.
contract SamoohTreasury is ReentrancyGuard {
    error NotFactory();
    error NotGovernance();
    error GovernanceAlreadySet();
    error InsufficientBalance();
    error TransferFailed();

    address public immutable factory;
    address public governance;

    event TreasuryDeposit(address indexed from, uint256 amount);
    event TreasuryTransfer(uint256 indexed proposalId, address indexed recipient, uint256 amount);

    modifier onlyGovernance() {
        if (msg.sender != governance) revert NotGovernance();
        _;
    }

    constructor() {
        factory = msg.sender;
    }

    /// @dev Wired exactly once by the deploying SamoohFactory, right after
    /// the paired SamoohGovernance is deployed (chicken-and-egg: the
    /// governance contract's constructor needs this treasury's address,
    /// so this treasury can't know governance's address until afterward).
    /// Never callable again once set — this is the only privileged
    /// pre-lock function and it cannot move funds.
    function setGovernance(address _governance) external {
        if (msg.sender != factory) revert NotFactory();
        if (governance != address(0)) revert GovernanceAlreadySet();
        governance = _governance;
    }

    function deposit() external payable nonReentrant {
        emit TreasuryDeposit(msg.sender, msg.value);
    }

    receive() external payable {
        emit TreasuryDeposit(msg.sender, msg.value);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function executeTransfer(
        uint256 proposalId,
        address recipient,
        uint256 amount
    ) external onlyGovernance nonReentrant {
        if (amount > address(this).balance) revert InsufficientBalance();
        // Checks-effects-interactions: balance check happened above,
        // interaction (the actual value transfer) happens last.
        (bool ok, ) = payable(recipient).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit TreasuryTransfer(proposalId, recipient, amount);
    }
}
