import type { SarthiContext } from "./context";
import type { CreateSarthiInsightInput } from "@/lib/services/sarthi.service";
import { analyzeCollective } from "./analyzer";

export type SarthiInsightDraft = Omit<CreateSarthiInsightInput, "samooh_id">;

export interface SarthiProvider {
  analyze(ctx: SarthiContext): Promise<SarthiInsightDraft[]>;
}

/** Rule-based provider — no external AI API required for the MVP. */
class DeterministicSarthiProvider implements SarthiProvider {
  async analyze(ctx: SarthiContext): Promise<SarthiInsightDraft[]> {
    return analyzeCollective(ctx);
  }
}

/**
 * Single seam for swapping in a real AI-backed provider later without
 * touching callers (API routes only depend on this factory + the
 * SarthiProvider interface).
 */
export function getSarthiProvider(): SarthiProvider {
  return new DeterministicSarthiProvider();
}
