import { Panel } from "@/design-system/Panel";

export default async function PublicPlayPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = await params;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-bold">Play</h1>
      <Panel>
        <p className="text-sm text-[var(--fw-color-muted-strong)]">
          Public player shell (Workstream 03) resolves slug{" "}
          <code className="rounded bg-[var(--fw-color-surface-sunken)] px-1">
            {publicSlug}
          </code>{" "}
          to a sanitized activity snapshot. No owner controls appear here.
        </p>
      </Panel>
    </main>
  );
}
