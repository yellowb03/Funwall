import type {
  Statement,
  StatementsContentV1,
} from "@/domain/content/statements.v1";
import type { SeededRng } from "@/services/rng/seeded-rng";
import {
  answerWindowMs,
  type TrueFalseSettings,
} from "@/features/templates/true-false/settings";

/**
 * True/False player phases (template-owned sub-states inside shell "playing").
 *
 * intro → itemEntering → answerWindow → answered|expired → feedback
 *   → itemLeaving → next|repeat → completed|gameOver → review
 */
export type TrueFalsePhase =
  | "intro"
  | "itemEntering"
  | "answerWindow"
  | "answered"
  | "expired"
  | "feedback"
  | "itemLeaving"
  | "completed"
  | "gameOver"
  | "review";

export type AnswerChoice = true | false;

export type ResolveKind = "correct" | "incorrect" | "expired";

export interface TrueFalseAttempt {
  /** Stable attempt id for this presentation (statementId + pass index). */
  attemptKey: string;
  statementId: string;
  truth: boolean;
  /** null when expired / unanswered. */
  playerAnswer: AnswerChoice | null;
  kind: ResolveKind;
  presentedAt: number;
  /** Set once on answer or expiry. */
  resolvedAt: number;
  points: number;
  passIndex: number;
}

export interface TrueFalseSessionState {
  /** Ordered statements for this session (after optional shuffle). */
  statements: readonly Statement[];
  phase: TrueFalsePhase;
  /** Index into queue for the current pass. */
  queueIndex: number;
  /** How many full passes have completed (0 during first pass). */
  passIndex: number;
  /** First pass must complete before repeat reshuffles. */
  firstPassComplete: boolean;
  livesRemaining: number | null;
  attempts: TrueFalseAttempt[];
  currentStatementId: string | null;
  presentedAt: number | null;
  deadlineAt: number | null;
  windowMs: number;
  /** Captured answer waiting for resolve; null if none. */
  pendingAnswer: AnswerChoice | null;
  pendingAnswerAt: number | null;
  /** Once set for the current item, further input is ignored. */
  resolved: boolean;
  lastResolve: ResolveKind | null;
  lastAnswer: AnswerChoice | null;
  score: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  streak: number;
  bestStreak: number;
  /** Session-level countdown expired; finish after current item resolves. */
  sessionTimeUp: boolean;
  inputLocked: boolean;
  /** Points awarded on last resolve (for feedback UI). */
  lastPoints: number;
}

const POINTS_CORRECT = 100;
const POINTS_SPEED_MAX = 50;

export function pointsForCorrect(
  presentedAt: number,
  answeredAt: number,
  windowMs: number,
): number {
  if (windowMs <= 0) return POINTS_CORRECT;
  const elapsed = Math.max(0, answeredAt - presentedAt);
  const remainingRatio = Math.max(0, 1 - elapsed / windowMs);
  return POINTS_CORRECT + Math.round(POINTS_SPEED_MAX * remainingRatio);
}

function attemptKey(statementId: string, passIndex: number, seq: number): string {
  return `${statementId}::p${passIndex}::n${seq}`;
}

export function buildSessionOrder(
  content: StatementsContentV1,
  settings: Pick<TrueFalseSettings, "shuffle">,
  rng: SeededRng,
): Statement[] {
  const items = content.statements.map((s) => ({
    id: s.id,
    content: { ...s.content },
    isTrue: s.isTrue,
  }));
  if (settings.shuffle) {
    return rng.stream("contentOrder").shuffle(items);
  }
  return items;
}

export function createTrueFalseSession(
  content: StatementsContentV1,
  settings: TrueFalseSettings,
  rng: SeededRng,
): TrueFalseSessionState {
  const statements = buildSessionOrder(content, settings, rng);
  const windowMs = answerWindowMs(settings.speed);
  const livesRemaining =
    settings.lives === null || settings.lives === undefined
      ? null
      : settings.lives;

  return {
    statements,
    phase: "intro",
    queueIndex: 0,
    passIndex: 0,
    firstPassComplete: false,
    livesRemaining,
    attempts: [],
    currentStatementId: null,
    presentedAt: null,
    deadlineAt: null,
    windowMs,
    pendingAnswer: null,
    pendingAnswerAt: null,
    resolved: false,
    lastResolve: null,
    lastAnswer: null,
    score: 0,
    correctCount: 0,
    incorrectCount: 0,
    unansweredCount: 0,
    streak: 0,
    bestStreak: 0,
    sessionTimeUp: false,
    inputLocked: false,
    lastPoints: 0,
  };
}

