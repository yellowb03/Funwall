"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";
import type { StatementsContentV1 } from "@/domain/content/statements.v1";
import type { SessionEventEmitter } from "@/domain/session-events";
import type { PlayerLifecycleCallbacks } from "@/features/player/types";
import { Button } from "@/design-system/Button";
import { TRUE_FALSE_COPY } from "@/features/templates/true-false/copy";
import {
  advanceAfterItem,
  beginAnswerWindow,
  beginItemEnter,
  buildTrueFalseResult,
  canStart,
  captureAnswer,
  createTrueFalseSession,
  currentStatement,
  enterFeedback,
  enterReview,
  leaveFeedback,
  markSessionTimeUp,
  restartSession,
  tryResolve,
  type AnswerChoice,
  type TrueFalseSessionState,
} from "@/features/templates/true-false/session";
import {
  answerWindowMs,
  type TrueFalseSettings,
} from "@/features/templates/true-false/settings";
import type { SeededRng } from "@/services/rng/seeded-rng";
import type { SemanticAudioEmitter } from "@/services/audio/semantic-audio";
import type { Clock, TimerController } from "@/services/timer/clock";
import { createMonotonicClock } from "@/services/timer/clock";

export interface TrueFalsePlayerProps {
  content: StatementsContentV1;
  settings: TrueFalseSettings;
  rng: SeededRng;
  audio: SemanticAudioEmitter;
  sessionEvents: SessionEventEmitter;
  lifecycle: PlayerLifecycleCallbacks;
  themeTokens?: Record<string, string>;
  reducedMotion: boolean;
  muted?: boolean;
  restartRequested?: boolean;
  /** Shell timer for session countdown/count-up (optional). */
  timer?: TimerController | null;
  /**
   * Monotonic clock for answer-window timing.
   * Prefer timer-backed or inject a fake clock in tests.
   * CSS animation is never the source of truth.
   */
  clock?: Clock;
  onSessionChange?: (state: TrueFalseSessionState) => void;
}

const ENTER_MS = 220;
const FEEDBACK_MS = 700;
const LEAVE_MS = 180;

function statementText(state: TrueFalseSessionState): string {
  const s = currentStatement(state);
  if (!s) return "";
  return s.content.text?.trim() || (s.content.imageAssetId ? "Image statement" : "");
}

function fontSizeForText(text: string): string {
  const len = text.length;
  if (len > 220) return "clamp(0.95rem, 2.6vw, 1.15rem)";
  if (len > 120) return "clamp(1.05rem, 3vw, 1.35rem)";
  if (len > 60) return "clamp(1.2rem, 3.4vw, 1.6rem)";
  return "clamp(1.35rem, 4vw, 1.85rem)";
}

