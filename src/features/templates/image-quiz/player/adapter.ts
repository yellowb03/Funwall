"use client";

import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ImageQuizContentV1 } from "@/domain/content/imageQuiz.v1";
import { resolveMediaUrl } from "@/features/media/resolve-url";
import type { PlayerAdapter, PlayerAdapterContext } from "@/features/player/types";
import { ImageQuizPlayer } from "@/features/templates/image-quiz/player/ImageQuizPlayer";
import {
  defaultImageQuizSettings,
  migrateImageQuizSettings,
  type ImageQuizSettings,
} from "@/features/templates/image-quiz/settings";
import type { ImageQuizSessionState } from "@/features/templates/image-quiz/session";

function parseContent(raw: unknown): ImageQuizContentV1 {
  const pack = raw as ImageQuizContentV1;
  if (!pack || pack.family !== "imageQuiz" || pack.version !== 1) {
    throw new Error("Image quiz player requires imageQuiz.v1 content");
  }
  return pack;
}

function parseSettings(raw: unknown): ImageQuizSettings {
  if (raw && typeof raw === "object" && "version" in (raw as object)) {
    const version = Number((raw as { version?: number }).version ?? 0);
    return migrateImageQuizSettings(version, raw);
  }
  return migrateImageQuizSettings(0, raw ?? defaultImageQuizSettings());
}

/**
 * Imperative player adapter for the shell contract.
 * Renders into `[data-funwall-stage]` or `#funwall-player-stage` when present.
 */
export function createPlayerAdapter(): PlayerAdapter {
  let root: Root | null = null;
  let host: HTMLElement | null = null;
  let ownsHost = false;
  let context: PlayerAdapterContext | null = null;
  let restartToken = 0;
  let lastSession: ImageQuizSessionState | null = null;
  let paused = false;

  function renderView() {
    if (!root || !context) return;
    const content = parseContent(context.content);
    const settings = parseSettings(context.settings);
    root.render(
      createElement(ImageQuizPlayer, {
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
        paused,
        // Production path: load real/placeholder URLs (not the test harness simulator).
        simulateImageLoad: false,
        resolveImageUrl: (assetId) => {
          const q = content.questions.find(
            (item) => item.revealImageAssetId === assetId,
          );
          return resolveMediaUrl(assetId, {
            label: q?.revealImageAlt ?? q?.prompt.text ?? "Reveal image",
            allowPlaceholder: true,
          });
        },
        onSessionChange: (state) => {
          lastSession = state;
          context?.lifecycle.onPauseSafeState({
            phase: state.phase,
            questionIndex: state.questionIndex,
            score: state.score,
            revealedCount: state.revealedCount,
            buzzed: state.buzzed,
          });
        },
      }),
    );
  }

  return {
    async mount(ctx: PlayerAdapterContext) {
      context = ctx;
      restartToken = 0;
      paused = false;

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
        host.setAttribute("data-funwall-stage", "image-quiz-internal");
        host.setAttribute("data-testid", "image-quiz-player-host");
        document.body.appendChild(host);
        ownsHost = true;
      } else {
        ctx.lifecycle.onFatalError(
          "image-quiz-no-dom",
          "Image quiz player requires a DOM environment",
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
      paused = false;
    },

    pause() {
      if (!context) return;
      paused = true;
      context.sessionEvents.emit({
        type: "game.paused",
        elapsedMs: 0,
        metadata: { phase: lastSession?.phase },
      });
      renderView();
    },

    resume() {
      if (!context) return;
      paused = false;
      context.sessionEvents.emit({
        type: "game.resumed",
        elapsedMs: 0,
        metadata: { phase: lastSession?.phase },
      });
      renderView();
    },

    restart() {
      if (!context) return;
      restartToken += 1;
      paused = false;
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

export async function loadImageQuizPlayerAdapterModule() {
  return {
    createPlayerAdapter,
  };
}
