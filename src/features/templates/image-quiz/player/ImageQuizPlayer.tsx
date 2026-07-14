"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import type { ImageQuizContentV1 } from "@/domain/content/imageQuiz.v1";
import type { SeededRng } from "@/services/rng/seeded-rng";
import type { SemanticAudioEmitter } from "@/services/audio/semantic-audio";
import type { SessionEventEmitter } from "@/domain/session-events";
import type { PlayerLifecycleCallbacks } from "@/features/player/types";
import { Button } from "@/design-system/Button";
import { IMAGE_QUIZ_COPY } from "@/features/templates/image-quiz/copy";
import { RevealStage } from "@/features/templates/image-quiz/player/RevealStage";
import {
  advanceAfterFeedback,
  applyBuzz,
  beginLoadingImage,
  buildImageQuizResultDetail,
  canAnswer,
  canBuzz,
  createImageQuizSession,
  currentQuestion,
  finishReview,
  markImageError,
  markImageReady,
  openAnswering,
  restartSession,
  submitAnswer,
  tickReveal,
  accuracyFromCounts,
  type ImageQuizSessionState,
} from "@/features/templates/image-quiz/session";
import {
  revealDurationMs,
  type ImageQuizSettings,
} from "@/features/templates/image-quiz/settings";
import { batchRevealCount } from "@/features/templates/image-quiz/reveal";

export interface ImageQuizPlayerProps {
  content: ImageQuizContentV1;
  settings: ImageQuizSettings;
  rng: SeededRng;
  audio: SemanticAudioEmitter;
  sessionEvents: SessionEventEmitter;
  lifecycle: PlayerLifecycleCallbacks;
  themeTokens?: Record<string, string>;
  reducedMotion: boolean;
  muted?: boolean;
  restartRequested?: boolean;
  /** Optional media resolver for reveal images. */
  resolveImageUrl?: (assetId: string) => string | null;
  /**
   * When true (tests/harness), skip real image load and mark ready immediately
   * unless the asset id contains "dead" / "MISSING".
   */
  simulateImageLoad?: boolean;
  onSessionChange?: (state: ImageQuizSessionState) => void;
  /** External pause from shell. */
  paused?: boolean;
}

const FEEDBACK_MS = 1400;
const FEEDBACK_REDUCED_MS = 900;
const REDUCED_REVEAL_MS = 1500;

