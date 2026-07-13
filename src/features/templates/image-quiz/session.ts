import type {
  ImageQuizContentV1,
  ImageQuizQuestion,
} from "@/domain/content/imageQuiz.v1";
import type { SeededRng } from "@/services/rng/seeded-rng";
import {
  buildRevealOrder,
  computeTileGrid,
  revealedCountAt,
  type TileGridSize,
} from "@/features/templates/image-quiz/reveal";
import {
  scoreImageQuizAnswer,
  type ScoreAnswerResult,
} from "@/features/templates/image-quiz/scoring";
import type { ImageQuizSettings } from "@/features/templates/image-quiz/settings";

/**
 * Session-only Image Quiz state. Never mutates the saved content pack.
 *
 * Phases (template-owned inside shell playing):
 * intro → loadingImage → revealing → buzzed → answering → feedback
 * → (next question or) completed | gameOver → review
 */

export type ImageQuizPhase =
  | "intro"
  | "loadingImage"
  | "revealing"
  | "buzzed"
  | "answering"
  | "feedback"
  | "completed"
  | "gameOver"
  | "review";

export type QuestionOutcome = "correct" | "incorrect" | "unanswered";

export interface QuestionResultDetail {
  questionId: string;
  chosenAnswerId: string | null;
  correctAnswerId: string;
  outcome: QuestionOutcome;
  points: number;
  scoreBreakdown: ScoreAnswerResult;
  /** Tiles revealed when buzzer fired; tileCount when no buzz. */
  tilesRevealedAtBuzz: number;
  tileCount: number;
  /** True when player pressed buzzer before full reveal. */
  buzzed: boolean;
  buzzElapsedMs: number | null;
  answerElapsedMs: number | null;
  revealOrder: number[];
  grid: TileGridSize;
}

export interface ImageQuizSessionState {
  questions: readonly ImageQuizQuestion[];
  questionOrder: string[];
  questionIndex: number;
  phase: ImageQuizPhase;
  score: number;
  livesRemaining: number | null;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  /** Per-question results in play order. */
  results: QuestionResultDetail[];
  /** Current question reveal state */
  grid: TileGridSize;
  revealOrder: number[];
  revealedCount: number;
  /** Active reveal elapsed ms (paused on buzz / shell pause). */
  revealElapsedMs: number;
  buzzed: boolean;
  /** Locked after first valid buzz or answer. */
  inputLocked: boolean;
  selectedAnswerId: string | null;
  lastScore: ScoreAnswerResult | null;
  imageReady: boolean;
  imageError: boolean;
  /** When true, answers may be shown (layout together or after buzz/full reveal). */
  answersVisible: boolean;
}

export function buildQuestionOrder(
  content: ImageQuizContentV1,
  settings: Pick<ImageQuizSettings, "shuffleQuestions">,
  rng: SeededRng,
): ImageQuizQuestion[] {
  const questions = content.questions.map((q) => ({
    ...q,
    prompt: { ...q.prompt },
    answers: q.answers.map((a) => ({ ...a, content: { ...a.content } })),
  }));
  if (settings.shuffleQuestions) {
    return rng.stream("contentOrder").shuffle(questions);
  }
  return questions;
}

function aspectHintFromQuestion(_question: ImageQuizQuestion): number {
  // Domain pack has no aspectHint; default landscape. Player may pass real ratio later.
  return 3 / 2;
}

export function createImageQuizSession(
  content: ImageQuizContentV1,
  settings: ImageQuizSettings,
  rng: SeededRng,
  options?: { aspectRatio?: number },
): ImageQuizSessionState {
  const questions = buildQuestionOrder(content, settings, rng);
  const first = questions[0];
  const grid = first
    ? computeTileGrid({
        override: settings.tileGrid ?? null,
        aspectRatio: options?.aspectRatio ?? aspectHintFromQuestion(first),
      })
    : { cols: 12, rows: 8 };

  const revealOrder = first
    ? buildRevealOrder(grid.cols, grid.rows, rng)
    : [];

  return {
    questions,
    questionOrder: questions.map((q) => q.id),
    questionIndex: 0,
    phase: questions.length === 0 ? "completed" : "intro",
    score: 0,
    livesRemaining: settings.lives,
    correctCount: 0,
    incorrectCount: 0,
    unansweredCount: 0,
    results: [],
    grid,
    revealOrder,
    revealedCount: 0,
    revealElapsedMs: 0,
    buzzed: false,
    inputLocked: false,
    selectedAnswerId: null,
    lastScore: null,
    imageReady: false,
    imageError: false,
    answersVisible: settings.layout === "together",
  };
}

export function currentQuestion(
  state: ImageQuizSessionState,
): ImageQuizQuestion | null {
  return state.questions[state.questionIndex] ?? null;
}

