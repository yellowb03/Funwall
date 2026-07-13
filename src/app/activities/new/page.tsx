import Link from "next/link";
import { redirect } from "next/navigation";
import { getProductRegistry } from "@/features/templates/registry";
import { TEMPLATE_KEYS } from "@/domain/template-keys";
import { Panel } from "@/design-system/Panel";
import { ProgressStrip } from "@/design-system/ProgressStrip";
import { Button } from "@/design-system/Button";
import { getOwnerSession } from "@/features/auth/session";
import { createActivityAction } from "@/features/activities/actions";

export default async function NewActivityPage() {
  const session = await getOwnerSession();
  if (!session) {
    redirect("/login?next=/activities/new");
  }

  const registry = getProductRegistry();
  const registered = new Set(registry.keys());

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <ProgressStrip
        activeIndex={0}
        steps={[
          { id: "pick", label: "Pick a template" },
          { id: "content", label: "Enter content" },
          { id: "play", label: "Play" },
        ]}
      />

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Pick a template</h1>
        <p className="text-sm text-[var(--fw-color-muted)]">
          Six launch templates. Only registered packages are selectable.
          {session.label ? (
            <span className="ml-2 rounded-[var(--fw-radius-sm)] bg-[var(--fw-color-warning-subtle)] px-2 py-0.5 text-xs font-semibold text-[var(--fw-color-warning)]">
              {session.label}
            </span>
          ) : null}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATE_KEYS.map((key) => {
          const isReady = registered.has(key);
          const meta = isReady ? registry.get(key).metadata : null;
          return (
            <Panel
              key={key}
              className={
                isReady
                  ? "border-[var(--fw-color-primary-light)]"
                  : "opacity-70"
              }
            >
              <div className="mb-3 h-20 rounded-[var(--fw-radius-sm)] bg-[var(--fw-color-tile-pale)]" />
              <h2 className="font-semibold capitalize">
                {meta?.displayName ?? key.replace(/-/g, " ")}
              </h2>
              <p className="mt-1 text-sm text-[var(--fw-color-muted)]">
                {meta?.description ?? "Registration pending from activity agent."}
              </p>
              <div className="mt-4">
                {isReady ? (
                  <form action={createActivityAction}>
                    <input type="hidden" name="templateKey" value={key} />
                    <Button type="submit" variant="primary" className="w-full">
                      Create draft
                    </Button>
                  </form>
                ) : (
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--fw-color-muted-strong)]">
                    Not registered yet
                  </p>
                )}
              </div>
            </Panel>
          );
        })}
      </div>

      <p className="text-sm">
        <Link className="text-[var(--fw-color-link)]" href="/activities">
          Cancel
        </Link>
      </p>
    </main>
  );
}
