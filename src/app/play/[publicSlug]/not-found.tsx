import { Panel } from "@/design-system/Panel";

/**
 * Generic public not-found — never reveals whether a private activity exists.
 */
export default function PublicPlayNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">Activity not available</h1>
      <Panel>
        <p className="text-sm text-[var(--fw-color-muted-strong)]">
          This play link is missing, private, or no longer available. Check the
          link with the person who shared it.
        </p>
      </Panel>
    </main>
  );
}
