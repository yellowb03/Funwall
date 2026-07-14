"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicActivitySnapshot } from "@/domain/snapshot";
import type { ResultContract } from "@/domain/result";
import {
  audioPackForThemeKey,
  cuesForTemplate,
  getSharedBrowserAudio,
  loadAudioPreferences,
  type FunwallAudioService,
} from "@/services/audio";
import { createSeededRng } from "@/services/rng/seeded-rng";
import {
  createTimer,
  type TimerMode,
  type TimerSnapshot,
} from "@/services/timer/clock";
import { getProductRegistry } from "@/features/templates";
import {
  createLifecycleMachine,
  type PlayerLifecycleState,
} from "@/features/player/lifecycle/machine";
import { createSessionEventBuffer } from "@/features/player/session/event-buffer";
import type {
  PlaySession,
  PublicPlayPort,
} from "@/features/player/session/types";
import type {
  PlayerAdapter,
  PlayerAdapterContext,
  PlayerShellCommands,
} from "@/features/player/types";
import { PlayerErrorBoundary } from "@/features/player/shell/PlayerErrorBoundary";
import { PlayerHud } from "@/features/player/shell/Hud";
import { StartOverlay } from "@/features/player/shell/StartOverlay";
import { useReducedMotion } from "@/features/player/shell/useReducedMotion";
import { ResultReview } from "@/features/results/ResultReview";

export interface PlayerShellProps {
  snapshot: PublicActivitySnapshot;
  port: PublicPlayPort;
  /** Inject adapter for tests; default loads from product registry. */
  loadAdapter?: () => Promise<{ createPlayerAdapter: () => PlayerAdapter }>;
  reducedMotion?: boolean;
  onExit?: () => void;
  className?: string;
}

interface HudRuntime {
  score: number | null;
  progressLabel: string | null;
  lives: number | null;
}

type ShellPhase = PlayerLifecycleState | "fatal";

function formatTimer(snapshot: TimerSnapshot): string | null {
  if (snapshot.mode === "none") return null;
  if (snapshot.mode === "countDown" && snapshot.remainingMs !== null) {
    return formatMs(snapshot.remainingMs);
  }
  return formatMs(snapshot.elapsedMs);
}

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function readTimerMode(settings: Record<string, unknown>): {
  mode: TimerMode;
  durationMs?: number;
} {
  const modeRaw = settings.timerMode;
  if (modeRaw === "countUp" || modeRaw === "countDown" || modeRaw === "none") {
    const seconds =
      typeof settings.timerSeconds === "number" ? settings.timerSeconds : 0;
    return {
      mode: modeRaw,
      durationMs:
        modeRaw === "countDown" ? Math.max(1, seconds) * 1000 : undefined,
    };
  }
  return { mode: "none" };
}

/**
 * Shared player shell: lifecycle, session, RNG, timer, HUD, adapter mount, review.
 * Wheel capabilities hide score and leaderboard entirely.
 */
