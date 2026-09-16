import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import type { SamoohFactory, SamoohGovernance, SamoohTreasury } from "../typechain-types";

const ONE_DAY = 24 * 60 * 60;

async function deployFactoryFixture() {
  const [admin, member2, member3, member4, outsider, recipient] = await ethers.getSigners();

  const Factory = await ethers.getContractFactory("SamoohFactory");
  const factory = (await Factory.deploy()) as unknown as SamoohFactory;
  await factory.waitForDeployment();

  return { factory, admin, member2, member3, member4, outsider, recipient };
}

async function createSamoohFixture() {
  const base = await deployFactoryFixture();
  const { factory, admin } = base;

  const tx = await factory.createSamooh(admin.address, [admin.address]);
  const receipt = await tx.wait();
  const parsed = receipt!.logs
    .map((log) => {
      try {
        return factory.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((p) => p?.name === "SamoohCreated");

  const governanceAddress = parsed!.args.governance as string;
  const treasuryAddress = parsed!.args.treasury as string;

  const governance = (await ethers.getContractAt(
    "SamoohGovernance",
    governanceAddress
  )) as unknown as SamoohGovernance;
  const treasury = (await ethers.getContractAt("SamoohTreasury", treasuryAddress)) as unknown as SamoohTreasury;

  return { ...base, governance, treasury };
}

describe("SAMOOH Governance Stack", () => {
  describe("Deployment & Factory", () => {
    it("1. deploys the factory successfully", async () => {
      const { factory } = await loadFixture(deployFactoryFixture);
      expect(await factory.getAddress()).to.properAddress;
    });

    it("2. creates a Samooh (governance + treasury pair, wired to each other)", async () => {
      const { governance, treasury, admin } = await loadFixture(createSamoohFixture);
      expect(await governance.treasury()).to.equal(await treasury.getAddress());
      expect(await treasury.governance()).to.equal(await governance.getAddress());
      expect(await governance.isMember(admin.address)).to.equal(true);
    });
  });

  describe("Membership", () => {
    it("3. owner can add a member, emits MemberAdded", async () => {
      const { governance, admin, member2 } = await loadFixture(createSamoohFixture);
      await expect(governance.connect(admin).addMember(member2.address))
        .to.emit(governance, "MemberAdded")
        .withArgs(member2.address, anyValue);
    });

    it("3b. added member is reflected in isMember/memberCount/getMembers", async () => {
      const { governance, admin, member2 } = await loadFixture(createSamoohFixture);
      await governance.connect(admin).addMember(member2.address);
      expect(await governance.isMember(member2.address)).to.equal(true);
      expect(await governance.memberCount()).to.equal(2);
      expect(await governance.getMembers()).to.include(member2.address);
    });

    it("4. duplicate member addition reverts with AlreadyMember", async () => {
      const { governance, admin } = await loadFixture(createSamoohFixture);
      await expect(governance.connect(admin).addMember(admin.address)).to.be.revertedWithCustomError(
        governance,
        "AlreadyMember"
      );
    });

    it("5. owner can remove a member, emits MemberRemoved", async () => {
      const { governance, admin, member2 } = await loadFixture(createSamoohFixture);
      await governance.connect(admin).addMember(member2.address);
      await expect(governance.connect(admin).removeMember(member2.address))
        .to.emit(governance, "MemberRemoved")
        .withArgs(member2.address, anyValue);
      expect(await governance.isMember(member2.address)).to.equal(false);
    });

    it("removing a non-member reverts with NotMember", async () => {
      const { governance, admin, outsider } = await loadFixture(createSamoohFixture);
      await expect(governance.connect(admin).removeMember(outsider.address)).to.be.revertedWithCustomError(
        governance,
        "NotMember"
      );
    });

    it("only owner can add/remove members", async () => {
      const { governance, member2, outsider } = await loadFixture(createSamoohFixture);
      await expect(governance.connect(outsider).addMember(member2.address)).to.be.reverted;
    });
  });

  describe("Proposals & Voting", () => {
    it("6. non-member cannot vote", async () => {
      const { governance, admin, outsider } = await loadFixture(createSamoohFixture);
      await governance.connect(admin).createProposal(ethers.ZeroAddress, 0, "ipfs://x", ONE_DAY);
      await expect(governance.connect(outsider).vote(1, true)).to.be.revertedWithCustomError(
        governance,
        "NotMember"
      );
    });

    it("7. member can create a proposal, emits ProposalCreated", async () => {
      const { governance, admin, recipient } = await loadFixture(createSamoohFixture);
      await expect(governance.connect(admin).createProposal(recipient.address, 100, "ipfs://x", ONE_DAY)).to.emit(
        governance,
        "ProposalCreated"
      );
      const proposal = await governance.getProposal(1);
      expect(proposal.proposer).to.equal(admin.address);
      expect(proposal.recipient).to.equal(recipient.address);
      expect(proposal.amount).to.equal(100);
    });

    it("8. non-member cannot create a proposal", async () => {
      const { governance, outsider, recipient } = await loadFixture(createSamoohFixture);
      await expect(
        governance.connect(outsider).createProposal(recipient.address, 100, "ipfs://x", ONE_DAY)
      ).to.be.revertedWithCustomError(governance, "NotMember");
    });

    it("createProposal reverts when amount > 0 but recipient is zero address", async () => {
      const { governance, admin } = await loadFixture(createSamoohFixture);
      await expect(
        governance.connect(admin).createProposal(ethers.ZeroAddress, 100, "ipfs://x", ONE_DAY)
      ).to.be.revertedWithCustomError(governance, "InvalidRecipient");
    });

    it("9. YES vote recorded, emits VoteCast", async () => {
      const { governance, admin } = await loadFixture(createSamoohFixture);
      await governance.connect(admin).createProposal(ethers.ZeroAddress, 0, "ipfs://x", ONE_DAY);
      await expect(governance.connect(admin).vote(1, true)).to.emit(governance, "VoteCast").withArgs(1, admin.address, true);
      const [votesFor] = await governance.getVoteCounts(1);
      expect(votesFor).to.equal(1);
    });

    it("10. NO vote recorded correctly", async () => {
      const { governance, admin, member2 } = await loadFixture(createSamoohFixture);
      await governance.connect(admin).addMember(member2.address);
      await governance.connect(admin).createProposal(ethers.ZeroAddress, 0, "ipfs://x", ONE_DAY);
      await governance.connect(member2).vote(1, false);
      const [votesFor, votesAgainst] = await governance.getVoteCounts(1);
      expect(votesFor).to.equal(0);
      expect(votesAgainst).to.equal(1);
    });

    it("11. double voting by same member reverts with AlreadyVoted", async () => {
      const { governance, admin } = await loadFixture(createSamoohFixture);
      await governance.connect(admin).createProposal(ethers.ZeroAddress, 0, "ipfs://x", ONE_DAY);
      await governance.connect(admin).vote(1, true);
      await expect(governance.connect(admin).vote(1, true)).to.be.revertedWithCustomError(governance, "AlreadyVoted");
    });

    it("12. voting after the deadline reverts with VotingClosed", async () => {
      const { governance, admin } = await loadFixture(createSamoohFixture);
      await governance.connect(admin).createProposal(ethers.ZeroAddress, 0, "ipfs://x", ONE_DAY);
      await time.increase(ONE_DAY + 1);
      await expect(governance.connect(admin).vote(1, true)).to.be.revertedWithCustomError(governance, "VotingClosed");
    });
  });

  describe("Quorum & Approval math", () => {
    it("13. quorum = ceil(memberCount * 50 / 100) for several member counts", async () => {
      const { governance, admin, member2, member3, member4 } = await loadFixture(createSamoohFixture);
      // memberCount = 1 -> quorum = ceil(0.5) = 1
      await governance.connect(admin).createProposal(ethers.ZeroAddress, 0, "ipfs://x", ONE_DAY);
      let [required] = await governance.getQuorum(1);
      expect(required).to.equal(1);

      // memberCount = 3 (odd) -> quorum = ceil(1.5) = 2
      await governance.connect(admin).addMember(member2.address);
      await governance.connect(admin).addMember(member3.address);
      await governance.connect(admin).createProposal(ethers.ZeroAddress, 0, "ipfs://x", ONE_DAY);
      [required] = await governance.getQuorum(2);
      expect(required).to.equal(2);

      // memberCount = 4 (even) -> quorum = ceil(2) = 2
      await governance.connect(admin).addMember(member4.address);
      await governance.connect(admin).createProposal(ethers.ZeroAddress, 0, "ipfs://x", ONE_DAY);
      [required] = await governance.getQuorum(3);
      expect(required).to.equal(2);
    });

    it("14. approval requires strictly votesFor > votesAgainst after quorum met (tie is not approved)", async () => {
      const { governance, admin, member2, member3, member4 } = await loadFixture(createSamoohFixture);
      await governance.connect(admin).addMember(member2.address);
      await governance.connect(admin).addMember(member3.address);
      await governance.connect(admin).addMember(member4.address); // 4 members, quorum = 2

      await governance.connect(admin).createProposal(ethers.ZeroAddress, 0, "ipfs://x", ONE_DAY);
      await governance.connect(admin).vote(1, true);
      await governance.connect(member2).vote(1, false);
      // 1 for / 1 against -> quorum met (2 >= 2) but tie -> not approved
      await time.increase(ONE_DAY + 1);
      expect(await governance.getProposalState(1)).to.equal(2); // Rejected

      await governance.connect(admin).createProposal(ethers.ZeroAddress, 0, "ipfs://x", ONE_DAY);
      await governance.connect(admin).vote(2, true);
      await governance.connect(member2).vote(2, true);
      await governance.connect(member3).vote(2, false);
      // 2 for / 1 against -> approved
      await time.increase(ONE_DAY + 1);
      expect(await governance.getProposalState(2)).to.equal(1); // Approved
    });

    it("15. rejection path: quorum met, votesAgainst >= votesFor -> Rejected, emits ProposalRejected", async () => {
      const { governance, admin, member2 } = await loadFixture(createSamoohFixture);
      await governance.connect(admin).addMember(member2.address); // 2 members, quorum = 1
      await governance.connect(admin).createProposal(ethers.ZeroAddress, 0, "ipfs://x", ONE_DAY);
      await governance.connect(admin).vote(1, false);
      await time.increase(ONE_DAY + 1);
      await expect(governance.resolveProposal(1)).to.emit(governance, "ProposalRejected").withArgs(1, 0, 1);
      expect(await governance.getProposalState(1)).to.equal(2); // Rejected
    });

    it("16. expiry path: quorum not met by deadline -> Expired, no approve/reject event", async () => {
      const { governance, admin, member2, member3 } = await loadFixture(createSamoohFixture);
      await governance.connect(admin).addMember(member2.address);
      await governance.connect(admin).addMember(member3.address); // 3 members, quorum = 2
      await governance.connect(admin).createProposal(ethers.ZeroAddress, 0, "ipfs://x", ONE_DAY);
      await governance.connect(admin).vote(1, true); // only 1 vote cast, quorum needs 2
      await time.increase(ONE_DAY + 1);
      const tx = await governance.resolveProposal(1);
      await expect(tx).to.not.emit(governance, "ProposalApproved");
      await expect(tx).to.not.emit(governance, "ProposalRejected");
      expect(await governance.getProposalState(1)).to.equal(3); // Expired
    });
  });

  describe("Execution", () => {
    it("17. executing a non-Approved proposal reverts with ProposalNotApproved", async () => {
      const { governance, admin } = await loadFixture(createSamoohFixture);
      await governance.connect(admin).createProposal(ethers.ZeroAddress, 0, "ipfs://x", ONE_DAY);
      await expect(governance.connect(admin).executeProposal(1)).to.be.revertedWithCustomError(
        governance,
        "ProposalNotApproved"
      );
    });

    it("18. approved proposal executes, moves funds, emits ProposalExecuted + TreasuryTransfer", async () => {
      const { governance, treasury, admin, recipient } = await loadFixture(createSamoohFixture);
      await admin.sendTransaction({ to: await treasury.getAddress(), value: ethers.parseEther("1") });

      await governance
        .connect(admin)
        .createProposal(recipient.address, ethers.parseEther("0.5"), "ipfs://x", ONE_DAY);
      await governance.connect(admin).vote(1, true);
      await time.increase(ONE_DAY + 1);

      const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
      await expect(governance.connect(admin).executeProposal(1))
        .to.emit(governance, "ProposalExecuted")
        .withArgs(1, recipient.address, ethers.parseEther("0.5"))
        .and.to.emit(treasury, "TreasuryTransfer")
        .withArgs(1, recipient.address, ethers.parseEther("0.5"));

      const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(ethers.parseEther("0.5"));
      expect(await treasury.getBalance()).to.equal(ethers.parseEther("0.5"));
    });

    it("19. a proposal cannot execute twice", async () => {
      const { governance, treasury, admin, recipient } = await loadFixture(createSamoohFixture);
      await admin.sendTransaction({ to: await treasury.getAddress(), value: ethers.parseEther("1") });
      await governance
        .connect(admin)
        .createProposal(recipient.address, ethers.parseEther("0.1"), "ipfs://x", ONE_DAY);
      await governance.connect(admin).vote(1, true);
      await time.increase(ONE_DAY + 1);
      await governance.connect(admin).executeProposal(1);
      await expect(governance.connect(admin).executeProposal(1)).to.be.revertedWithCustomError(
        governance,
        "AlreadyExecuted"
      );
    });
  });

  describe("Treasury", () => {
    it("20. deposit works, emits TreasuryDeposit, balance updates", async () => {
      const { treasury, admin } = await loadFixture(createSamoohFixture);
      await expect(treasury.connect(admin).deposit({ value: ethers.parseEther("2") }))
        .to.emit(treasury, "TreasuryDeposit")
        .withArgs(admin.address, ethers.parseEther("2"));
      expect(await treasury.getBalance()).to.equal(ethers.parseEther("2"));
    });

    it("21. getBalance returns the correct value", async () => {
      const { treasury, admin } = await loadFixture(createSamoohFixture);
      await treasury.connect(admin).deposit({ value: ethers.parseEther("3.25") });
      expect(await treasury.getBalance()).to.equal(ethers.parseEther("3.25"));
    });

    it("22. execution with insufficient treasury balance reverts cleanly, no partial transfer", async () => {
      const { governance, treasury, admin, recipient } = await loadFixture(createSamoohFixture);
      // No deposit made — treasury balance is 0.
      await governance
        .connect(admin)
        .createProposal(recipient.address, ethers.parseEther("1"), "ipfs://x", ONE_DAY);
      await governance.connect(admin).vote(1, true);
      await time.increase(ONE_DAY + 1);
      await expect(governance.connect(admin).executeProposal(1)).to.be.revertedWithCustomError(
        treasury,
        "InsufficientBalance"
      );
      expect(await treasury.getBalance()).to.equal(0);
    });

    it("23. Treasury.executeTransfer reverts when called by anything other than governance (even its own deployer)", async () => {
      const { treasury, admin, recipient } = await loadFixture(createSamoohFixture);
      await admin.sendTransaction({ to: await treasury.getAddress(), value: ethers.parseEther("1") });
      await expect(
        treasury.connect(admin).executeTransfer(1, recipient.address, ethers.parseEther("0.1"))
      ).to.be.revertedWithCustomError(treasury, "NotGovernance");
    });

    it("setGovernance can only be called once, and only by the factory", async () => {
      const { treasury, admin, governance } = await loadFixture(createSamoohFixture);
      await expect(treasury.connect(admin).setGovernance(admin.address)).to.be.reverted;
    });
  });

  describe("End-to-end flow", () => {
    it("24. full flow: create -> add members -> propose -> vote -> quorum+approval -> execute", async () => {
      const { factory, admin, member2, member3, recipient } = await loadFixture(deployFactoryFixture);

      const tx = await factory.createSamooh(admin.address, [admin.address]);
      const receipt = await tx.wait();
      const parsed = receipt!.logs
        .map((log) => {
          try {
            return factory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((p) => p?.name === "SamoohCreated");

      const governance = (await ethers.getContractAt(
        "SamoohGovernance",
        parsed!.args.governance as string
      )) as unknown as SamoohGovernance;
      const treasury = (await ethers.getContractAt(
        "SamoohTreasury",
        parsed!.args.treasury as string
      )) as unknown as SamoohTreasury;

      await governance.connect(admin).addMember(member2.address);
      await governance.connect(admin).addMember(member3.address);

      await admin.sendTransaction({ to: await treasury.getAddress(), value: ethers.parseEther("5") });

      await governance
        .connect(admin)
        .createProposal(recipient.address, ethers.parseEther("2"), "ipfs://proposal-1", ONE_DAY);

      await governance.connect(admin).vote(1, true);
      await governance.connect(member2).vote(1, true);
      await governance.connect(member3).vote(1, false);

      await time.increase(ONE_DAY + 1);

      expect(await governance.getProposalState(1)).to.equal(1); // Approved (2 for > 1 against)

      const treasuryBalanceBefore = await treasury.getBalance();
      const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);

      await governance.connect(member2).executeProposal(1);

      expect(await treasury.getBalance()).to.equal(treasuryBalanceBefore - ethers.parseEther("2"));
      expect(await ethers.provider.getBalance(recipient.address)).to.equal(
        recipientBalanceBefore + ethers.parseEther("2")
      );
      expect((await governance.getProposal(1)).state).to.equal(4); // Executed
    });
  });
});
