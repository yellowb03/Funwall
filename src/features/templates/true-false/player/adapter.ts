"use client";

import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { StatementsContentV1 } from "@/domain/content/statements.v1";
import type { PlayerAdapter, PlayerAdapterContext } from "@/features/player/types";
import { TrueFalsePlayer } from "@/features/templates/true-false/player/TrueFalsePlayer";
import {
  defaultTrueFalseSettings,
  migrateTrueFalseSettings,
  type TrueFalseSettings,
} from "@/features/templates/true-false/settings";
import type { TrueFalseSessionState } from "@/features/templates/true-false/session";

function parseContent(raw: unknown): StatementsContentV1 {
  const pack = raw as StatementsContentV1;
  if (!pack || pack.family !== "statements" || pack.version !== 1) {
    throw new Error("True/False player requires statements.v1 content");
  }
  return pack;
}

function parseSettings(raw: unknown): TrueFalseSettings {
  if (raw && typeof raw === "object" && "version" in (raw as object)) {
    const version = Number((raw as { version?: number }).version ?? 0);
    return migrateTrueFalseSettings(version, raw);
  }
  return migrateTrueFalseSettings(0, raw ?? defaultTrueFalseSettings());
}

/**
 * Imperative player adapter for the shell contract (createRoot pattern like Wheel).
 * Renders into `[data-funwall-stage]` or `#funwall-player-stage` when present;
 * otherwise keeps an internal host attached to document.body for harnesses.
 */
export function createPlayerAdapter(): PlayerAdapter {
  let root: Root | null = null;
  let host: HTMLElement | null = null;
  let ownsHost = false;
  let context: PlayerAdapterContext | null = null;
  let restartToken = 0;
  let lastSession: TrueFalseSessionState | null = null;

  function renderView() {
    if (!root || !context) return;
    const content = parseContent(context.content);
    const settings = parseSettings(context.settings);
    root.render(
      createElement(TrueFalsePlayer, {
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
        timer: context.timer,
        onSessionChange: (state) => {
          lastSession = state;
          context?.lifecycle.onPauseSafeState({
            phase: state.phase,
            queueIndex: state.queueIndex,
            score: state.score,
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
        host.setAttribute("data-funwall-stage", "true-false-internal");
        host.setAttribute("data-testid", "true-false-player-host");
        document.body.appendChild(host);
        ownsHost = true;
      } else {
        ctx.lifecycle.onFatalError(
          "true-false-no-dom",
          "True/False player requires a DOM environment",
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
      context.timer.pause();
      context.sessionEvents.emit({
        type: "game.paused",
        elapsedMs: 0,
        metadata: { phase: lastSession?.phase },
      });
    },

    resume() {
      if (!context) return;
      context.timer.resume();
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

export async function loadTrueFalsePlayerAdapterModule() {
  return {
    createPlayerAdapter,
  };
}
