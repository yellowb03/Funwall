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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6">
      <PlayerShell snapshot={snapshot} port={port} />
    </div>
  );
}
