import { ethers } from "hardhat";

/// Deploys SamoohFactory and, as a sanity check, creates one Samooh
/// through it. Run locally with `npx hardhat run scripts/deploy.ts`
/// (defaults to the local Hardhat network) or against Amoy with
/// `npm run deploy:amoy` once POLYGON_AMOY_RPC_URL and PRIVATE_KEY are
/// set in contracts/.env.
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Factory = await ethers.getContractFactory("SamoohFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  console.log("SamoohFactory deployed to:", await factory.getAddress());

  const tx = await factory.createSamooh(deployer.address, [deployer.address]);
  const receipt = await tx.wait();

  const event = receipt?.logs
    .map((log) => {
      try {
        return factory.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed?.name === "SamoohCreated");

  if (event) {
    console.log("Sample Samooh created:");
    console.log("  Governance:", event.args.governance);
    console.log("  Treasury:  ", event.args.treasury);
    console.log("  Admin:     ", event.args.admin);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
