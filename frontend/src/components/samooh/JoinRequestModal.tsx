"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { joinSamooh } from "@/lib/api/endpoints";
import { ApiClientError, describeApiError } from "@/lib/api/client";
import { useToast } from "@/components/ui/Toast";

export interface JoinRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  samoohId: string;
  samoohName: string;
  walletAddress: string;
  onRequested: () => void;
}

export function JoinRequestModal({
  open,
  onOpenChange,
  samoohId,
  samoohName,
  walletAddress,
  onRequested,
}: JoinRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show } = useToast();

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await joinSamooh(samoohId, walletAddress);
      show("Join request sent.", "success");
      onRequested();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiClientError && err.status === 409
          ? "You already have an active request for this Samooh."
          : describeApiError("Could not send the join request. Please try again.", err);
      show(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Request to join ${samoohName}`}
      description="This sends a request only — it does not make you a member. An admin reviews every request before membership is granted."
    >
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} isLoading={isSubmitting}>
          Send request
        </Button>
      </div>
    </Modal>
  );
}