export function currentStatement(
  state: TrueFalseSessionState,
): Statement | null {
  if (
    state.queueIndex < 0 ||
    state.queueIndex >= state.statements.length
  ) {
    return null;
  }
  return state.statements[state.queueIndex] ?? null;
}

export function canStart(state: TrueFalseSessionState): boolean {
  return state.phase === "intro" && state.statements.length >= 2;
}

/**
 * Begin presenting the current queue item (itemEntering).
 * presentedAt/deadline are set when answerWindow opens (beginAnswerWindow).
 */
export function beginItemEnter(state: TrueFalseSessionState): TrueFalseSessionState {
  if (state.phase !== "intro" && state.phase !== "itemLeaving") {
    return state;
  }
  if (state.sessionTimeUp && state.phase === "itemLeaving") {
    return finishSession(state);
  }
  const statement = currentStatement(state);
  if (!statement) {
    return finishSession(state);
  }
  return {
    ...state,
    phase: "itemEntering",
    currentStatementId: statement.id,
    presentedAt: null,
    deadlineAt: null,
    pendingAnswer: null,
    pendingAnswerAt: null,
    resolved: false,
    lastResolve: null,
    lastAnswer: null,
    lastPoints: 0,
    inputLocked: true,
  };
}

/**
 * Open the answer window. Monotonic clock provides `now`.
 * Deadline is the authoritative expiry boundary.
 */
export function beginAnswerWindow(
  state: TrueFalseSessionState,
  now: number,
): TrueFalseSessionState {
  if (state.phase !== "itemEntering" && state.phase !== "intro") {
    return state;
  }
  const statement = currentStatement(state);
  if (!statement) {
    return finishSession(state);
  }
  return {
    ...state,
    phase: "answerWindow",
    currentStatementId: statement.id,
    presentedAt: now,
    deadlineAt: now + state.windowMs,
    pendingAnswer: null,
    pendingAnswerAt: null,
    resolved: false,
    inputLocked: false,
  };
}

/**
 * Capture True/False input. Idempotent: only first input while answerWindow
 * and not yet resolved is accepted. Does not resolve by itself — call
 * tryResolve with the same clock to apply the race policy.
 */
export function captureAnswer(
  state: TrueFalseSessionState,
  answer: AnswerChoice,
  inputAt: number,
): TrueFalseSessionState {
  if (state.phase !== "answerWindow" || state.resolved) {
    return state;
  }
  if (state.pendingAnswer !== null) {
    return state;
  }
  return {
    ...state,
    pendingAnswer: answer,
    pendingAnswerAt: inputAt,
    inputLocked: true,
  };
}

/**
 * Resolution policy (documented boundary rule):
 *
 * 1. If already resolved, no-op (double-click / double-resolve safe).
 * 2. If a pending answer was captured with inputAt <= deadlineAt, answer wins.
 * 3. Else if now >= deadlineAt, expire wins.
 * 4. Else no resolution yet (still in window without answer).
 *
 * Answer and expiry both resolve at most once; first successful path locks.
 */
export function tryResolve(
  state: TrueFalseSessionState,
  now: number,
): TrueFalseSessionState {
  if (state.resolved || state.phase !== "answerWindow") {
    return state;
  }
  if (state.presentedAt === null || state.deadlineAt === null) {
    return state;
  }

  const deadline = state.deadlineAt;
  const hasAnswer =
    state.pendingAnswer !== null && state.pendingAnswerAt !== null;
  const answerInTime =
    hasAnswer && (state.pendingAnswerAt as number) <= deadline;

  if (answerInTime) {
    return applyAnswerResolve(state, state.pendingAnswer as AnswerChoice, state
      .pendingAnswerAt as number);
  }

  if (now >= deadline) {
    // Late answer after deadline loses to expiry
    return applyExpireResolve(state, Math.max(now, deadline));
  }

  // Answer pending but we haven't checked expiry; if somehow past deadline
  // without answerInTime, expire already handled. Still waiting.
  return state;
}

