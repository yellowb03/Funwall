"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import type { ListContentV1, ListItem } from "@/domain/content/list.v1";
import type { SeededRng } from "@/services/rng/seeded-rng";
import type { SemanticAudioEmitter } from "@/services/audio/semantic-audio";
import type { SessionEventEmitter } from "@/domain/session-events";
import type { PlayerLifecycleCallbacks } from "@/features/player/types";
import { Button } from "@/design-system/Button";
import { WHEEL_COPY } from "@/features/templates/wheel/copy";
import {
  countBoundaryCrossings,
  interpolateRotation,
  rotationAgreesWithWinner,
  segmentIndexAtRotation,
  targetRotationForWinner,
} from "@/features/templates/wheel/geometry";
import {
  beginSpin,
  canSpin,
  createWheelSession,
  eliminateSelected,
  markDecelerating,
  markSelected,
  remainingItems,
  restartSession,
  resumeFromSelected,
  selectWinnerId,
  spinAgainFromSelected,
  type WheelSessionState,
  buildWheelResultDetail,
} from "@/features/templates/wheel/session";
import {
  spinDurationMs,
  spinExtraTurns,
  type WheelSettings,
} from "@/features/templates/wheel/settings";
import { WheelSvg } from "@/features/templates/wheel/player/WheelSvg";
import type { PublicActivitySnapshot } from "@/domain/snapshot";

export interface WheelPlayerProps {
  content: ListContentV1;
  settings: WheelSettings;
  rng: SeededRng;
  audio: SemanticAudioEmitter;
  sessionEvents: SessionEventEmitter;
  lifecycle: PlayerLifecycleCallbacks;
  themeTokens?: Record<string, string>;
  mediaAssets?: PublicActivitySnapshot["mediaAssets"];
  reducedMotion: boolean;
  muted?: boolean;
  /** External restart signal from shell. */
  restartRequested?: boolean;
  /** Optional host for adapter pause/resume coordination. */
  sessionId?: string;
  onSessionChange?: (state: WheelSessionState) => void;
}

const TICK_MIN_INTERVAL_MS = 45;
const REDUCED_MOTION_MS = 450;

function itemLabel(item: ListItem | undefined): string {
  if (!item) return "item";
  return item.content.text?.trim() || "Image item";
}

