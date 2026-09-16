import { withErrorHandling, ok } from "@/lib/api/response";
import { requireUuid } from "@/lib/validation";
import { listActivity } from "@/lib/services/activity.service";

export async function GET(
  _req: Request,
  context: { params: Promise<{ samoohId: string }> }
) {
  return withErrorHandling(async () => {
    const { samoohId } = await context.params;
    const id = requireUuid(samoohId, "samoohId");
    const activity = await listActivity(id);
    return ok(activity);
  });
}
