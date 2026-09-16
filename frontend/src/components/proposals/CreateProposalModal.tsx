"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createProposal, draftProposalFromSarthi } from "@/lib/api/endpoints";
import { describeApiError } from "@/lib/api/client";
import { isDemoMode } from "@/lib/demo/config";
import type { Proposal } from "@samooh/types";

export interface CreateProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  samoohId: string;
  walletAddress: string;
  /**
   * "sarthi" routes the submit through `POST /api/sarthi/proposal` instead
   * of `POST /api/proposals` — same metadata-only-draft guarantee, just a
   * different origin recorded on the backend. Defaults to "manual".
   */
  origin?: "manual" | "sarthi";
  initialTitle?: string;
  initialDescription?: string;
  onCreated?: (proposal: Proposal) => void;
}

/**
 * Single review-before-submit proposal creation surface. Used both by the
 * manual "New proposal" button (app/(workspace)/proposals/page.tsx) and by
 * Sarthi's "Draft a proposal" action (app/(workspace)/sarthi/page.tsx,
 * pre-filled from the insight) — either way the user sees and can edit the
 * title/description/amount/recipient before anything is created, and the
 * result is always a DRAFT: metadata only, never votes/approves/executes.
 */
export function CreateProposalModal({
  open,
  onOpenChange,
  samoohId,
  walletAddress,
  origin = "manual",
  initialTitle = "",
  initialDescription = "",
  onCreated,
}: CreateProposalModalProps) {
  const { show } = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [titleError, setTitleError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-seed on every open (not just mount) so a fresh Sarthi insight, or a
  // fresh manual click, always starts from a clean/prefilled form rather
  // than whatever was left over from the previous open.
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setDescription(initialDescription);
      setAmount("");
      setRecipient("");
      setTitleError(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTitle, initialDescription]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setTitleError("Title is required.");
      return;
    }

    if (isDemoMode()) {
      // This Samooh/wallet are fixture data (see lib/demo/data.ts) — never
      // send them to the real backend. Honest, not a fabricated success.
      show("Demo Mode — creating a real proposal requires a connected wallet.", "info");
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const input = {
        samooh_id: samoohId,
        title: title.trim(),
        description: description.trim() || undefined,
        amount: amount.trim() || undefined,
        recipient: recipient.trim() || undefined,
        created_by: walletAddress,
      };
      const proposal =
        origin === "sarthi" ? await draftProposalFromSarthi(input) : await createProposal(input);
      show("Proposal draft created.", "success");
      onCreated?.(proposal);
      onOpenChange(false);
    } catch (err) {
      show(describeApiError("Could not create the proposal draft. Please try again.", err), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New proposal"
      description={
        isDemoMode()
          ? "Demo Mode preview — this form is fully interactive, but submitting won't create a real proposal (no wallet is connected)."
          : "This creates a draft only — metadata saved to this Samooh's records. It never votes, approves, executes, or moves funds; submitting on-chain happens separately through your wallet."
      }
    >
      <div className="space-y-4">
        <Input
          label="Title"
          placeholder="e.g. Bulk raw material purchase"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) setTitleError(undefined);
          }}
          error={titleError}
          autoFocus
        />
        <Textarea
          label="Description"
          placeholder="What is this proposal for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount"
            hint="Optional"
            placeholder="e.g. 500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            label="Recipient"
            hint="Optional"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Create draft
          </Button>
        </div>
      </div>
    </Modal>
  );
}
