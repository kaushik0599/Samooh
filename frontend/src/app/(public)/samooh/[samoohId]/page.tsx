import { SamoohPreviewClient } from "./SamoohPreviewClient";

// Server Component: awaits the Next.js 15 async `params` directly rather
// than using React's `use()` hook, which requires React 19 (this app
// pins React 18.3.1 — see Sprint 0 report).
export default async function SamoohPreviewPage({
  params,
}: {
  params: Promise<{ samoohId: string }>;
}) {
  const { samoohId } = await params;
  return <SamoohPreviewClient samoohId={samoohId} />;
}
