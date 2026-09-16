import { redirect } from "next/navigation";

/**
 * A discovery match and a directly-linked Samooh preview show identical
 * content, so this route defers to the one canonical preview page
 * (app/(public)/samooh/[samoohId]) instead of duplicating it.
 */
export default async function DiscoverSamoohRedirect({
  params,
}: {
  params: Promise<{ samoohId: string }>;
}) {
  const { samoohId } = await params;
  redirect(`/samooh/${samoohId}`);
}
