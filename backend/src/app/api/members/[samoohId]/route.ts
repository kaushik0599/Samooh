import { withErrorHandling, ok } from "@/lib/api/response";
import { requireUuid } from "@/lib/validation";
import { listMembers } from "@/lib/services/members.service";

export async function GET(
  _req: Request,
  context: { params: Promise<{ samoohId: string }> }
) {
  return withErrorHandling(async () => {
    const { samoohId } = await context.params;
    const id = requireUuid(samoohId, "samoohId");
    const members = await listMembers(id);
    return ok(members);
  });
}