function applyAnswerResolve(
  state: TrueFalseSessionState,
  answer: AnswerChoice,
  resolvedAt: number,
): TrueFalseSessionState {
  const statement = currentStatement(state);
  if (!statement || typeof statement.isTrue !== "boolean") {
    return state;
  }
  const truth = statement.isTrue;
  const correct = answer === truth;
  const kind: ResolveKind = correct ? "correct" : "incorrect";
  const points = correct
    ? pointsForCorrect(state.presentedAt!, resolvedAt, state.windowMs)
    : 0;

  const streak = correct ? state.streak + 1 : 0;
  const bestStreak = Math.max(state.bestStreak, streak);

  let livesRemaining = state.livesRemaining;
  if (!correct && livesRemaining !== null) {
    livesRemaining = Math.max(0, livesRemaining - 1);
  }

  const attempt: TrueFalseAttempt = {
    attemptKey: attemptKey(
      statement.id,
      state.passIndex,
      state.attempts.length,
    ),
    statementId: statement.id,
    truth,
    playerAnswer: answer,
    kind,
    presentedAt: state.presentedAt!,
    resolvedAt,
    points,
    passIndex: state.passIndex,
  };

  return {
    ...state,
    phase: "answered",
    resolved: true,
    inputLocked: true,
    pendingAnswer: answer,
    pendingAnswerAt: resolvedAt,
    lastResolve: kind,
    lastAnswer: answer,
    lastPoints: points,
    score: state.score + points,
    correctCount: state.correctCount + (correct ? 1 : 0),
    incorrectCount: state.incorrectCount + (correct ? 0 : 1),
    streak,
    bestStreak,
    livesRemaining,
    attempts: [...state.attempts, attempt],
  };
}

function applyExpireResolve(
  state: TrueFalseSessionState,
  resolvedAt: number,
): TrueFalseSessionState {
  const statement = currentStatement(state);
  if (!statement || typeof statement.isTrue !== "boolean") {
    return state;
  }
  const truth = statement.isTrue;

  let livesRemaining = state.livesRemaining;
  if (livesRemaining !== null) {
    livesRemaining = Math.max(0, livesRemaining - 1);
  }

  const attempt: TrueFalseAttempt = {
    attemptKey: attemptKey(
      statement.id,
      state.passIndex,
      state.attempts.length,
    ),
    statementId: statement.id,
    truth,
    playerAnswer: null,
    kind: "expired",
    presentedAt: state.presentedAt!,
    resolvedAt,
    points: 0,
    passIndex: state.passIndex,
  };

  return {
    ...state,
    phase: "expired",
    resolved: true,
    inputLocked: true,
    lastResolve: "expired",
    lastAnswer: null,
    lastPoints: 0,
    unansweredCount: state.unansweredCount + 1,
    streak: 0,
    livesRemaining,
    attempts: [...state.attempts, attempt],
  };
}

/** Transition answered/expired → feedback. */
export function enterFeedback(state: TrueFalseSessionState): TrueFalseSessionState {
  if (state.phase !== "answered" && state.phase !== "expired") {
    return state;
  }
  return { ...state, phase: "feedback" };
}

/**
 * Leave feedback into itemLeaving. Game-over is decided after feedback,
 * not mid-answer transition — lives already decremented at resolve.
 */
export function leaveFeedback(state: TrueFalseSessionState): TrueFalseSessionState {
  if (state.phase !== "feedback") {
    return state;
  }
  return { ...state, phase: "itemLeaving", inputLocked: true };
}

/**
 * Advance after itemLeaving: next item, repeat pass, complete, or game over.
 *
 * Rules:
 * - Finite lives at 0 → gameOver (after feedback, not mid-transition).
 * - sessionTimeUp → completed (no new items).
 * - More items in queue → next.
 * - End of queue + first pass → mark firstPassComplete; if repeat allowed, reshuffle.
 * - End of queue without repeat → completed.
 *
 * Repeat never starts before first-pass completion.
 */
