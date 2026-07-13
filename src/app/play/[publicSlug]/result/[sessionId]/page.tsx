import { notFound } from "next/navigation";
import Link from "next/link";
import { Panel } from "@/design-system/Panel";

/**
 * Result review route shell.
 * In-session review is handled inside PlayerShell after complete.
 * Deep-linked session lookup requires Workstream 01 persistence.
 * Invalid IDs → generic not-found (no existence leak).
 */
export default async function PublicResultPage({
  params,
}: {
  params: Promise<{ publicSlug: string; sessionId: string }>;
}) {
  const { publicSlug, sessionId } = await params;

  const looksLikeId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      sessionId,
    );

  if (!looksLikeId) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-bold">Result</h1>
      <Panel>
        <p className="text-sm text-[var(--fw-color-muted-strong)]">
          This result link is not available yet. Play the activity again to see
          a summary on completion.
        </p>
        <p className="mt-4">
          <Link
            href={`/play/${encodeURIComponent(publicSlug)}`}
            className="font-semibold text-[var(--fw-color-link)] hover:text-[var(--fw-color-link-hover)]"
          >
            Back to play
          </Link>
        </p>
      </Panel>
    </main>
  );
}
