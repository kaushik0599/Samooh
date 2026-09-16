import { withErrorHandling, ok } from "@/lib/api/response";
import { requireUuid } from "@/lib/validation";
import { listProposals } from "@/lib/services/proposals.service";
import { reconcileProposalStatus } from "@/lib/services/reconcile.service";
import { getSamoohById } from "@/lib/services/samooh.service";

export async function GET(
  _req: Request,
  context: { params: Promise<{ samoohId: string }> }
) {
  return withErrorHandling(async () => {
    const { samoohId } = await context.params;
    const id = requireUuid(samoohId, "samoohId");
    const [samooh, proposals] = await Promise.all([
      getSamoohById(id),
      listProposals(id),
    ]);

    // Blockchain is the authority on proposal status; the DB value is only a
    // cache. Reconcile each proposal against on-chain state before returning.
    const reconciled = await Promise.all(
      proposals.map((p) => reconcileProposalStatus(p, samooh.governance_contract))
    );

    return ok(reconciled);
  });
}
