import type { JoinRequestStatus as Status } from "@samooh/types";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

const toneByStatus: Record<Status, BadgeTone> = {
  REQUESTED: "warning",
  APPROVED: "success",
  REJECTED: "error",
  CANCELLED: "neutral",
};

const labelByStatus: Record<Status, string> = {
  REQUESTED: "Request pending",
  APPROVED: "Approved",
  REJECTED: "Not approved",
  CANCELLED: "Cancelled",
};

export function JoinRequestStatus({ status }: { status: Status }) {
  return (
    <Badge tone={toneByStatus[status]} showDot>
      {labelByStatus[status]}
    </Badge>
  );
}
