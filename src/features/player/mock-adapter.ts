import type { PlayerAdapter, PlayerAdapterContext } from "@/features/player/types";

/**
 * No-op player adapter for contract tests and scaffolds.
 * Workstream 03 owns the real shell; templates own stage adapters.
 */
export function createNoopPlayerAdapter(): PlayerAdapter {
  let mounted = false;

  return {
    async mount(context: PlayerAdapterContext) {
      mounted = true;
      context.lifecycle.onReady();
    },
    unmount() {
      mounted = false;
    },
    pause() {
      if (!mounted) return;
    },
    resume() {
      if (!mounted) return;
    },
    restart() {
      if (!mounted) return;
    },
  };
}

export async function loadNoopPlayerAdapterModule() {
  return {
    createPlayerAdapter: createNoopPlayerAdapter,
  };
}