export function ImageQuizPlayer({
  content,
  settings,
  rng,
  audio,
  sessionEvents,
  lifecycle,
  reducedMotion,
  restartRequested = false,
  resolveImageUrl,
  simulateImageLoad = true,
  onSessionChange,
  paused = false,
}: ImageQuizPlayerProps): ReactElement {
  const [session, setSession] = useState<ImageQuizSessionState>(() =>
    createImageQuizSession(content, settings, rng),
  );
  const [liveMessage, setLiveMessage] = useState("");
  const [displayRevealed, setDisplayRevealed] = useState(0);

  const sessionRef = useRef(session);
  const readyFired = useRef(false);
  const terminalFired = useRef(false);
  const revealStartRef = useRef<number | null>(null);
  const revealAccumRef = useRef(0);
  const answerStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRevealAudioAt = useRef(0);
  const pausedRef = useRef(paused);

  const now = useCallback(() => {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }, []);

  const elapsedSessionMs = useRef(now());

  useEffect(() => {
    sessionRef.current = session;
    onSessionChange?.(session);
  }, [session, onSessionChange]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (readyFired.current) return;
    readyFired.current = true;
    lifecycle.onReady();
    sessionEvents.emit({ type: "game.ready", elapsedMs: 0 });
  }, [lifecycle, sessionEvents]);

  const durationMs = useMemo(() => {
    const full = revealDurationMs(settings);
    return reducedMotion ? Math.min(full, REDUCED_REVEAL_MS) : full;
  }, [settings, reducedMotion]);

  const question = currentQuestion(session);
  const imageUrl =
    question?.revealImageAssetId && resolveImageUrl
      ? resolveImageUrl(question.revealImageAssetId)
      : null;

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current !== null) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  const emitTerminal = useCallback(
    (state: ImageQuizSessionState) => {
      if (terminalFired.current) return;
      if (state.phase !== "completed" && state.phase !== "gameOver") return;
      terminalFired.current = true;
      const detail = buildImageQuizResultDetail(state);
      const accuracy = accuracyFromCounts(
        state.correctCount,
        state.incorrectCount,
        state.unansweredCount,
      );
      const result = {
        score: state.score,
        status: state.phase === "gameOver" ? "gameOver" : "completed",
        correctCount: state.correctCount,
        incorrectCount: state.incorrectCount,
        unansweredCount: state.unansweredCount,
        accuracy,
        templateDetail: detail,
      };
      if (state.phase === "gameOver") {
        lifecycle.onGameOver(result);
        audio.emit("game.over");
        sessionEvents.emit({
          type: "game.over",
          elapsedMs: Math.floor(now() - elapsedSessionMs.current),
          metadata: { score: state.score },
        });
      } else {
        lifecycle.onComplete(result);
        audio.emit("game.complete");
        sessionEvents.emit({
          type: "game.completed",
          elapsedMs: Math.floor(now() - elapsedSessionMs.current),
          metadata: { score: state.score },
        });
      }
    },
    [audio, lifecycle, sessionEvents, now],
  );

  // Reveal RAF loop
  const runRevealLoop = useCallback(() => {
    stopRaf();
    const step = () => {
      const s = sessionRef.current;
      if (s.phase !== "revealing" || s.buzzed || pausedRef.current) {
        rafRef.current = null;
        return;
      }
      const start = revealStartRef.current ?? now();
      if (revealStartRef.current === null) revealStartRef.current = start;
      const elapsed = revealAccumRef.current + (now() - start);
      const next = tickReveal(s, elapsed, durationMs);

      if (next !== s) {
        // Rate-limit display updates for very fast schedules
        setDisplayRevealed((prev) =>
          batchRevealCount(prev, next.revealedCount, reducedMotion ? 32 : 8),
        );
        if (next.revealedCount > s.revealedCount) {
          const wall = now();
          if (wall - lastRevealAudioAt.current > 80) {
            lastRevealAudioAt.current = wall;
            audio.emit("imageQuiz.reveal", {
              intensity: Math.min(
                1,
                next.revealedCount / Math.max(1, next.revealOrder.length),
              ),
            });
          }
        }
        setSession(next);
        sessionRef.current = next;

        if (next.phase === "answering") {
          answerStartRef.current = now();
          setDisplayRevealed(next.revealedCount);
          setLiveMessage(IMAGE_QUIZ_COPY.fullRevealAnnounce);
          sessionEvents.emit({
            type: "item.presented",
            elapsedMs: Math.floor(now() - elapsedSessionMs.current),
            itemId: currentQuestion(next)?.id ?? null,
            metadata: {
              source: "imageQuiz.fullReveal",
              tilesRevealed: next.revealedCount,
              tileCount: next.revealOrder.length,
            },
          });
          rafRef.current = null;
          return;
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [audio, durationMs, now, reducedMotion, sessionEvents, stopRaf]);

  // Start / restart loading when entering loadingImage or intro→play
  const startQuestion = useCallback(() => {
    stopRaf();
    clearFeedbackTimer();
    revealStartRef.current = null;
    revealAccumRef.current = 0;
    answerStartRef.current = null;
    setDisplayRevealed(0);

    setSession((s) => {
      const next = beginLoadingImage(
        s.phase === "intro" ? s : s,
      );
      // Force loading phase from intro
      const loading =
        s.phase === "intro"
          ? {
              ...s,
              phase: "loadingImage" as const,
              imageReady: false,
              imageError: false,
              inputLocked: true,
            }
          : next.phase === "loadingImage"
            ? next
            : {
                ...s,
                phase: "loadingImage" as const,
                imageReady: false,
                imageError: false,
                inputLocked: true,
              };
      return loading;
    });
  }, [clearFeedbackTimer, stopRaf]);

  // Simulate or handle image readiness
  useEffect(() => {
    if (session.phase !== "loadingImage") return;
    const q = currentQuestion(session);
    if (!q?.revealImageAssetId) {
      setSession((s) => markImageError(s));
      return;
    }

    const assetId = q.revealImageAssetId;
    const looksBroken =
      assetId.includes("dead") ||
      assetId.toLowerCase().includes("missing") ||
      assetId.includes("broken");

    if (simulateImageLoad) {
      const t = setTimeout(() => {
        if (looksBroken) {
          setSession((s) => markImageError(s));
          lifecycle.onFatalError(
            "image-quiz-missing-reveal",
            IMAGE_QUIZ_COPY.imageError,
          );
          return;
        }
        setSession((s) => {
          const ready = markImageReady(s);
          sessionRef.current = ready;
          return ready;
        });
        sessionEvents.emit({
          type: "item.presented",
          elapsedMs: Math.floor(now() - elapsedSessionMs.current),
          itemId: q.id,
          metadata: { source: "imageQuiz.question" },
        });
      }, 20);
      return () => clearTimeout(t);
    }

    // Real image path
    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        setSession((s) => markImageReady(s));
        sessionEvents.emit({
          type: "item.presented",
          elapsedMs: Math.floor(now() - elapsedSessionMs.current),
          itemId: q.id,
          metadata: { source: "imageQuiz.question" },
        });
      };
      img.onerror = () => {
        setSession((s) => markImageError(s));
        lifecycle.onFatalError(
          "image-quiz-missing-reveal",
          IMAGE_QUIZ_COPY.imageError,
        );
      };
      img.src = imageUrl;
      return;
    }

    // No URL resolver — treat as ready placeholder (owner media not resolved in harness)
    const t = setTimeout(() => {
      setSession((s) => markImageReady(s));
    }, 20);
    return () => clearTimeout(t);
  }, [
    session.phase,
    session.questionIndex,
    simulateImageLoad,
    imageUrl,
    lifecycle,
    sessionEvents,
    now,
  ]);

  // Kick reveal loop when entering revealing
  useEffect(() => {
    if (session.phase !== "revealing" || paused) return;
    if (revealStartRef.current === null) {
      revealStartRef.current = now();
    }
    runRevealLoop();
    return () => stopRaf();
  }, [session.phase, session.questionIndex, paused, runRevealLoop, stopRaf, now]);

  // Pause freezes reveal accum
  useEffect(() => {
    if (paused && session.phase === "revealing" && revealStartRef.current !== null) {
      revealAccumRef.current += now() - revealStartRef.current;
      revealStartRef.current = null;
      stopRaf();
    } else if (
      !paused &&
      session.phase === "revealing" &&
      !session.buzzed
    ) {
      revealStartRef.current = now();
      runRevealLoop();
    }
  }, [paused, session.phase, session.buzzed, now, runRevealLoop, stopRaf]);

  // Auto-proceed after feedback
  useEffect(() => {
    if (session.phase !== "feedback") return;
    if (!settings.autoProceed) return;
    clearFeedbackTimer();
    const delay = reducedMotion ? FEEDBACK_REDUCED_MS : FEEDBACK_MS;
    feedbackTimerRef.current = setTimeout(() => {
      setSession((s) => {
        const next = advanceAfterFeedback(s, settings, rng);
        sessionRef.current = next;
        if (next.phase === "completed" || next.phase === "gameOver") {
          queueMicrotask(() => emitTerminal(next));
        }
        if (next.phase === "review") {
          setLiveMessage(
            next.livesRemaining === 0
              ? IMAGE_QUIZ_COPY.gameOverAnnounce
              : IMAGE_QUIZ_COPY.completeAnnounce(next.score),
          );
        }
        return next;
      });
      setDisplayRevealed(0);
      revealStartRef.current = null;
      revealAccumRef.current = 0;
    }, delay);
    return () => clearFeedbackTimer();
  }, [
    session.phase,
    session.questionIndex,
    settings,
    rng,
    reducedMotion,
    clearFeedbackTimer,
    emitTerminal,
  ]);

  // Terminal from review finish or direct complete
  useEffect(() => {
    if (session.phase === "completed" || session.phase === "gameOver") {
      emitTerminal(session);
    }
  }, [session, emitTerminal]);

  // Shell restart
  useEffect(() => {
    if (!restartRequested) return;
    terminalFired.current = false;
    stopRaf();
    clearFeedbackTimer();
    revealStartRef.current = null;
    revealAccumRef.current = 0;
    const next = restartSession(content, settings, rng);
    setSession(next);
    setDisplayRevealed(0);
    setLiveMessage("");
  }, [
    restartRequested,
    content,
    settings,
    rng,
    stopRaf,
    clearFeedbackTimer,
  ]);

  useEffect(() => {
    return () => {
      stopRaf();
      clearFeedbackTimer();
    };
  }, [stopRaf, clearFeedbackTimer]);

  const handleBuzz = useCallback(() => {
    const s = sessionRef.current;
    if (!canBuzz(s)) return;

    audio.unlock().catch(() => {
      /* ignore */
    });
    // Buzzer is the semantic cue; Button supplies soft press via playUiPress.
    audio.emit("imageQuiz.buzzer", { intensity: 1 });

    const start = revealStartRef.current;
    const elapsed =
      revealAccumRef.current + (start !== null ? now() - start : 0);

    stopRaf();
    revealStartRef.current = null;
    revealAccumRef.current = elapsed;

    let next = applyBuzz(s, elapsed, durationMs);
    // Immediately open answering (same frame lock)
    next = openAnswering(next);
    sessionRef.current = next;
    setSession(next);
    setDisplayRevealed(next.revealedCount);
    setLiveMessage(IMAGE_QUIZ_COPY.buzzAnnounce);
    answerStartRef.current = now();

    sessionEvents.emit({
      type: "imageQuiz.buzz",
      elapsedMs: Math.floor(now() - elapsedSessionMs.current),
      itemId: currentQuestion(next)?.id ?? null,
      metadata: {
        tilesRevealed: next.revealedCount,
        tileCount: next.revealOrder.length,
        revealElapsedMs: elapsed,
      },
    });
  }, [audio, durationMs, now, sessionEvents, stopRaf]);

  // Space key as buzzer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      const s = sessionRef.current;
      if (!canBuzz(s)) return;
      // Prevent page scroll
      e.preventDefault();
      handleBuzz();
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [handleBuzz]);

  const handleAnswer = useCallback(
    (answerId: string) => {
      const s = sessionRef.current;
      if (!canAnswer(s)) return;

      const answerElapsed =
        answerStartRef.current !== null
          ? Math.max(0, now() - answerStartRef.current)
          : 0;

      const next = submitAnswer(s, settings, answerId, answerElapsed);
      sessionRef.current = next;
      setSession(next);
      setDisplayRevealed(next.revealOrder.length);

      const correct = next.lastScore && next.lastScore.points > 0;
      if (correct) {
        audio.emit("answer.correct");
        setLiveMessage(
          IMAGE_QUIZ_COPY.correctAnnounce(next.lastScore?.points ?? 0),
        );
      } else {
        audio.emit("answer.incorrect");
        setLiveMessage(IMAGE_QUIZ_COPY.incorrectAnnounce);
      }

      sessionEvents.emit({
        type: "answer.submitted",
        elapsedMs: Math.floor(now() - elapsedSessionMs.current),
        itemId: currentQuestion(next)?.id ?? null,
        metadata: {
          answerId,
          answerElapsedMs: answerElapsed,
        },
      });
      sessionEvents.emit({
        type: "answer.resolved",
        elapsedMs: Math.floor(now() - elapsedSessionMs.current),
        itemId: currentQuestion(next)?.id ?? null,
        metadata: {
          outcome: next.results.at(-1)?.outcome,
          points: next.lastScore?.points ?? 0,
          tilesRevealedAtBuzz: next.results.at(-1)?.tilesRevealedAtBuzz,
          tileCount: next.results.at(-1)?.tileCount,
        },
      });
    },
    [audio, now, sessionEvents, settings],
  );

  const handleContinue = useCallback(() => {
    if (sessionRef.current.phase === "feedback") {
      clearFeedbackTimer();
      setSession((s) => {
        const next = advanceAfterFeedback(s, settings, rng);
        sessionRef.current = next;
        if (next.phase === "completed" || next.phase === "gameOver") {
          queueMicrotask(() => emitTerminal(next));
        }
        return next;
      });
      setDisplayRevealed(0);
      revealStartRef.current = null;
      revealAccumRef.current = 0;
      return;
    }
    if (sessionRef.current.phase === "review") {
      setSession((s) => {
        const next = finishReview(s);
        sessionRef.current = next;
        queueMicrotask(() => emitTerminal(next));
        return next;
      });
    }
  }, [clearFeedbackTimer, emitTerminal, rng, settings]);

  const handleStart = () => {
    audio.unlock().catch(() => {
      /* ignore */
    });
    sessionEvents.emit({
      type: "session.started",
      elapsedMs: 0,
    });
    startQuestion();
  };

  const handleRetryImage = () => {
    setSession((s) => ({
      ...s,
      phase: "loadingImage",
      imageError: false,
      imageReady: false,
      inputLocked: true,
    }));
  };

  const progress = `${session.questionIndex + 1} of ${session.questions.length}`;
  const revealProgress =
    session.revealOrder.length > 0
      ? Math.min(1, displayRevealed / session.revealOrder.length)
      : 0;

  const showAnswers =
    session.answersVisible &&
    (session.phase === "answering" ||
      session.phase === "feedback" ||
      session.phase === "buzzed" ||
      (settings.layout === "together" &&
        (session.phase === "revealing" || session.phase === "loadingImage")));

  const answersDisabled = !canAnswer(session);

  return (
    <div
      className="flex w-full flex-col items-center gap-4 text-[var(--fw-color-ink)]"
      data-template-player="image-quiz"
      data-image-quiz-phase={session.phase}
      data-layout={settings.layout}
    >
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        data-testid="image-quiz-live"
      >
        {liveMessage}
      </div>

      <div
        className="flex w-full max-w-2xl flex-wrap items-center justify-between gap-2 text-sm font-semibold"
        data-testid="image-quiz-hud"
      >
        <span data-testid="image-quiz-progress">{progress}</span>
        <span data-testid="image-quiz-score">
          {IMAGE_QUIZ_COPY.scoreLabel}: {session.score}
        </span>
        {session.livesRemaining !== null ? (
          <span data-testid="image-quiz-lives">
            {IMAGE_QUIZ_COPY.livesLabel}: {session.livesRemaining}
          </span>
        ) : null}
      </div>

      {session.phase === "intro" ? (
        <div className="flex w-full max-w-md flex-col items-center gap-3 p-4 text-center">
          <p className="text-base text-[var(--fw-color-ink-secondary)]">
            {IMAGE_QUIZ_COPY.intro}
          </p>
          <Button
            variant="primary"
            onClick={handleStart}
            data-testid="image-quiz-start"
          >
            Play
          </Button>
        </div>
      ) : null}

      {session.phase !== "intro" &&
      session.phase !== "completed" &&
      session.phase !== "gameOver" &&
      session.phase !== "review" ? (
        <div
          className={
            settings.layout === "together"
              ? "grid w-full max-w-4xl gap-4 lg:grid-cols-2"
              : "flex w-full max-w-2xl flex-col gap-4"
          }
        >
          <div className="flex flex-col gap-2">
            {question?.prompt.text ? (
              <p
                className="text-center text-lg font-semibold"
                data-testid="image-quiz-prompt"
              >
                {question.prompt.text}
              </p>
            ) : null}

            {session.phase === "loadingImage" ? (
              <div
                className="flex min-h-[12rem] items-center justify-center rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)]"
                data-testid="image-quiz-loading"
              >
                {session.imageError ? (
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <p className="text-sm text-[var(--fw-color-danger-text)]">
                      {IMAGE_QUIZ_COPY.imageError}
                    </p>
                    <Button variant="secondary" onClick={handleRetryImage}>
                      {IMAGE_QUIZ_COPY.retryImage}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--fw-color-muted)]">
                    {IMAGE_QUIZ_COPY.loadingImage}
                  </p>
                )}
              </div>
            ) : (
              <RevealStage
                grid={session.grid}
                revealOrder={session.revealOrder}
                revealedCount={
                  session.phase === "feedback"
                    ? session.revealOrder.length
                    : displayRevealed
                }
                imageAlt={question?.revealImageAlt ?? "Reveal image"}
                imageUrl={imageUrl}
                reducedMotion={reducedMotion}
                progress={revealProgress}
                fullyRevealed={
                  session.phase === "feedback" ||
                  session.phase === "answering" ||
                  session.revealedCount >= session.revealOrder.length
                }
              />
            )}

            {session.phase === "revealing" ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-[var(--fw-color-muted-strong)]">
                  {IMAGE_QUIZ_COPY.buzzHint}
                </p>
                <Button
                  variant="primary"
                  className="min-h-14 min-w-[12rem] text-xl"
                  onClick={handleBuzz}
                  disabled={!canBuzz(session)}
                  data-testid="image-quiz-buzzer"
                  aria-label={IMAGE_QUIZ_COPY.buzzer}
                >
                  {IMAGE_QUIZ_COPY.buzzer}
                </Button>
              </div>
            ) : null}
          </div>

          {showAnswers && question ? (
            <div
              className="flex flex-col gap-2"
              data-testid="image-quiz-answers"
              role="group"
              aria-label="Answers"
            >
              {question.answers.map((answer) => {
                const isSelected = session.selectedAnswerId === answer.id;
                const isCorrect = answer.id === question.correctAnswerId;
                const showFeedback = session.phase === "feedback";
                let extra = "";
                if (showFeedback && isCorrect) {
                  extra =
                    "border-[var(--fw-color-success)] bg-[var(--fw-color-success-soft,#e8f8f0)]";
                } else if (showFeedback && isSelected && !isCorrect) {
                  extra =
                    "border-[var(--fw-color-coral)] bg-[var(--fw-color-danger-soft,#ffe8ec)]";
                }
                return (
                  <Button
                    key={answer.id}
                    variant="secondary"
                    className={`w-full justify-start text-left ${extra}`}
                    onClick={() => handleAnswer(answer.id)}
                    disabled={answersDisabled}
                    data-testid={`image-quiz-answer-${answer.id}`}
                    data-selected={isSelected ? "true" : "false"}
                    data-correct={
                      showFeedback && isCorrect ? "true" : undefined
                    }
                  >
                    {answer.content.text?.trim() || "Answer"}
                  </Button>
                );
              })}
            </div>
          ) : null}

          {session.phase === "feedback" ? (
            <div
              className="flex flex-col items-center gap-2"
              data-testid="image-quiz-feedback"
            >
              <p className="text-lg font-bold">
                {session.lastScore && session.lastScore.points > 0
                  ? IMAGE_QUIZ_COPY.correct
                  : IMAGE_QUIZ_COPY.incorrect}
              </p>
              {session.lastScore && session.lastScore.points > 0 ? (
                <p className="text-sm">
                  {IMAGE_QUIZ_COPY.pointsAwarded(session.lastScore.points)}
                </p>
              ) : null}
              {!settings.autoProceed ? (
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  data-testid="image-quiz-continue"
                >
                  {IMAGE_QUIZ_COPY.continue}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {session.phase === "review" ? (
        <div
          className="flex w-full max-w-lg flex-col gap-3 rounded-[var(--fw-radius-lg)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] p-4"
          data-testid="image-quiz-review"
        >
          <h3 className="text-center text-xl font-bold">
            {session.livesRemaining === 0
              ? IMAGE_QUIZ_COPY.gameOver
              : IMAGE_QUIZ_COPY.complete}
          </h3>
          <p className="text-center font-semibold">
            {IMAGE_QUIZ_COPY.scoreLabel}: {session.score}
          </p>
          <ul className="flex list-none flex-col gap-2 p-0 text-sm">
            {session.results.map((r) => {
              const q = session.questions.find((x) => x.id === r.questionId);
              return (
                <li
                  key={r.questionId}
                  className="rounded border border-[var(--fw-color-border)] p-2"
                >
                  <p className="font-semibold">
                    {q?.prompt.text ?? "Question"}
                  </p>
                  <p>
                    {r.outcome} · {r.points} pts · tiles {r.tilesRevealedAtBuzz}
                    /{r.tileCount}
                    {r.buzzed ? " · buzzed" : " · full reveal"}
                  </p>
                </li>
              );
            })}
          </ul>
          <Button
            variant="primary"
            onClick={handleContinue}
            data-testid="image-quiz-finish-review"
          >
            {IMAGE_QUIZ_COPY.continue}
          </Button>
        </div>
      ) : null}

      {session.phase === "completed" || session.phase === "gameOver" ? (
        <div
          className="text-center"
          data-testid="image-quiz-terminal"
          data-status={session.phase}
        >
          <p className="text-xl font-bold">
            {session.phase === "gameOver"
              ? IMAGE_QUIZ_COPY.gameOver
              : IMAGE_QUIZ_COPY.complete}
          </p>
          <p>
            {IMAGE_QUIZ_COPY.scoreLabel}: {session.score}
          </p>
        </div>
      ) : null}

      <span
        hidden
        data-testid="image-quiz-debug"
        data-phase={session.phase}
        data-revealed={session.revealedCount}
        data-display-revealed={displayRevealed}
        data-buzzed={session.buzzed ? "true" : "false"}
        data-score={session.score}
        data-input-locked={session.inputLocked ? "true" : "false"}
      />
    </div>
  );
}
