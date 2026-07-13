import Link from "next/link";
import { Panel } from "@/design-system/Panel";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-12">
      <h1 className="text-2xl font-bold">Log in</h1>
      <Panel>
        <p className="text-sm text-[var(--fw-color-muted-strong)]">
          Authentication UI lands in Workstream 01 (Supabase Auth). This route
          is a compile-ready stub for navigation and layout work.
        </p>
        <p className="mt-4 text-sm">
          <Link
            className="text-[var(--fw-color-link)] hover:text-[var(--fw-color-link-hover)]"
            href="/"
          >
            Back home
          </Link>
        </p>
      </Panel>
    </main>
  );
}