export function advanceAfterItem(
  state: TrueFalseSessionState,
  settings: TrueFalseSettings,
  rng: SeededRng,
): TrueFalseSessionState {
  if (state.phase !== "itemLeaving") {
    return state;
  }

  // Game over after feedback when last life was spent on this item
  if (state.livesRemaining !== null && state.livesRemaining <= 0) {
    return {
      ...state,
      phase: "gameOver",
      inputLocked: true,
      currentStatementId: null,
    };
  }

  if (state.sessionTimeUp) {
    return finishSession(state);
  }

  const nextIndex = state.queueIndex + 1;

  if (nextIndex < state.statements.length) {
    return {
      ...state,
      queueIndex: nextIndex,
      phase: "itemEntering",
      currentStatementId: state.statements[nextIndex]!.id,
      presentedAt: null,
      deadlineAt: null,
      pendingAnswer: null,
      pendingAnswerAt: null,
      resolved: false,
      lastResolve: null,
      lastAnswer: null,
      lastPoints: 0,
      inputLocked: true,
    };
  }

  // End of current pass
  const firstPassComplete = true;
  const canRepeat =
    settings.repeatUntilTime &&
    settings.timerMode === "countDown" &&
    firstPassComplete &&
    !state.sessionTimeUp;

  if (!canRepeat) {
    return {
      ...finishSession({
        ...state,
        firstPassComplete: true,
      }),
    };
  }

  // Reshuffle only after first full pass
  const reshuffled = rng.stream("contentOrder").shuffle([...state.statements]);
  const nextPass = state.passIndex + 1;

  return {
    ...state,
    statements: reshuffled,
    queueIndex: 0,
    passIndex: nextPass,
    firstPassComplete: true,
    phase: "itemEntering",
    currentStatementId: reshuffled[0]?.id ?? null,
    presentedAt: null,
    deadlineAt: null,
    pendingAnswer: null,
    pendingAnswerAt: null,
    resolved: false,
    lastResolve: null,
    lastAnswer: null,
    lastPoints: 0,
    inputLocked: true,
  };
}

function finishSession(state: TrueFalseSessionState): TrueFalseSessionState {
  return {
    ...state,
    phase: "completed",
    firstPassComplete: true,
    inputLocked: true,
    currentStatementId: null,
    presentedAt: null,
    deadlineAt: null,
  };
}

/** Mark global countdown exhausted; active item still resolves once. */
export function markSessionTimeUp(
  state: TrueFalseSessionState,
): TrueFalseSessionState {
  if (state.sessionTimeUp) return state;
  return { ...state, sessionTimeUp: true };
}

/** Enter review after completed/gameOver when showAnswers is enabled. */
export function enterReview(state: TrueFalseSessionState): TrueFalseSessionState {
  if (state.phase !== "completed" && state.phase !== "gameOver") {
    return state;
  }
  return { ...state, phase: "review" };
}

export function restartSession(
  content: StatementsContentV1,
  settings: TrueFalseSettings,
  rng: SeededRng,
): TrueFalseSessionState {
  return createTrueFalseSession(content, settings, rng);
}

export function accuracyOf(state: TrueFalseSessionState): number | null {
  const answered = state.correctCount + state.incorrectCount;
  if (answered === 0 && state.unansweredCount === 0) return null;
  const total =
    state.correctCount + state.incorrectCount + state.unansweredCount;
  if (total === 0) return null;
  return state.correctCount / total;
}

/**
 * Build scored result detail for lifecycle complete/gameOver.
 */
export function buildTrueFalseResult(
  state: TrueFalseSessionState,
  durationMs: number,
): {
  score: number;
  status: "completed" | "gameOver";
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracy: number | null;
  durationMs: number;
  bestStreak: number;
  templateDetail: {
    version: number;
    data: {
      attempts: TrueFalseAttempt[];
      bestStreak: number;
      passCount: number;
    };
  };
} {
  const status = state.phase === "gameOver" ? "gameOver" : "completed";
  return {
    score: state.score,
    status,
    correctCount: state.correctCount,
    incorrectCount: state.incorrectCount,
    unansweredCount: state.unansweredCount,
    accuracy: accuracyOf(state),
    durationMs,
    bestStreak: state.bestStreak,
    templateDetail: {
      version: 1,
      data: {
        attempts: [...state.attempts],
        bestStreak: state.bestStreak,
        passCount: state.passIndex + (state.firstPassComplete ? 1 : 0),
      },
    },
  };
}

/**
 * Whether repeat mode is allowed to start another pass.
 * Exposed for tests — never true before firstPassComplete.
 */
export function canStartRepeatPass(
  state: TrueFalseSessionState,
  settings: TrueFalseSettings,
): boolean {
  return (
    state.firstPassComplete &&
    settings.repeatUntilTime &&
    settings.timerMode === "countDown" &&
    !state.sessionTimeUp &&
    (state.livesRemaining === null || state.livesRemaining > 0)
  );
}