export function beginLoadingImage(
  state: ImageQuizSessionState,
): ImageQuizSessionState {
  if (state.phase !== "intro" && state.phase !== "feedback") {
    // Allow re-entry after next-question setup uses intro-like reset
  }
  if (state.phase === "completed" || state.phase === "gameOver") {
    return state;
  }
  return {
    ...state,
    phase: "loadingImage",
    imageReady: false,
    imageError: false,
    inputLocked: true,
  };
}

export function markImageReady(
  state: ImageQuizSessionState,
): ImageQuizSessionState {
  if (state.phase !== "loadingImage" && state.phase !== "intro") {
    return { ...state, imageReady: true, imageError: false };
  }
  return {
    ...state,
    phase: "revealing",
    imageReady: true,
    imageError: false,
    inputLocked: false,
    revealedCount: 0,
    revealElapsedMs: 0,
    buzzed: false,
    selectedAnswerId: null,
    lastScore: null,
  };
}

export function markImageError(
  state: ImageQuizSessionState,
): ImageQuizSessionState {
  return {
    ...state,
    phase: "loadingImage",
    imageReady: false,
    imageError: true,
    inputLocked: true,
  };
}

/**
 * Advance reveal clock. Returns same state if not revealing or input locked after buzz.
 * Does not schedule animation frames — pure elapsed mapping.
 */
export function tickReveal(
  state: ImageQuizSessionState,
  revealElapsedMs: number,
  durationMs: number,
): ImageQuizSessionState {
  if (state.phase !== "revealing" || state.buzzed) {
    return state;
  }

  const tileCount = state.revealOrder.length;
  const count = revealedCountAt(revealElapsedMs, durationMs, tileCount);

  if (
    count === state.revealedCount &&
    revealElapsedMs === state.revealElapsedMs
  ) {
    return state;
  }

  // Full reveal without buzz → open answering
  if (count >= tileCount && tileCount > 0) {
    return {
      ...state,
      revealElapsedMs,
      revealedCount: tileCount,
      phase: "answering",
      answersVisible: true,
      inputLocked: false,
      buzzed: false,
    };
  }

  return {
    ...state,
    revealElapsedMs,
    revealedCount: count,
  };
}

/**
 * Valid buzzer press: lock once, freeze reveal count, open answering.
 * Idempotent — second buzz is a no-op.
 */
export function applyBuzz(
  state: ImageQuizSessionState,
  revealElapsedMs: number,
  durationMs: number,
): ImageQuizSessionState {
  if (state.phase !== "revealing" || state.buzzed || state.inputLocked) {
    return state;
  }

  const tileCount = state.revealOrder.length;
  const count = revealedCountAt(revealElapsedMs, durationMs, tileCount);

  return {
    ...state,
    phase: "buzzed",
    buzzed: true,
    inputLocked: true,
    revealElapsedMs,
    revealedCount: count,
    answersVisible: true,
  };
}

/** Transition buzzed → answering (same frame or next tick). */
export function openAnswering(state: ImageQuizSessionState): ImageQuizSessionState {
  if (state.phase !== "buzzed" && state.phase !== "revealing") {
    // Already answering or later
    if (state.phase === "answering") return state;
  }
  if (
    state.phase !== "buzzed" &&
    !(state.phase === "revealing" && state.revealedCount >= state.revealOrder.length)
  ) {
    return state;
  }
  return {
    ...state,
    phase: "answering",
    answersVisible: true,
    inputLocked: false,
  };
}

/**
 * Resolve answer selection once. Wrong/unanswered may cost a life.
 */
