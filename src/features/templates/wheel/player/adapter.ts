"use client";

import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ListContentV1 } from "@/domain/content/list.v1";
import type { PlayerAdapter, PlayerAdapterContext } from "@/features/player/types";
import { WheelPlayer } from "@/features/templates/wheel/player/WheelPlayer";
import {
  defaultWheelSettings,
  migrateWheelSettings,
  type WheelSettings,
} from "@/features/templates/wheel/settings";
import type { WheelSessionState } from "@/features/templates/wheel/session";

function parseContent(raw: unknown): ListContentV1 {
  const pack = raw as ListContentV1;
  if (!pack || pack.family !== "list" || pack.version !== 1) {
    throw new Error("Wheel player requires list.v1 content");
  }
  return pack;
}

function parseSettings(raw: unknown): WheelSettings {
  if (raw && typeof raw === "object" && "version" in (raw as object)) {
    const version = Number((raw as { version?: number }).version ?? 0);
    return migrateWheelSettings(version, raw);
  }
  return migrateWheelSettings(0, raw ?? defaultWheelSettings());
}

/**
 * Imperative player adapter for the shell contract.
 * Renders into `[data-funwall-stage]` or `#funwall-player-stage` when present;
 * otherwise keeps an internal host attached to document.body for harnesses.
 */
export function createPlayerAdapter(): PlayerAdapter {
  let root: Root | null = null;
  let host: HTMLElement | null = null;
  let ownsHost = false;
  let context: PlayerAdapterContext | null = null;
  let restartToken = 0;
  let lastSession: WheelSessionState | null = null;

  function renderView() {
    if (!root || !context) return;
    const content = parseContent(context.content);
    const settings = parseSettings(context.settings);
    root.render(
      createElement(WheelPlayer, {
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
            remainingIds: state.remainingIds,
            rotationDeg: state.rotationDeg,
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
        host.setAttribute("data-funwall-stage", "wheel-internal");
        host.setAttribute("data-testid", "wheel-player-host");
        document.body.appendChild(host);
        ownsHost = true;
      } else {
        ctx.lifecycle.onFatalError(
          "wheel-no-dom",
          "Wheel player requires a DOM environment",
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
      // Force a remount-style restart signal
      context = {
        ...context,
        commands: {
          ...context.commands,
          restartRequested: true,
        },
      };
      renderView();
      // Clear restart flag for subsequent renders
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

export async function loadWheelPlayerAdapterModule() {
  return {
    createPlayerAdapter,
  };
}
