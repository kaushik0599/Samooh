import { ProposalDetailClient } from "./ProposalDetailClient";

// Server Component: awaits the Next.js 15 async `params` directly rather
// than using React's `use()` hook, which requires React 19 (this app
// pins React 18.3.1 — see Sprint 0 report).
export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const { proposalId } = await params;
  return <ProposalDetailClient proposalId={proposalId} />;
}
