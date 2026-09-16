import { withErrorHandling, ok } from "@/lib/api/response";
import { requireUuid } from "@/lib/validation";
import { getSamoohById } from "@/lib/services/samooh.service";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await context.params;
    const samoohId = requireUuid(id, "id");
    const samooh = await getSamoohById(samoohId);
    return ok(samooh);
  });
}