export function WheelPlayer({
  content,
  settings,
  rng,
  audio,
  sessionEvents,
  lifecycle,
  themeTokens = {},
  mediaAssets,
  reducedMotion,
  restartRequested = false,
  onSessionChange,
}: WheelPlayerProps): ReactElement {
  const [session, setSession] = useState<WheelSessionState>(() =>
    createWheelSession(content, settings, rng),
  );
  const [displayRotation, setDisplayRotation] = useState(0);
  const [liveMessage, setLiveMessage] = useState("");
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  const animFrameRef = useRef<number | null>(null);
  const lastTickAtRef = useRef(0);
  const sessionRef = useRef(session);
  const readyFired = useRef(false);
  const completeFired = useRef(false);
  const elapsedStart = useRef(
    typeof performance !== "undefined" ? performance.now() : Date.now(),
  );

  useEffect(() => {
    sessionRef.current = session;
    onSessionChange?.(session);
  }, [session, onSessionChange]);

  const elapsedMs = useCallback(() => {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    return Math.max(0, Math.floor(now - elapsedStart.current));
  }, []);

  useEffect(() => {
    if (readyFired.current) return;
    readyFired.current = true;
    lifecycle.onReady();
    sessionEvents.emit({ type: "game.ready", elapsedMs: 0 });
  }, [lifecycle, sessionEvents]);

  // Complete when one item remains
  useEffect(() => {
    if (session.phase !== "complete" || completeFired.current) return;
    completeFired.current = true;
    const remaining = remainingItems(session);
    const last = remaining[0];
    setLiveMessage(WHEEL_COPY.completeAnnounce(itemLabel(last)));
    const detail = buildWheelResultDetail(session);
    lifecycle.onComplete({
      score: null,
      status: "completed",
      templateDetail: detail,
    });
    sessionEvents.emit({
      type: "game.completed",
      elapsedMs: elapsedMs(),
      itemId: last?.id ?? null,
      metadata: { unscored: true, ...detail.data },
    });
  }, [session, lifecycle, sessionEvents, elapsedMs]);

  // Shell restart
  useEffect(() => {
    if (!restartRequested) return;
    completeFired.current = false;
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    const next = restartSession(sessionRef.current);
    setSession(next);
    setDisplayRotation(0);
    setHighlightIndex(null);
    setLiveMessage("");
  }, [restartRequested]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const items = useMemo(() => remainingItems(session), [session]);

  const selectedItem = useMemo(() => {
    if (!session.selectedId) return null;
    return (
      session.originalItems.find((i) => i.id === session.selectedId) ?? null
    );
  }, [session]);

  const runSpinAnimation = useCallback(
    (fromRot: number, toRot: number, winnerIndex: number, duration: number) => {
      const start =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      let prevRot = fromRot;
      lastTickAtRef.current = 0;

      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const rot = interpolateRotation(fromRot, toRot, t);
        setDisplayRotation(rot);

        // Mid-spin: enter decelerating phase near the end
        if (t > 0.55 && sessionRef.current.phase === "spinning") {
          setSession((s) => markDecelerating(s));
        }

        const crossings = countBoundaryCrossings(
          prevRot,
          rot,
          sessionRef.current.remainingIds.length,
        );
        if (crossings > 0) {
          const wall =
            typeof performance !== "undefined" ? performance.now() : Date.now();
          if (wall - lastTickAtRef.current >= TICK_MIN_INTERVAL_MS) {
            lastTickAtRef.current = wall;
            const speed = 1 - t;
            audio.emit("wheel.tick", {
              intensity: Math.min(1, 0.3 + speed * 0.7),
              rate: 0.85 + speed * 0.4,
            });
          }
        }
        prevRot = rot;

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(step);
          return;
        }

        animFrameRef.current = null;
        // Snap to exact target so visual always matches winner
        setDisplayRotation(toRot);
        setHighlightIndex(winnerIndex);

        const agrees = rotationAgreesWithWinner(
          toRot,
          winnerIndex,
          sessionRef.current.remainingIds.length,
        );
        if (!agrees) {
          // Fatal invariant — should never happen with targetRotationForWinner
          lifecycle.onFatalError(
            "wheel-angle-mismatch",
            "Wheel landing did not match selected winner",
          );
          return;
        }

        setSession((s) => markSelected(s, toRot));
        audio.emit("wheel.selected", { intensity: 1 });

        const winnerId = sessionRef.current.selectedId;
        const winner = sessionRef.current.originalItems.find(
          (i) => i.id === winnerId,
        );
        const label = itemLabel(winner);
        setLiveMessage(WHEEL_COPY.selectedAnnounce(label));
        sessionEvents.emit({
          type: "item.presented",
          elapsedMs: elapsedMs(),
          itemId: winnerId,
          metadata: { source: "wheel.selected" },
        });
        sessionEvents.emit({
          type: "wheel.selected",
          elapsedMs: elapsedMs(),
          itemId: winnerId,
        });
      };

      animFrameRef.current = requestAnimationFrame(step);
    },
    [audio, lifecycle, sessionEvents, elapsedMs],
  );

  const runReducedMotionSelect = useCallback(
    (winnerIndex: number, toRot: number) => {
      const count = sessionRef.current.remainingIds.length;
      const start =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      let flash = 0;

      const step = (now: number) => {
        const t = Math.min(1, (now - start) / REDUCED_MOTION_MS);
        // Cycle highlight briefly then land
        flash = Math.floor(t * 6) % count;
        setHighlightIndex(t < 0.85 ? flash : winnerIndex);
        setDisplayRotation(toRot);

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(step);
          return;
        }

        animFrameRef.current = null;
        setHighlightIndex(winnerIndex);
        setDisplayRotation(toRot);
        setSession((s) => markSelected(s, toRot));
        audio.emit("wheel.selected", { intensity: 1 });
        const winnerId = sessionRef.current.selectedId;
        const winner = sessionRef.current.originalItems.find(
          (i) => i.id === winnerId,
        );
        setLiveMessage(WHEEL_COPY.selectedAnnounce(itemLabel(winner)));
        sessionEvents.emit({
          type: "wheel.selected",
          elapsedMs: elapsedMs(),
          itemId: winnerId,
        });
      };

      animFrameRef.current = requestAnimationFrame(step);
    },
    [audio, sessionEvents, elapsedMs],
  );

  const handleSpin = useCallback(() => {
    const current = sessionRef.current;
    if (!canSpin(current)) return;

    audio.unlock().catch(() => {
      /* ignore unlock failures */
    });
    // Soft click comes from shared Button (playUiPress) — avoid double ui.press.

    const winnerId = selectWinnerId(current.remainingIds, rng);
    const winnerIndex = current.remainingIds.indexOf(winnerId);
    if (winnerIndex < 0) return;

    const next = beginSpin(current, winnerId);
    setSession(next);
    setHighlightIndex(null);

    const fromRot = current.rotationDeg;
    const extra = reducedMotion ? 0 : spinExtraTurns(settings.spinPower);
    const toRot = targetRotationForWinner(
      winnerIndex,
      current.remainingIds.length,
      extra,
      fromRot,
    );
    const duration = reducedMotion
      ? REDUCED_MOTION_MS
      : spinDurationMs(settings.spinPower);

    sessionEvents.emit({
      type: "wheel.spin",
      elapsedMs: elapsedMs(),
      itemId: winnerId,
      metadata: {
        winnerIndex,
        reducedMotion,
        spinPower: settings.spinPower,
      },
    });

    if (reducedMotion) {
      runReducedMotionSelect(winnerIndex, toRot);
    } else {
      runSpinAnimation(fromRot, toRot, winnerIndex, duration);
    }
  }, [
    audio,
    rng,
    reducedMotion,
    settings.spinPower,
    sessionEvents,
    elapsedMs,
    runSpinAnimation,
    runReducedMotionSelect,
  ]);

  const handleResume = () => {
    setSession((s) => resumeFromSelected(s));
    setHighlightIndex(null);
    setLiveMessage("");
  };

  const handleSpinAgain = () => {
    setSession((s) => spinAgainFromSelected(s));
    setHighlightIndex(null);
    setLiveMessage("");
    // Kick spin on next tick so state settles
    queueMicrotask(() => {
      handleSpin();
    });
  };

  const handleEliminate = () => {
    if (!settings.allowEliminate) return;
    setSession((s) => eliminateSelected(s, true));
    setHighlightIndex(null);
    setDisplayRotation(0);
    setLiveMessage("");
    sessionEvents.emit({
      type: "wheel.eliminate",
      elapsedMs: elapsedMs(),
      itemId: sessionRef.current.selectedId,
    });
  };

  const handleReset = () => {
    completeFired.current = false;
    const next = restartSession(sessionRef.current);
    setSession(next);
    setDisplayRotation(0);
    setHighlightIndex(null);
    setLiveMessage("");
  };

  const spinEnabled = canSpin(session);
  const showResult = session.phase === "selected" && selectedItem;
  const showComplete = session.phase === "complete";

  // Keep highlight synced if rotation changes without animation
  useEffect(() => {
    if (session.phase === "selected" && session.selectedId) {
      const idx = session.remainingIds.indexOf(session.selectedId);
      // After eliminate of others, selected may not be in remaining if we eliminated it
      // During selected phase before eliminate, winner is still in remaining
      if (idx >= 0) setHighlightIndex(idx);
    }
  }, [session.phase, session.selectedId, session.remainingIds]);

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--fw-color-ink)] sm:gap-3"
      data-template-player="wheel"
      data-wheel-phase={session.phase}
    >
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        data-testid="wheel-live"
      >
        {liveMessage}
      </div>

      {session.phase === "intro" ? (
        <p className="text-center text-base text-[var(--fw-color-ink-secondary)]">
          {content.instruction?.trim() || WHEEL_COPY.intro}
        </p>
      ) : content.instruction?.trim() ? (
        <p className="text-center text-sm text-[var(--fw-color-muted-strong)]">
          {content.instruction}
        </p>
      ) : null}

      <div
        className={[
          "relative w-full",
          showResult
            ? "max-w-[min(52%,240px)]"
            : "max-w-[min(78%,340px)]",
        ].join(" ")}
      >
        <WheelSvg
          items={items}
          rotationDeg={displayRotation}
          themeTokens={themeTokens}
          imageDisplayPolicy={settings.imageDisplayPolicy}
          highlightIndex={highlightIndex}
          reducedMotion={reducedMotion}
        />
      </div>

      {!showResult && !showComplete ? (
        <Button
          variant="primary"
          className="min-w-[10rem] text-lg"
          onClick={handleSpin}
          disabled={!spinEnabled}
          data-testid="wheel-spin"
          aria-label={WHEEL_COPY.spin}
        >
          {WHEEL_COPY.spin}
        </Button>
      ) : null}

      {showResult && selectedItem ? (
        <div
          className="flex w-full max-w-sm flex-col items-center gap-2 rounded-[var(--fw-radius-lg)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] p-4 shadow-[var(--fw-shadow-card)]"
          data-testid="wheel-result"
          role="region"
          aria-label="Selected item"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--fw-color-muted-strong)]">
            Selected
          </p>
          <p className="text-center text-2xl font-bold" data-testid="wheel-result-text">
            {itemLabel(selectedItem)}
          </p>
          {selectedItem.content.imageAssetId ? (() => {
            const asset = mediaAssets?.[selectedItem.content.imageAssetId];
            return asset ? (
              <img
                className="h-16 w-24 rounded-[var(--fw-radius-md)] bg-[var(--fw-color-tile-pale)] object-contain"
                src={asset.url}
                alt={selectedItem.content.imageAlt ?? asset.defaultAlt}
              />
            ) : (
              <div
                className="flex h-16 w-24 items-center justify-center rounded-[var(--fw-radius-md)] bg-[var(--fw-color-tile-pale)] px-2 text-center text-xs text-[var(--fw-color-muted)]"
                aria-label={selectedItem.content.imageAlt ?? "Selected image"}
              >
                {selectedItem.content.imageAlt ?? "Image"}
              </div>
            );
          })() : null}
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={handleResume}>
              {WHEEL_COPY.resume}
            </Button>
            <Button
              variant="primary"
              onClick={handleSpinAgain}
              disabled={session.remainingIds.length < 2}
            >
              {WHEEL_COPY.spinAgain}
            </Button>
            {settings.allowEliminate ? (
              <Button variant="danger" onClick={handleEliminate}>
                {WHEEL_COPY.eliminate}
              </Button>
            ) : null}
          </div>
          <p className="text-center text-xs text-[var(--fw-color-muted)]">
            {WHEEL_COPY.noLeaderboard}
          </p>
        </div>
      ) : null}

      {showComplete ? (
        <div
          className="flex w-full max-w-md flex-col items-center gap-3 rounded-[var(--fw-radius-lg)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] p-6"
          data-testid="wheel-complete"
          role="status"
        >
          <p className="text-center text-lg font-semibold">{WHEEL_COPY.complete}</p>
          {selectedItem ? (
            <p className="text-center text-xl font-bold">{itemLabel(selectedItem)}</p>
          ) : null}
          <Button variant="primary" onClick={handleReset}>
            {WHEEL_COPY.reset}
          </Button>
          <p className="text-center text-xs text-[var(--fw-color-muted)]">
            {WHEEL_COPY.noLeaderboard}
          </p>
        </div>
      ) : null}

      {/* Debug-friendly data attributes for tests */}
      <span
        hidden
        data-testid="wheel-rotation"
        data-rotation={displayRotation}
        data-segment={
          items.length > 0
            ? segmentIndexAtRotation(displayRotation, items.length)
            : -1
        }
      />
    </div>
  );
}
