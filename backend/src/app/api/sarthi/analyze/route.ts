import { withErrorHandling, created } from "@/lib/api/response";
import { requireUuid } from "@/lib/validation";
import { buildSarthiContext } from "@/lib/sarthi/context";
import { getSarthiProvider } from "@/lib/sarthi/provider";
import { saveSarthiInsight } from "@/lib/services/sarthi.service";
import { parseJsonBody } from "../parse-body";

/**
 * Runs Sarthi's advisory analysis over a Samooh's current data and
 * persists the resulting insights. Sarthi never votes, approves, rejects,
 * executes, or moves funds — this only writes to sarthi_insights.
 */
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const body = await parseJsonBody(req);
    const samoohId = requireUuid(body.samooh_id, "samooh_id");

    const ctx = await buildSarthiContext(samoohId);
    const provider = getSarthiProvider();
    const drafts = await provider.analyze(ctx);

    const saved = await Promise.all(
      drafts.map((draft) => saveSarthiInsight({ ...draft, samooh_id: samoohId }))
    );

    return created(saved);
  });
}
