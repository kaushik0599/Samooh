import { withErrorHandling, created } from "@/lib/api/response";
import {
  requireString,
  optionalString,
  optionalStringArray,
  requireWalletAddress,
} from "@/lib/validation";
import { createSamooh } from "@/lib/services/samooh.service";

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const body = await req.json();

    const input = {
      name: requireString(body.name, "name", { max: 200 }),
      description: optionalString(body.description, "description", { max: 2000 }),
      creator_wallet: requireWalletAddress(body.creator_wallet, "creator_wallet"),
      governance_contract: requireWalletAddress(
        body.governance_contract,
        "governance_contract"
      ),
      treasury_contract: requireWalletAddress(
        body.treasury_contract,
        "treasury_contract"
      ),
      network: optionalString(body.network, "network", { max: 50 }) ?? "polygon-amoy",
      // Discovery metadata — all optional so existing callers keep working.
      category: optionalString(body.category, "category", { max: 100 }),
      purpose: optionalString(body.purpose, "purpose", { max: 500 }),
      region: optionalString(body.region, "region", { max: 100 }),
      objectives: optionalStringArray(body.objectives, "objectives", { maxLength: 200 }),
      membership_open: body.membership_open === undefined ? true : Boolean(body.membership_open),
    };

    const samooh = await createSamooh(input);
    return created(samooh);
  });
}
