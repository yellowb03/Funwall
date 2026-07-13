"use client";

import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { WordsearchContentV1 } from "@/domain/content/wordsearch.v1";
import type { PlayerAdapter, PlayerAdapterContext } from "@/features/player/types";
import { WordsearchPlayer } from "@/features/templates/wordsearch/player/WordsearchPlayer";
import {
  defaultWordsearchSettings,
  migrateWordsearchSettings,
  type WordsearchSettings,
} from "@/features/templates/wordsearch/settings";
import type { WordsearchSessionState } from "@/features/templates/wordsearch/session";

function parseContent(raw: unknown): WordsearchContentV1 {
  const pack = raw as WordsearchContentV1;
  if (!pack || pack.family !== "wordsearch" || pack.version !== 1) {
    throw new Error("Wordsearch player requires wordsearch.v1 content");
  }
  return pack;
}

function parseSettings(raw: unknown): WordsearchSettings {
  if (raw && typeof raw === "object" && "version" in (raw as object)) {
    const version = Number((raw as { version?: number }).version ?? 0);
    return migrateWordsearchSettings(version, raw);
  }
  return migrateWordsearchSettings(0, raw ?? defaultWordsearchSettings());
}

/**
 * Imperative player adapter for the shell contract.
 * Mounts into `[data-funwall-stage]` via createRoot (same pattern as Wheel).
 */
export function createPlayerAdapter(): PlayerAdapter {
  let root: Root | null = null;
  let host: HTMLElement | null = null;
  let ownsHost = false;
  let context: PlayerAdapterContext | null = null;
  let restartToken = 0;
  let lastSession: WordsearchSessionState | null = null;

  function renderView() {
    if (!root || !context) return;
    const content = parseContent(context.content);
    const settings = parseSettings(context.settings);
    root.render(
      createElement(WordsearchPlayer, {
        content,
        settings,
        rng: context.rng,
        audio: context.audio,
        sessionEvents: context.sessionEvents,
        lifecycle: context.lifecycle,
        themeTokens: context.themeTokens,
        reducedMotion: context.commands.reducedMotion,
        muted: context.commands.muted,
        restartRequested: context.commands.restartRequested || restartToken > 0,
        onSessionChange: (state) => {
          lastSession = state;
          context?.lifecycle.onPauseSafeState({
            phase: state.phase,
            foundOrder: state.foundOrder,
            livesRemaining: state.livesRemaining,
          });
        },
      }),
    );
  }

  return {
    async mount(ctx: PlayerAdapterContext) {
      context = ctx;
      restartToken = 0;

      const existing =
        typeof document !== "undefined"
          ? (document.querySelector(
              "[data-funwall-stage]",
            ) as HTMLElement | null) ??
            document.getElementById("funwall-player-stage")
          : null;

      if (existing) {
        host = existing;
        ownsHost = false;
      } else if (typeof document !== "undefined") {
        host = document.createElement("div");
        host.setAttribute("data-funwall-stage", "wordsearch-internal");
        host.setAttribute("data-testid", "wordsearch-player-host");
        document.body.appendChild(host);
        ownsHost = true;
      } else {
        ctx.lifecycle.onFatalError(
          "wordsearch-no-dom",
          "Wordsearch player requires a DOM environment",
        );
        return;
      }

      root = createRoot(host);
      renderView();
    },

    unmount() {
      if (root) {
        root.unmount();
        root = null;
      }
      if (ownsHost && host?.parentNode) {
        host.parentNode.removeChild(host);
      }
      host = null;
      ownsHost = false;
      context = null;
      lastSession = null;
    },

    pause() {
      if (!context) return;
      context.sessionEvents.emit({
        type: "game.paused",
        elapsedMs: 0,
        metadata: { phase: lastSession?.phase },
      });
    },

    resume() {
      if (!context) return;
      context.sessionEvents.emit({
        type: "game.resumed",
        elapsedMs: 0,
        metadata: { phase: lastSession?.phase },
      });
    },

    restart() {
      if (!context) return;
      restartToken += 1;
      context = {
        ...context,
        commands: {
          ...context.commands,
          restartRequested: true,
        },
      };
      renderView();
      context = {
        ...context,
        commands: {
          ...context.commands,
          restartRequested: false,
        },
      };
    },
  };
}

export async function loadWordsearchPlayerAdapterModule() {
  return {
    createPlayerAdapter,
  };
}
