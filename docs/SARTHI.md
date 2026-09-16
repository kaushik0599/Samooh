# Sarthi

Advisory-only intelligence layer. Sarthi recommends; it never decides or acts.

## Pipeline

```
Collective data (Supabase + best-effort treasury balance)
  -> src/lib/sarthi/context.ts   (buildSarthiContext)
  -> src/lib/sarthi/provider.ts  (getSarthiProvider -> SarthiProvider.analyze)
  -> src/lib/sarthi/analyzer.ts  (analyzeCollective: deterministic rules)
  -> sarthi_insights table (via POST /api/sarthi/analyze)
  -> optional proposal DRAFT (via POST /api/sarthi/proposal)
```

## MVP implementation

`analyzeCollective` is deterministic — plain rules over member count,
proposal outcomes, activity events, and treasury balance. No external AI
API is required or used. This is intentionally NOT described as AI/ML
anywhere in the code or docs.

Rules currently implemented (see `src/lib/sarthi/analyzer.ts`):
- No proposals yet despite having members -> `governance` insight.
- High proposal rejection rate -> `bottleneck` insight.
- Idle treasury balance with no active proposals -> `treasury` insight.
- Recent member growth -> `growth` insight.
- Low voting participation relative to member count -> `participation` insight.

## Swapping in a real AI provider later

`SarthiProvider` (`src/lib/sarthi/provider.ts`) is the only seam callers
depend on. Add a new class implementing `analyze(ctx): Promise<SarthiInsightDraft[]>`
and switch `getSarthiProvider()` to return it — no other file changes.

## Formation suggestions (discovery)

`src/lib/sarthi/formation.ts:suggestSamoohFormation` is a second,
independent deterministic rule: when `GET /api/discover/samoohs` finds no
relevant Samooh, it derives a `SamoohFormationSuggestion` (title, purpose,
objectives, reason) from the user's onboarding profile alone — no DB
writes, no Samooh created. It only shapes the API response so the frontend
can prefill a "Start a Samooh" form; a human still submits it via the
existing `POST /api/samooh`.

## Hard limits (enforced by convention + tests)

Sarthi cannot vote, approve, reject, execute, or transfer funds. It only
ever produces `SarthiInsight` drafts (`POST /api/sarthi/analyze`) or a
proposal `DRAFT` (`POST /api/sarthi/proposal`) — both metadata-only writes.
See `src/__tests__/sarthi-analyzer.test.ts`.