export function TrueFalsePlayer({
  content,
  settings,
  rng,
  audio,
  sessionEvents,
  lifecycle,
  themeTokens = {},
  reducedMotion,
  restartRequested = false,
  timer = null,
  clock: clockProp,
  onSessionChange,
}: TrueFalsePlayerProps): ReactElement {
  const clock = useMemo(
    () => clockProp ?? createMonotonicClock(),
    [clockProp],
  );

  const [session, setSession] = useState<TrueFalseSessionState>(() =>
    createTrueFalseSession(content, settings, rng),
  );
  const [liveMessage, setLiveMessage] = useState("");
  const [windowProgress, setWindowProgress] = useState(1);

  const sessionRef = useRef(session);
  const readyFired = useRef(false);
  const terminalFired = useRef(false);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedStart = useRef(clock.now());
  const rngRef = useRef(rng);
  rngRef.current = rng;
  const emitResolveRef = useRef<(resolved: TrueFalseSessionState) => void>(
    () => undefined,
  );
  const openAnswerWindowRef = useRef<(from: TrueFalseSessionState) => void>(
    () => undefined,
  );

  const clearPhaseTimer = useCallback(() => {
    if (phaseTimerRef.current !== null) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  }, []);

  const clearPoll = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    sessionRef.current = session;
    onSessionChange?.(session);
  }, [session, onSessionChange]);

  const elapsedMs = useCallback(() => {
    return Math.max(0, Math.floor(clock.now() - elapsedStart.current));
  }, [clock]);

  useEffect(() => {
    if (readyFired.current) return;
    readyFired.current = true;
    lifecycle.onReady();
    sessionEvents.emit({ type: "game.ready", elapsedMs: 0 });
  }, [lifecycle, sessionEvents]);

  // Shell restart
  useEffect(() => {
    if (!restartRequested) return;
    terminalFired.current = false;
    clearPhaseTimer();
    clearPoll();
    elapsedStart.current = clock.now();
    const next = restartSession(content, settings, rngRef.current);
    setSession(next);
    setLiveMessage("");
    setWindowProgress(1);
  }, [
    restartRequested,
    content,
    settings,
    clock,
    clearPhaseTimer,
    clearPoll,
  ]);

  // Session countdown timeout → mark time up; active item still resolves once
  useEffect(() => {
    if (!timer || settings.timerMode !== "countDown") return;
    return timer.onTimeout(() => {
      setSession((s) => markSessionTimeUp(s));
    });
  }, [timer, settings.timerMode]);

  // Terminal lifecycle
  useEffect(() => {
    if (
      (session.phase !== "completed" && session.phase !== "gameOver") ||
      terminalFired.current
    ) {
      return;
    }
    terminalFired.current = true;
    clearPoll();
    const result = buildTrueFalseResult(session, elapsedMs());
    if (session.phase === "gameOver") {
      setLiveMessage(TRUE_FALSE_COPY.gameOverAnnounce(result.score));
      audio.emit("game.over", { intensity: 0.8 });
      lifecycle.onGameOver(result);
      sessionEvents.emit({
        type: "game.over",
        elapsedMs: result.durationMs,
        metadata: {
          score: result.score,
          correctCount: result.correctCount,
          incorrectCount: result.incorrectCount,
          unansweredCount: result.unansweredCount,
        },
      });
    } else {
      setLiveMessage(TRUE_FALSE_COPY.completeAnnounce(result.score));
      audio.emit("game.complete", { intensity: 1 });
      lifecycle.onComplete(result);
      sessionEvents.emit({
        type: "game.completed",
        elapsedMs: result.durationMs,
        metadata: {
          score: result.score,
          correctCount: result.correctCount,
          incorrectCount: result.incorrectCount,
          unansweredCount: result.unansweredCount,
          accuracy: result.accuracy,
        },
      });
    }

    if (settings.showAnswers) {
      // Brief delay then review phase (UI only)
      phaseTimerRef.current = setTimeout(() => {
        setSession((s) => enterReview(s));
      }, 400);
    }
  }, [
    session,
    lifecycle,
    sessionEvents,
    audio,
    elapsedMs,
    settings.showAnswers,
    clearPoll,
  ]);

  useEffect(() => {
    return () => {
      clearPhaseTimer();
      clearPoll();
    };
  }, [clearPhaseTimer, clearPoll]);

  const openAnswerWindow = useCallback(
    (from: TrueFalseSessionState) => {
      const now = clock.now();
      const next = beginAnswerWindow(from, now);
      setSession(next);
      sessionRef.current = next;
      setWindowProgress(1);
      audio.emit("trueFalse.enter", {
        intensity: 0.7,
        rate: settings.speed / 5,
      });
      sessionEvents.emit({
        type: "item.presented",
        elapsedMs: elapsedMs(),
        itemId: next.currentStatementId,
        metadata: {
          windowMs: next.windowMs,
          presentedAt: next.presentedAt,
          deadlineAt: next.deadlineAt,
        },
      });

      clearPoll();
      // Poll monotonic clock for expiry — not CSS animationend
      pollRef.current = setInterval(() => {
        const current = sessionRef.current;
        if (current.phase !== "answerWindow" || current.resolved) {
          clearPoll();
          return;
        }
        const t = clock.now();
        if (
          current.presentedAt !== null &&
          current.deadlineAt !== null &&
          current.deadlineAt > current.presentedAt
        ) {
          const span = current.deadlineAt - current.presentedAt;
          const remaining = Math.max(0, current.deadlineAt - t);
          setWindowProgress(Math.min(1, remaining / span));
        }
        const resolved = tryResolve(current, t);
        if (resolved.resolved && !current.resolved) {
          clearPoll();
          setSession(resolved);
          sessionRef.current = resolved;
          emitResolveRef.current(resolved);
        }
      }, 32);
    },
    [audio, clock, clearPoll, elapsedMs, sessionEvents, settings.speed],
  );

  const emitResolve = useCallback(
    (resolved: TrueFalseSessionState) => {
      const kind = resolved.lastResolve;
      audio.emit("trueFalse.resolve", { intensity: 1 });
      if (kind === "correct") {
        audio.emit("answer.correct", { intensity: 1 });
        setLiveMessage(TRUE_FALSE_COPY.correctAnnounce);
      } else if (kind === "incorrect") {
        audio.emit("answer.incorrect", { intensity: 0.9 });
        setLiveMessage(TRUE_FALSE_COPY.incorrectAnnounce);
      } else if (kind === "expired") {
        audio.emit("answer.incorrect", { intensity: 0.6 });
        setLiveMessage(TRUE_FALSE_COPY.expiredAnnounce);
      }

      const last = resolved.attempts[resolved.attempts.length - 1];
      sessionEvents.emit({
        type: "answer.resolved",
        elapsedMs: elapsedMs(),
        itemId: last?.statementId ?? null,
        metadata: {
          kind: last?.kind,
          playerAnswer: last?.playerAnswer,
          truth: last?.truth,
          points: last?.points,
          resolvedAt: last?.resolvedAt,
        },
      });

      // answered/expired → feedback → itemLeaving → advance
      clearPhaseTimer();
      phaseTimerRef.current = setTimeout(() => {
        setSession((s) => {
          const fb = enterFeedback(s);
          sessionRef.current = fb;
          return fb;
        });
        phaseTimerRef.current = setTimeout(() => {
          setSession((s) => {
            const leaving = leaveFeedback(s);
            sessionRef.current = leaving;
            return leaving;
          });
          phaseTimerRef.current = setTimeout(() => {
            setSession((s) => {
              const advanced = advanceAfterItem(
                s,
                settings,
                rngRef.current,
              );
              sessionRef.current = advanced;
              if (advanced.phase === "itemEntering") {
                phaseTimerRef.current = setTimeout(() => {
                  openAnswerWindowRef.current(sessionRef.current);
                }, reducedMotion ? 0 : ENTER_MS);
              }
              return advanced;
            });
          }, reducedMotion ? 0 : LEAVE_MS);
        }, FEEDBACK_MS);
      }, 40);
    },
    [
      audio,
      clearPhaseTimer,
      elapsedMs,
      reducedMotion,
      sessionEvents,
      settings,
    ],
  );

  openAnswerWindowRef.current = openAnswerWindow;
  emitResolveRef.current = emitResolve;

  // When phase becomes itemEntering from start path without nested timer
  useEffect(() => {
    if (session.phase !== "itemEntering") return;
    if (session.presentedAt !== null) return;
    // Defer open so double-mount doesn't race
    clearPhaseTimer();
    phaseTimerRef.current = setTimeout(
      () => {
        if (sessionRef.current.phase === "itemEntering") {
          openAnswerWindow(sessionRef.current);
        }
      },
      reducedMotion ? 0 : ENTER_MS,
    );
    return () => clearPhaseTimer();
  }, [session.phase, session.presentedAt, session.queueIndex, session.passIndex, openAnswerWindow, reducedMotion, clearPhaseTimer]);

  const handleStart = () => {
    if (!canStart(sessionRef.current)) return;
    timer?.start();
    setSession((s) => {
      const entered = beginItemEnter(s);
      sessionRef.current = entered;
      return entered;
    });
  };

  const handleAnswer = (answer: AnswerChoice) => {
    const now = clock.now();
    setSession((s) => {
      if (s.phase !== "answerWindow" || s.resolved) return s;
      const withAnswer = captureAnswer(s, answer, now);
      sessionEvents.emit({
        type: "answer.submitted",
        elapsedMs: elapsedMs(),
        itemId: withAnswer.currentStatementId,
        metadata: { answer, inputAt: now },
      });
      const resolved = tryResolve(withAnswer, now);
      if (resolved.resolved && !s.resolved) {
        clearPoll();
        sessionRef.current = resolved;
        queueMicrotask(() => emitResolveRef.current(resolved));
        return resolved;
      }
      sessionRef.current = withAnswer;
      return withAnswer;
    });
  };

  // Keyboard shortcuts T/F while answer window is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sessionRef.current.phase !== "answerWindow") return;
      if (sessionRef.current.resolved || sessionRef.current.inputLocked) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        handleAnswer(true);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleAnswer(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const statement = currentStatement(session);
  const text = statementText(session);
  const phase = session.phase;
  const showStage =
    phase === "itemEntering" ||
    phase === "answerWindow" ||
    phase === "answered" ||
    phase === "expired" ||
    phase === "feedback" ||
    phase === "itemLeaving";

  const canAnswer =
    phase === "answerWindow" && !session.resolved && !session.inputLocked;

  const cardStyle: CSSProperties = reducedMotion
    ? {
        transform: "none",
        opacity: showStage ? 1 : 0,
        transition: "opacity 120ms linear",
      }
    : {
        transform:
          phase === "itemEntering"
            ? "translateX(-12%) scale(0.98)"
            : phase === "itemLeaving"
              ? "translateX(18%) scale(0.96)"
              : "translateX(0) scale(1)",
        opacity: phase === "itemLeaving" ? 0.55 : 1,
        transition: `transform ${ENTER_MS}ms ease-out, opacity ${LEAVE_MS}ms ease-in`,
      };

  const stampLabel =
    session.lastResolve === "correct"
      ? TRUE_FALSE_COPY.correct
      : session.lastResolve === "incorrect"
        ? TRUE_FALSE_COPY.incorrect
        : session.lastResolve === "expired"
          ? TRUE_FALSE_COPY.expired
          : null;

  const stampClass =
    session.lastResolve === "correct"
      ? "bg-[var(--fw-color-success)] text-white"
      : session.lastResolve === "incorrect" || session.lastResolve === "expired"
        ? "bg-[var(--fw-color-coral)] text-white"
        : "";

  const totalInPass = session.statements.length;
  const progressLabel = TRUE_FALSE_COPY.progress(
    Math.min(session.queueIndex + 1, totalInPass),
    totalInPass,
  );

  return (
    <div
      className="relative flex h-full min-h-[320px] w-full flex-col gap-4 p-4 text-[var(--fw-color-ink)]"
      data-testid="true-false-player"
      data-phase={phase}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={
        {
          ...themeTokens,
          ["--tf-window-ms" as string]: `${answerWindowMs(settings.speed)}ms`,
        } as CSSProperties
      }
    >
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        data-testid="tf-live"
      >
        {liveMessage}
      </div>

      {phase === "intro" ? (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
          data-testid="tf-intro"
        >
          <p className="max-w-md text-lg">{TRUE_FALSE_COPY.intro}</p>
          <Button
            variant="primary"
            className="min-h-12 min-w-[8rem] text-lg"
            onClick={handleStart}
            data-testid="tf-start"
          >
            {TRUE_FALSE_COPY.start}
          </Button>
        </div>
      ) : null}

      {showStage && statement ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--fw-color-muted-strong)]">
            <span data-testid="tf-progress">{progressLabel}</span>
            <span data-testid="tf-score">Score {session.score}</span>
            {session.livesRemaining !== null ? (
              <span data-testid="tf-lives">
                {TRUE_FALSE_COPY.livesRemaining(session.livesRemaining)}
              </span>
            ) : null}
          </div>

          {reducedMotion && phase === "answerWindow" ? (
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-[var(--fw-color-border)]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(windowProgress * 100)}
              aria-label="Answer time remaining"
              data-testid="tf-window-progress"
            >
              <div
                className="h-full bg-[var(--fw-color-primary)] transition-[width] duration-75 linear"
                style={{ width: `${Math.round(windowProgress * 100)}%` }}
              />
            </div>
          ) : null}

          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            <article
              className="relative flex max-h-full w-full max-w-2xl flex-col items-center justify-center gap-3 rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              style={cardStyle}
              data-testid="tf-statement-card"
              aria-label="Statement"
            >
              {statement.content.imageAssetId ? (
                <div
                  className="mb-2 flex h-28 w-full max-w-xs items-center justify-center rounded-[var(--fw-radius-sm)] bg-[var(--fw-color-tile-pale)] text-sm text-[var(--fw-color-muted-strong)]"
                  data-testid="tf-statement-image"
                  role="img"
                  aria-label={statement.content.imageAlt ?? "Statement image"}
                >
                  {statement.content.imageAlt ?? "Image"}
                </div>
              ) : null}
              <p
                className="w-full text-center font-semibold leading-snug break-words"
                style={{ fontSize: fontSizeForText(text) }}
                data-testid="tf-statement-text"
              >
                {text}
              </p>

              {stampLabel &&
              (phase === "answered" ||
                phase === "expired" ||
                phase === "feedback") ? (
                <div
                  className={`absolute right-3 top-3 rounded-[var(--fw-radius-sm)] px-3 py-1 text-sm font-bold ${stampClass}`}
                  data-testid="tf-stamp"
                  data-kind={session.lastResolve ?? undefined}
                >
                  {stampLabel}
                  {session.lastPoints > 0 ? ` +${session.lastPoints}` : ""}
                </div>
              ) : null}
            </article>
          </div>

          {/* Fixed answer controls — never move with the card */}
          <div
            className="flex flex-wrap items-stretch justify-center gap-3"
            data-testid="tf-answer-controls"
          >
            <Button
              variant="primary"
              className="min-h-14 min-w-[9rem] flex-1 text-xl font-bold sm:flex-none"
              disabled={!canAnswer}
              onClick={() => handleAnswer(true)}
              data-testid="tf-answer-true"
              aria-keyshortcuts="t"
            >
              {TRUE_FALSE_COPY.trueButton}
            </Button>
            <Button
              variant="secondary"
              className="min-h-14 min-w-[9rem] flex-1 border-2 border-[var(--fw-color-coral)] text-xl font-bold text-[var(--fw-color-coral)] sm:flex-none"
              disabled={!canAnswer}
              onClick={() => handleAnswer(false)}
              data-testid="tf-answer-false"
              aria-keyshortcuts="f"
            >
              {TRUE_FALSE_COPY.falseButton}
            </Button>
          </div>
        </>
      ) : null}

      {(phase === "completed" || phase === "gameOver" || phase === "review") && (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3 text-center"
          data-testid="tf-terminal"
          data-status={phase === "gameOver" ? "gameOver" : "completed"}
        >
          <h2 className="text-2xl font-bold">
            {phase === "gameOver"
              ? TRUE_FALSE_COPY.gameOver
              : TRUE_FALSE_COPY.complete}
          </h2>
          <p data-testid="tf-final-score">Score {session.score}</p>
          <p className="text-sm text-[var(--fw-color-muted-strong)]">
            Correct {session.correctCount} · Incorrect {session.incorrectCount} ·
            Unanswered {session.unansweredCount}
          </p>
          {phase === "review" || settings.showAnswers ? (
            <ul
              className="mt-2 max-h-48 w-full max-w-lg list-none overflow-auto p-0 text-left text-sm"
              data-testid="tf-review-list"
              aria-label={TRUE_FALSE_COPY.reviewTitle}
            >
              {session.attempts.map((a) => {
                const src = session.statements.find(
                  (s) => s.id === a.statementId,
                );
                const label =
                  src?.content.text?.trim() ||
                  a.statementId.slice(0, 8);
                return (
                  <li
                    key={a.attemptKey}
                    className="border-b border-[var(--fw-color-border)] px-2 py-2"
                    data-kind={a.kind}
                  >
                    <span className="font-semibold">{label}</span>
                    <span className="mt-0.5 block text-[var(--fw-color-muted-strong)]">
                      Truth: {a.truth ? "True" : "False"} · You:{" "}
                      {a.playerAnswer === null
                        ? "—"
                        : a.playerAnswer
                          ? "True"
                          : "False"}{" "}
                      · {a.kind} · {a.points} pts
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