export function submitAnswer(
  state: ImageQuizSessionState,
  settings: Pick<ImageQuizSettings, "basePoints" | "lives">,
  chosenAnswerId: string | null,
  answerElapsedMs: number,
): ImageQuizSessionState {
  if (state.phase !== "answering" || state.inputLocked) {
    return state;
  }

  const question = currentQuestion(state);
  if (!question || !question.correctAnswerId) {
    return state;
  }

  const outcome: QuestionOutcome =
    chosenAnswerId === null
      ? "unanswered"
      : chosenAnswerId === question.correctAnswerId
        ? "correct"
        : "incorrect";

  const scoreBreakdown = scoreImageQuizAnswer({
    isCorrect: outcome === "correct",
    basePoints: settings.basePoints,
    tilesRevealed: state.revealedCount,
    tileCount: state.revealOrder.length,
    answerElapsedMs,
  });

  let livesRemaining = state.livesRemaining;
  if (outcome !== "correct" && livesRemaining !== null) {
    livesRemaining = Math.max(0, livesRemaining - 1);
  }

  const detail: QuestionResultDetail = {
    questionId: question.id,
    chosenAnswerId,
    correctAnswerId: question.correctAnswerId,
    outcome,
    points: scoreBreakdown.points,
    scoreBreakdown,
    tilesRevealedAtBuzz: state.revealedCount,
    tileCount: state.revealOrder.length,
    buzzed: state.buzzed,
    buzzElapsedMs: state.buzzed ? state.revealElapsedMs : null,
    answerElapsedMs,
    revealOrder: [...state.revealOrder],
    grid: { ...state.grid },
  };

  return {
    ...state,
    phase: "feedback",
    inputLocked: true,
    selectedAnswerId: chosenAnswerId,
    lastScore: scoreBreakdown,
    score: state.score + scoreBreakdown.points,
    livesRemaining,
    correctCount: state.correctCount + (outcome === "correct" ? 1 : 0),
    incorrectCount: state.incorrectCount + (outcome === "incorrect" ? 1 : 0),
    unansweredCount: state.unansweredCount + (outcome === "unanswered" ? 1 : 0),
    results: [...state.results, detail],
    // Full image on feedback
    revealedCount: state.revealOrder.length,
    answersVisible: true,
  };
}

/**
 * After feedback: advance to next question, complete, game over, or review.
 */
export function advanceAfterFeedback(
  state: ImageQuizSessionState,
  settings: ImageQuizSettings,
  rng: SeededRng,
  options?: { aspectRatio?: number },
): ImageQuizSessionState {
  if (state.phase !== "feedback") {
    return state;
  }

  const outOfLives = state.livesRemaining === 0;
  const nextIndex = state.questionIndex + 1;
  const hasMore = !outOfLives && nextIndex < state.questions.length;

  if (!hasMore) {
    if (settings.showAnswers) {
      return { ...state, phase: "review", inputLocked: true };
    }
    return {
      ...state,
      phase: outOfLives ? "gameOver" : "completed",
      inputLocked: true,
    };
  }

  const nextQ = state.questions[nextIndex]!;
  const grid = computeTileGrid({
    override: settings.tileGrid ?? null,
    aspectRatio: options?.aspectRatio ?? aspectHintFromQuestion(nextQ),
  });
  // Fresh board stream consumption continues from same rng instance
  const revealOrder = buildRevealOrder(grid.cols, grid.rows, rng);

  return {
    ...state,
    questionIndex: nextIndex,
    phase: "loadingImage",
    grid,
    revealOrder,
    revealedCount: 0,
    revealElapsedMs: 0,
    buzzed: false,
    inputLocked: true,
    selectedAnswerId: null,
    lastScore: null,
    imageReady: false,
    imageError: false,
    answersVisible: settings.layout === "together",
  };
}

/**
 * Finish review → completed or gameOver terminal phase for lifecycle callbacks.
 */
export function finishReview(state: ImageQuizSessionState): ImageQuizSessionState {
  if (state.phase !== "review") return state;
  const gameOver = state.livesRemaining === 0;
  return {
    ...state,
    phase: gameOver ? "gameOver" : "completed",
    inputLocked: true,
  };
}

export function restartSession(
  content: ImageQuizContentV1,
  settings: ImageQuizSettings,
  rng: SeededRng,
): ImageQuizSessionState {
  return createImageQuizSession(content, settings, rng);
}

export function buildImageQuizResultDetail(state: ImageQuizSessionState): {
  version: number;
  data: {
    results: QuestionResultDetail[];
    questionOrder: string[];
    score: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    livesRemaining: number | null;
  };
} {
  return {
    version: 1,
    data: {
      results: state.results.map((r) => ({
        ...r,
        revealOrder: [...r.revealOrder],
        grid: { ...r.grid },
        scoreBreakdown: { ...r.scoreBreakdown },
      })),
      questionOrder: [...state.questionOrder],
      score: state.score,
      correctCount: state.correctCount,
      incorrectCount: state.incorrectCount,
      unansweredCount: state.unansweredCount,
      livesRemaining: state.livesRemaining,
    },
  };
}

export function accuracyFromCounts(
  correct: number,
  incorrect: number,
  unanswered: number,
): number | null {
  const total = correct + incorrect + unanswered;
  if (total === 0) return null;
  return correct / total;
}

/**
 * Whether buzzer input is currently accepted.
 */
export function canBuzz(state: ImageQuizSessionState): boolean {
  return (
    state.phase === "revealing" &&
    !state.buzzed &&
    !state.inputLocked &&
    state.imageReady &&
    !state.imageError
  );
}

/**
 * Whether answer selection is accepted.
 */
export function canAnswer(state: ImageQuizSessionState): boolean {
  return state.phase === "answering" && !state.inputLocked;
}