export function PlayerShell({
  snapshot,
  port,
  loadAdapter,
  reducedMotion: reducedMotionProp,
  onExit,
  className = "",
}: PlayerShellProps) {
  const reducedMotion = useReducedMotion(reducedMotionProp);
  const isScored = snapshot.isScored;
  const hasLeaderboard = snapshot.hasLeaderboard;

  const [phase, setPhase] = useState<ShellPhase>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [session, setSession] = useState<PlaySession | null>(null);
  const [result, setResult] = useState<ResultContract | null>(null);
  const [muted, setMuted] = useState(() => loadAudioPreferences().muted);
  const [volume, setVolume] = useState(() => loadAudioPreferences().volume);
  const [fullscreen, setFullscreen] = useState(false);
  const [timerLabel, setTimerLabel] = useState<string | null>(null);
  const [hud] = useState<HudRuntime>({
    score: null,
    progressLabel: null,
    lives: null,
  });
  const [fatalMessage, setFatalMessage] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const machineRef = useRef(createLifecycleMachine({ strict: true }));
  const adapterRef = useRef<PlayerAdapter | null>(null);
  const adapterFactoryRef = useRef<(() => PlayerAdapter) | null>(null);
  // Shared with Button/playUiPress so mute/volume cannot desync across contexts.
  const audioRef = useRef<FunwallAudioService | null>(null);
  if (audioRef.current === null) {
    audioRef.current = getSharedBrowserAudio();
  }
  const timerRef = useRef<ReturnType<typeof createTimer> | null>(null);
  const eventBufferRef = useRef<ReturnType<
    typeof createSessionEventBuffer
  > | null>(null);
  const sessionRef = useRef<PlaySession | null>(null);
  const completingRef = useRef(false);
  const lastCountdownSecRef = useRef<number | null>(null);
  // Keep latest mute/fullscreen/reducedMotion for adapter context without remount churn.
  const commandsRef = useRef({ muted, fullscreen, reducedMotion });
  useEffect(() => {
    commandsRef.current = { muted, fullscreen, reducedMotion };
  }, [muted, fullscreen, reducedMotion]);

  // Keep shared audio graph aligned with HUD state (and with Button/playUiPress).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.setVolume(volume);
    audio.setMuted(muted);
  }, [volume, muted]);

  const syncPhase = useCallback((next: PlayerLifecycleState) => {
    machineRef.current.transition(next);
    setPhase(next);
  }, []);

  const disposeRuntime = useCallback(() => {
    try {
      adapterRef.current?.unmount();
    } catch {
      /* ignore */
    }
    adapterRef.current = null;
    timerRef.current?.dispose();
    timerRef.current = null;
    void eventBufferRef.current?.flush();
    eventBufferRef.current?.dispose();
    eventBufferRef.current = null;
    // Stop loops / cancellable stingers on restart or leave — keep unlocked context.
    audioRef.current?.stopAll();
  }, []);

  // Shell unmount: silence loops/stingers and restore default pack for owner chrome.
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.stopAll();
      // Session pack is not persisted; restore preference (or classic) for dashboard CTAs.
      const prefs = loadAudioPreferences();
      audio?.setPack(prefs.pack);
    };
  }, []);

  // Load adapter factory + mark ready once snapshot is present.
  useEffect(() => {
    let cancelled = false;
    machineRef.current.reset("loading");
    setPhase("loading");
    setLoadError(null);
    adapterFactoryRef.current = null;

    (async () => {
      try {
        const loader =
          loadAdapter ??
          (async () => {
            const mod = await getProductRegistry().loadPlayerAdapter(
              snapshot.templateKey,
            );
            return mod as { createPlayerAdapter: () => PlayerAdapter };
          });
        const mod = await loader();
        if (cancelled) return;
        adapterFactoryRef.current = mod.createPlayerAdapter;
        machineRef.current.transition("ready");
        setPhase("ready");
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Failed to load activity",
        );
        setPhase("fatal");
      }
    })();

    return () => {
      cancelled = true;
      disposeRuntime();
    };
  }, [
    snapshot.publicSlug,
    snapshot.revision,
    snapshot.templateKey,
    loadAdapter,
    disposeRuntime,
  ]);

  const buildResult = useCallback(
    (
      status: ResultContract["status"],
      partial: {
        score?: number | null;
        correctCount?: number | null;
        incorrectCount?: number | null;
        unansweredCount?: number | null;
        accuracy?: number | null;
        templateDetail?: ResultContract["templateDetail"];
      },
    ): ResultContract | null => {
      const sess = sessionRef.current;
      if (!sess) return null;
      const elapsed = timerRef.current?.getSnapshot().elapsedMs ?? 0;
      return {
        sessionId: sess.id,
        templateKey: snapshot.templateKey,
        templateVersion: snapshot.templateVersion,
        activityId: snapshot.activityId,
        activityRevision: snapshot.revision,
        seed: sess.seed,
        status,
        score: isScored ? (partial.score ?? 0) : null,
        correctCount: partial.correctCount ?? null,
        incorrectCount: partial.incorrectCount ?? null,
        unansweredCount: partial.unansweredCount ?? null,
        accuracy: partial.accuracy ?? null,
        durationMs: elapsed,
        templateDetail: partial.templateDetail ?? { version: 1 },
        completedAt: new Date().toISOString(),
      };
    },
    [isScored, snapshot],
  );

  const finishWithResult = useCallback(
    async (
      lifecycleEnd: "completed" | "gameOver",
      partial: Parameters<typeof buildResult>[1],
    ) => {
      if (completingRef.current) return;
      completingRef.current = true;

      const status = lifecycleEnd === "gameOver" ? "gameOver" : "completed";
      const built = buildResult(status, partial);
      if (!built) {
        completingRef.current = false;
        return;
      }

      try {
        timerRef.current?.pause();
        eventBufferRef.current?.emit({
          type: lifecycleEnd === "gameOver" ? "game.over" : "game.completed",
          elapsedMs: built.durationMs,
        });
        await eventBufferRef.current?.flush();
        await port.completeSession(built.sessionId, built);
        setResult(built);
        const current = machineRef.current.state;
        if (current === "playing" || current === "paused" || current === "feedback") {
          syncPhase(lifecycleEnd);
        } else if (current !== lifecycleEnd) {
          // Already at end or intermediate — only advance when allowed.
          if (machineRef.current.canTransition(lifecycleEnd)) {
            syncPhase(lifecycleEnd);
          }
        }
        if (machineRef.current.canTransition("review")) {
          syncPhase("review");
        } else if (machineRef.current.state !== "review") {
          machineRef.current.reset("review");
          setPhase("review");
        }
      } catch {
        setFatalMessage("Could not save result. Try again.");
        setPhase("fatal");
      } finally {
        completingRef.current = false;
      }
    },
    [buildResult, port, syncPhase],
  );

  const mountAdapter = useCallback(
    async (sess: PlaySession) => {
      const create = adapterFactoryRef.current;
      if (!create) {
        throw new Error("Player adapter not loaded");
      }

      disposeRuntime();

      const timerOpts = readTimerMode(snapshot.settings);
      const timer = createTimer({
        mode: timerOpts.mode,
        durationMs: timerOpts.durationMs,
      });
      timerRef.current = timer;
      lastCountdownSecRef.current = null;
      timer.subscribe((snap) => {
        setTimerLabel(formatTimer(snap));
        // Shell-owned countdown ticks (once per whole second remaining).
        if (
          snap.mode === "countDown" &&
          snap.status === "running" &&
          snap.remainingMs !== null
        ) {
          const sec = Math.ceil(snap.remainingMs / 1000);
          if (
            sec > 0 &&
            sec !== lastCountdownSecRef.current &&
            lastCountdownSecRef.current !== null
          ) {
            const urgency = sec <= 5 ? 0.95 : 0.45;
            audioRef.current?.emit("countdown.tick", { intensity: urgency });
          }
          lastCountdownSecRef.current = sec;
        }
      });
      setTimerLabel(formatTimer(timer.getSnapshot()));

      const buffer = createSessionEventBuffer({
        sessionId: sess.id,
        getElapsedMs: () => timer.getSnapshot().elapsedMs,
        flush: async (events) => {
          await port.appendEvents(sess.id, events);
        },
        flushIntervalMs: 0,
      });
      eventBufferRef.current = buffer;

      const rng = createSeededRng(sess.seed);
      const audio = audioRef.current!;
      audio.setMuted(commandsRef.current.muted);
      audio.setVolume(volume);
      audio.setPack(audioPackForThemeKey(snapshot.themeKey));
      void audio.preload(cuesForTemplate(snapshot.templateKey)).catch(() => {
        /* preload is best-effort */
      });

      const commands: PlayerShellCommands = {
        get muted() {
          return commandsRef.current.muted;
        },
        get fullscreen() {
          return commandsRef.current.fullscreen;
        },
        get reducedMotion() {
          return commandsRef.current.reducedMotion;
        },
        restartRequested: false,
      };

      const lifecycle = {
        onReady: () => {
          /* shell already transitioned; adapter may re-signal readiness */
        },
        onPauseSafeState: () => {
          /* templates may stash recoverable sub-state */
        },
        onComplete: (raw: unknown) => {
          const partial =
            raw && typeof raw === "object"
              ? (raw as Parameters<typeof buildResult>[1])
              : {};
          void finishWithResult("completed", partial);
        },
        onGameOver: (raw: unknown) => {
          const partial =
            raw && typeof raw === "object"
              ? (raw as Parameters<typeof buildResult>[1])
              : {};
          void finishWithResult("gameOver", partial);
        },
        onFatalError: (diagnosticId: string, message: string) => {
          setFatalMessage(`${message} (${diagnosticId})`);
          setPhase("fatal");
          void (async () => {
            const invalid = buildResult("invalid", {
              score: isScored ? 0 : null,
            });
            if (invalid) {
              try {
                await port.completeSession(invalid.sessionId, invalid);
              } catch {
                /* ignore */
              }
            }
          })();
        },
      };

      const ctx: PlayerAdapterContext = {
        snapshot,
        content: snapshot.content,
        settings: snapshot.settings,
        themeTokens: {},
        rng,
        timer,
        audio,
        sessionEvents: buffer,
        lifecycle,
        commands,
      };

      const adapter = create();
      adapterRef.current = adapter;
      await adapter.mount(ctx);

      buffer.emit({
        type: "session.started",
        elapsedMs: 0,
        metadata: { seedStored: true },
      });
    },
    [buildResult, disposeRuntime, finishWithResult, isScored, port, snapshot, volume],
  );

  const handlePlay = useCallback(async () => {
    if (phase !== "ready") return;
    try {
      const audio = audioRef.current!;
      // Unlock after the Play gesture; never surface autoplay block as product failure.
      try {
        await audio.unlock();
      } catch {
        /* continue muted-capable; cues no-op until unlock succeeds later */
      }
      void audio
        .preload(cuesForTemplate(snapshot.templateKey))
        .catch(() => {
          /* ignore */
        });
      const sess = await port.startSession({ publicSlug: snapshot.publicSlug });
      sessionRef.current = sess;
      setSession(sess);
      await mountAdapter(sess);
      timerRef.current?.start();
      syncPhase("playing");
      adapterRef.current?.resume();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not start");
      setPhase("fatal");
    }
  }, [mountAdapter, phase, port, snapshot.publicSlug, snapshot.templateKey, syncPhase]);

  const handleRestart = useCallback(async () => {
    audioRef.current?.emit("ui.press", { intensity: 0.5 });
    const prev = sessionRef.current;
    if (prev?.status === "active") {
      const abandoned = buildResult("abandoned", {
        score: isScored ? 0 : null,
      });
      if (abandoned) {
        try {
          eventBufferRef.current?.emit({
            type: "session.abandoned",
            elapsedMs: abandoned.durationMs,
          });
          await eventBufferRef.current?.flush();
          await port.completeSession(prev.id, abandoned);
        } catch {
          /* best-effort abandon */
        }
      }
    }

    disposeRuntime();
    completingRef.current = false;
    sessionRef.current = null;
    setSession(null);
    setResult(null);
    setFatalMessage(null);
    setLoadError(null);
    setTimerLabel(null);
    machineRef.current.reset("ready");
    setPhase("ready");
  }, [buildResult, disposeRuntime, isScored, port]);

  const handleMuteToggle = useCallback(() => {
    const audio = audioRef.current;
    const next = !muted;
    if (audio) {
      if (next) {
        // Mute immediately — no cue after silence.
        audio.setMuted(true);
      } else {
        audio.setMuted(false);
        void audio.unlock().then(() => {
          if (!audio.isMuted()) {
            audio.emit("ui.press", { intensity: 0.6 });
          }
        });
      }
    }
    setMuted(next);
  }, [muted]);

  const handleVolumeChange = useCallback((next: number) => {
    const clamped = Math.min(1, Math.max(0, next));
    setVolume(clamped);
    const audio = audioRef.current;
    if (!audio) return;
    audio.setVolume(clamped);
    if (clamped > 0 && audio.isMuted()) {
      audio.setMuted(false);
      setMuted(false);
    }
  }, []);

  const handleFullscreen = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;
    audioRef.current?.emit("ui.press", { intensity: 0.45 });
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.();
        setFullscreen(true);
      } else {
        await document.exitFullscreen?.();
        setFullscreen(false);
      }
    } catch {
      /* mobile browsers may reject — degrade safely */
    }
  }, []);

  // Visibility pause policy (shell-owned).
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && machineRef.current.state === "playing") {
        timerRef.current?.pause();
        adapterRef.current?.pause();
        // Stop bonus loops / stingers while tab is hidden.
        audioRef.current?.stopAll();
        eventBufferRef.current?.emit({
          type: "game.paused",
          elapsedMs: timerRef.current?.getSnapshot().elapsedMs ?? 0,
        });
        try {
          syncPhase("paused");
        } catch {
          /* ignore if illegal */
        }
      } else if (!document.hidden && machineRef.current.state === "paused") {
        timerRef.current?.resume();
        adapterRef.current?.resume();
        eventBufferRef.current?.emit({
          type: "game.resumed",
          elapsedMs: timerRef.current?.getSnapshot().elapsedMs ?? 0,
        });
        try {
          syncPhase("playing");
        } catch {
          /* ignore */
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [syncPhase]);

  useEffect(() => {
    const onFs = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const instruction =
    snapshot.instruction ??
    (typeof snapshot.content === "object" &&
    snapshot.content &&
    "instruction" in snapshot.content &&
    typeof (snapshot.content as { instruction?: unknown }).instruction ===
      "string"
      ? (snapshot.content as { instruction: string }).instruction
      : undefined);

  return (
    <div
      ref={rootRef}
      className={[
        "flex w-full flex-col overflow-hidden rounded-[var(--fw-radius-lg)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)]",
        className,
      ].join(" ")}
      data-testid="player-shell"
      data-phase={phase}
      data-scored={isScored ? "true" : "false"}
      data-leaderboard={hasLeaderboard ? "true" : "false"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <PlayerHud
        isScored={isScored}
        score={isScored ? hud.score : null}
        progressLabel={hud.progressLabel}
        lives={hud.lives}
        timerLabel={timerLabel}
        muted={muted}
        volume={volume}
        onMuteToggle={handleMuteToggle}
        onVolumeChange={handleVolumeChange}
        onFullscreen={handleFullscreen}
        onRestart={() => void handleRestart()}
        onExit={onExit}
      />

      {/* 16:9 stage */}
      <div className="relative w-full bg-[var(--fw-color-canvas-alt)] pt-[56.25%]">
        <div
          ref={stageRef}
          className="absolute inset-0 flex flex-col"
          data-testid="player-stage"
        >
          <PlayerErrorBoundary
            onRestart={() => void handleRestart()}
            onExit={onExit}
          >
            {phase === "loading" ? (
              <div
                className="flex h-full items-center justify-center text-[var(--fw-color-muted-strong)]"
                data-testid="player-loading"
              >
                Loading…
              </div>
            ) : null}

            {phase === "fatal" || loadError ? (
              <div
                role="alert"
                className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
                data-testid="player-fatal"
              >
                <p className="font-semibold">
                  {loadError ?? fatalMessage ?? "Something went wrong"}
                </p>
                <button
                  type="button"
                  className="text-[var(--fw-color-link)] underline"
                  onClick={() => void handleRestart()}
                >
                  Try again
                </button>
              </div>
            ) : null}

            {phase === "ready" ? (
              <StartOverlay
                title={snapshot.title}
                instruction={instruction}
                onPlay={() => void handlePlay()}
              />
            ) : null}

            {phase === "review" && result ? (
              <ResultReview
                result={result}
                isScored={isScored}
                hasLeaderboard={hasLeaderboard}
                title={snapshot.title}
                onPlayAgain={() => void handleRestart()}
                onSubmitLeaderboard={
                  hasLeaderboard
                    ? async (name) => {
                        await port.submitLeaderboard(result.sessionId, name);
                      }
                    : undefined
                }
              />
            ) : null}

            {phase === "playing" ||
            phase === "paused" ||
            phase === "feedback" ||
            phase === "completed" ||
            phase === "gameOver" ? (
              <div
                className="flex h-full flex-1 items-center justify-center p-4 text-sm text-[var(--fw-color-muted-strong)]"
                data-testid="player-adapter-host"
                aria-live="polite"
              >
                {session ? (
                  <span className="sr-only">
                    Session active with seed {session.seed}
                  </span>
                ) : null}
                Playing…
              </div>
            ) : null}
          </PlayerErrorBoundary>
        </div>
      </div>
    </div>
  );
}
