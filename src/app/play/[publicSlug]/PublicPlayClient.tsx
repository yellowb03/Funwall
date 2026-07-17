"use client";

import { useMemo } from "react";
import type { PublicActivitySnapshot } from "@/domain/snapshot";
import { PlayerShell } from "@/features/player/shell/PlayerShell";
import { createMemoryPublicPlayPort } from "@/features/player/session/memory-public-play-port";

/**
 * Client boundary for public play.
 * Uses memory port seeded with the server-resolved snapshot until
 * Workstream 01 wires a real PublicPlayPort over Supabase RPCs.
 */
export function PublicPlayClient({
  snapshot,
}: {
  snapshot: PublicActivitySnapshot;
}) {
  const port = useMemo(
    () =>
      createMemoryPublicPlayPort({
        snapshots: { [snapshot.publicSlug]: snapshot },
      }),
    [snapshot],
  );

  return (
    <main id="main-content" className="flex min-h-dvh w-full items-center justify-center bg-[var(--fw-color-ink)] p-3 sm:p-6">
      <div className="w-full max-w-5xl">
        <div className="mb-3 flex items-center justify-between px-1 text-white/80">
          <span className="text-sm font-bold tracking-[-.02em]">funwall</span>
          <span className="text-xs font-semibold uppercase tracking-[.12em]">{snapshot.templateKey.replaceAll("-", " ")}</span>
        </div>
        <PlayerShell snapshot={snapshot} port={port} />
      </div>
    </main>
  );
}
