"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import type { WordsearchContentV1 } from "@/domain/content/wordsearch.v1";
import type { SeededRng } from "@/services/rng/seeded-rng";
import type { SemanticAudioEmitter } from "@/services/audio/semantic-audio";
import type { SessionEventEmitter } from "@/domain/session-events";
import type { PlayerLifecycleCallbacks } from "@/features/player/types";
import { Button } from "@/design-system/Button";
import { WORDSEARCH_COPY } from "@/features/templates/wordsearch/copy";
import { formatLetter } from "@/features/templates/wordsearch/normalize";
import type { GridCell } from "@/features/templates/wordsearch/generator";
import {
  applyFound,
  applyMiss,
  beginPlaying,
  buildWordsearchResultDetail,
  clearSelection,
  computeAccuracy,
  computeScore,
  createWordsearchSession,
  foundCount,
  resolveAssistedTap,
  resolveSelectionLenient,
  restartSession,
  setSelectionPreview,
  totalWordCount,
  type WordsearchSessionState,
} from "@/features/templates/wordsearch/session";
import type { WordsearchSettings } from "@/features/templates/wordsearch/settings";

export interface WordsearchPlayerProps {
  content: WordsearchContentV1;
  settings: WordsearchSettings;
  rng: SeededRng;
  audio: SemanticAudioEmitter;
  sessionEvents: SessionEventEmitter;
  lifecycle: PlayerLifecycleCallbacks;
  themeTokens?: Record<string, string>;
  reducedMotion: boolean;
  muted?: boolean;
  restartRequested?: boolean;
  onSessionChange?: (state: WordsearchSessionState) => void;
}

/** Distinct highlight hues for overlapping found words. */
const FOUND_HUES = [200, 140, 320, 40, 260, 20, 180, 300] as const;

function cellKey(c: GridCell): string {
  return `${c.row},${c.col}`;
}

function pathSet(path: readonly GridCell[] | null | undefined): Set<string> {
  const s = new Set<string>();
  if (!path) return s;
  for (const c of path) s.add(cellKey(c));
  return s;
}

export function WordsearchPlayer({
  content,
  settings,
  rng,
  audio,
  sessionEvents,
  lifecycle,
  reducedMotion,
  restartRequested = false,
  onSessionChange,
}: WordsearchPlayerProps): ReactElement {
  const [session, setSession] = useState<WordsearchSessionState>(() =>
    createWordsearchSession(content, settings, rng),
  );
  const [liveMessage, setLiveMessage] = useState("");
  const [dragging, setDragging] = useState(false);

  const sessionRef = useRef(session);
  const readyFired = useRef(false);
  const terminalFired = useRef(false);
  const elapsedStart = useRef(
    typeof performance !== "undefined" ? performance.now() : Date.now(),
  );
  const pointerIdRef = useRef<number | null>(null);

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

  // Auto-start playing once ready (shell may show start overlay separately)
  useEffect(() => {
    if (session.phase === "intro" && session.board) {
      setSession((s) => beginPlaying(s));
    }
  }, [session.phase, session.board]);

  useEffect(() => {
    if (session.phase !== "completed" || terminalFired.current) return;
    terminalFired.current = true;
    setLiveMessage(WORDSEARCH_COPY.complete);
    const detail = buildWordsearchResultDetail(session);
    const score = computeScore(session);
    const accuracy = computeAccuracy(session);
    lifecycle.onComplete({
      score,
      status: "completed",
      correctCount: detail.data.foundCount,
      incorrectCount: detail.data.incorrectAttempts,
      accuracy,
      templateDetail: detail,
    });
    sessionEvents.emit({
      type: "game.completed",
      elapsedMs: elapsedMs(),
      metadata: {
        score,
        ...detail.data,
      },
    });
    audio.emit("game.complete");
  }, [session, lifecycle, sessionEvents, elapsedMs, audio]);

  useEffect(() => {
    if (session.phase !== "gameOver" || terminalFired.current) return;
    terminalFired.current = true;
    setLiveMessage(WORDSEARCH_COPY.gameOver);
    const detail = buildWordsearchResultDetail(session);
    const score = computeScore(session);
    lifecycle.onGameOver({
      score,
      status: "gameOver",
      correctCount: detail.data.foundCount,
      incorrectCount: detail.data.incorrectAttempts,
      accuracy: computeAccuracy(session),
      templateDetail: detail,
    });
    sessionEvents.emit({
      type: "game.over",
      elapsedMs: elapsedMs(),
      metadata: { score, ...detail.data },
    });
    audio.emit("game.over");
  }, [session, lifecycle, sessionEvents, elapsedMs, audio]);

  useEffect(() => {
    if (!restartRequested) return;
    terminalFired.current = false;
    elapsedStart.current =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    setSession(restartSession(content, settings, rng));
    setLiveMessage("");
    setDragging(false);
  }, [restartRequested, content, settings, rng]);

  const foundCellMap = useMemo(() => {
    const map = new Map<string, number[]>();
    if (!session.board) return map;
    session.foundOrder.forEach((wordId, orderIdx) => {
      const rec = session.found[wordId];
      if (!rec) return;
      for (const c of rec.path) {
        const k = cellKey(c);
        const list = map.get(k) ?? [];
        list.push(orderIdx);
        map.set(k, list);
      }
    });
    return map;
  }, [session.board, session.found, session.foundOrder]);

  const previewSet = useMemo(
    () => pathSet(session.previewPath),
    [session.previewPath],
  );

  const commitSelection = useCallback(
    (start: GridCell, end: GridCell) => {
      const current = sessionRef.current;
      if (current.phase !== "playing" || current.inputLocked) return;

      const result = resolveSelectionLenient(current, start, end);

      if (result.kind === "found" && result.wordId && result.path) {
        const next = applyFound(
          current,
          result.wordId,
          result.path,
          elapsedMs(),
        );
        const display =
          next.found[result.wordId]?.displayWord ?? result.letters ?? "";
        setLiveMessage(WORDSEARCH_COPY.found(display));
        audio.emit("wordsearch.found", { intensity: 0.8 });
        sessionEvents.emit({
          type: "answer.resolved",
          elapsedMs: elapsedMs(),
          itemId: result.wordId,
          metadata: {
            correct: true,
            letters: result.letters,
          },
        });
        setSession(next);
        return;
      }

      if (result.kind === "miss") {
        audio.emit("answer.incorrect", { intensity: 0.5 });
        sessionEvents.emit({
          type: "answer.resolved",
          elapsedMs: elapsedMs(),
          metadata: { correct: false, letters: result.letters },
        });
        setSession(applyMiss(current, settings));
        return;
      }

      // incomplete / already_found / invalid — clear selection quietly
      setSession(clearSelection(current));
    },
    [audio, sessionEvents, elapsedMs, settings],
  );

  const onCellPointerDown = (row: number, col: number, e: ReactPointerEvent) => {
    if (session.phase !== "playing") return;
    e.preventDefault();
    const cell = { row, col };

    if (settings.selectionMode === "drag") {
      pointerIdRef.current = e.pointerId;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      setDragging(true);
      setSession((s) => setSelectionPreview(s, cell, cell));
      audio.emit("wordsearch.trace", { intensity: 0.2 });
      return;
    }

    // tapFirst / tapAny
    const { state: next, resolve } = resolveAssistedTap(
      session,
      settings.selectionMode,
      cell,
    );
    if (resolve) {
      if (resolve.kind === "found" || resolve.kind === "miss") {
        if (resolve.kind === "found" && resolve.wordId && resolve.path) {
          const applied = applyFound(
            session,
            resolve.wordId,
            resolve.path,
            elapsedMs(),
          );
          setLiveMessage(
            WORDSEARCH_COPY.found(
              applied.found[resolve.wordId]?.displayWord ?? "",
            ),
          );
          audio.emit("wordsearch.found", { intensity: 0.8 });
          setSession(applied);
        } else if (resolve.kind === "miss") {
          audio.emit("answer.incorrect", { intensity: 0.5 });
          setSession(applyMiss(session, settings));
        }
        return;
      }
      setSession(clearSelection(next));
      return;
    }
    setSession(next);
    audio.emit("wordsearch.trace", { intensity: 0.25 });
  };

  const onCellPointerEnter = (row: number, col: number) => {
    if (!dragging || settings.selectionMode !== "drag") return;
    const start = sessionRef.current.selectionStart;
    if (!start) return;
    setSession((s) => setSelectionPreview(s, start, { row, col }));
    audio.emit("wordsearch.trace", { intensity: 0.15 });
  };

  const endDrag = (row?: number, col?: number) => {
    if (!dragging) return;
    setDragging(false);
    pointerIdRef.current = null;
    const start = sessionRef.current.selectionStart;
    const end =
      row !== undefined && col !== undefined
        ? { row, col }
        : sessionRef.current.selectionEnd ?? start;
    if (start && end) {
      commitSelection(start, end);
    } else {
      setSession((s) => clearSelection(s));
    }
  };

  const onCellKeyDown = (
    row: number,
    col: number,
    e: KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (session.phase !== "playing") return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!session.selectionStart) {
        setSession((s) => setSelectionPreview(s, { row, col }, { row, col }));
        audio.emit("wordsearch.trace", { intensity: 0.2 });
        return;
      }
      commitSelection(session.selectionStart, { row, col });
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setSession((s) => clearSelection(s));
      return;
    }

    const dirMap: Record<string, GridCell> = {
      ArrowUp: { row: -1, col: 0 },
      ArrowDown: { row: 1, col: 0 },
      ArrowLeft: { row: 0, col: -1 },
      ArrowRight: { row: 0, col: 1 },
    };
    // Diagonal via Shift+Arrow
    if (e.shiftKey && session.selectionStart) {
      // handled with arrows as extend when selection active
    }

    if (session.selectionStart && dirMap[e.key]) {
      e.preventDefault();
      const d = dirMap[e.key]!;
      const end = session.selectionEnd ?? session.selectionStart;
      const next = { row: end.row + d.row, col: end.col + d.col };
      if (
        session.board &&
        next.row >= 0 &&
        next.col >= 0 &&
        next.row < session.board.rows &&
        next.col < session.board.cols
      ) {
        setSession((s) =>
          setSelectionPreview(s, s.selectionStart ?? { row, col }, next),
        );
      }
    }
  };

  if (session.generationError || !session.board) {
    return (
      <div
        className="flex flex-col gap-3 p-4 text-[var(--fw-color-ink)]"
        data-testid="wordsearch-player-error"
        role="alert"
      >
        <p>{session.generationError ?? "Could not build the grid."}</p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            terminalFired.current = false;
            setSession(restartSession(content, settings, rng));
          }}
        >
          {WORDSEARCH_COPY.reset}
        </Button>
      </div>
    );
  }

  const board = session.board;
  const remaining = totalWordCount(session) - foundCount(session);
  const letterCase = settings.letterCase;

  const showAnswers =
    (session.phase === "completed" || session.phase === "gameOver") &&
    settings.showAnswersAtEnd;

  return (
    <div
      className="flex flex-col gap-4 p-2 text-[var(--fw-color-ink)] sm:p-4"
      data-testid="wordsearch-player"
      data-phase={session.phase}
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium" data-testid="wordsearch-status">
          {session.phase === "completed"
            ? WORDSEARCH_COPY.complete
            : session.phase === "gameOver"
              ? WORDSEARCH_COPY.gameOver
              : WORDSEARCH_COPY.wordsLeft(remaining)}
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <span data-testid="wordsearch-score">
            {WORDSEARCH_COPY.scoreLabel}: {foundCount(session)}/
            {totalWordCount(session)}
          </span>
          {session.livesRemaining !== null && (
            <span data-testid="wordsearch-lives">
              {WORDSEARCH_COPY.livesLeft(session.livesRemaining)}
            </span>
          )}
        </div>
      </div>

      <p className="sr-only">{WORDSEARCH_COPY.startKeyboard}</p>

      <div
        className="inline-grid gap-0.5 self-center rounded-lg bg-[var(--fw-color-surface-muted,#f4f4f5)] p-1"
        style={{
          gridTemplateColumns: `repeat(${board.cols}, minmax(2rem, 2.5rem))`,
        }}
        role="grid"
        aria-label="Wordsearch letter grid"
        data-testid="wordsearch-grid"
        onPointerUp={() => endDrag()}
        onPointerCancel={() => {
          setDragging(false);
          setSession((s) => clearSelection(s));
        }}
      >
        {board.grid.map((rowLetters, row) =>
          rowLetters.map((letter, col) => {
            const k = cellKey({ row, col });
            const foundIdxs = foundCellMap.get(k);
            const isPreview = previewSet.has(k);
            const isFound = Boolean(foundIdxs && foundIdxs.length > 0);
            const hue =
              foundIdxs && foundIdxs.length > 0
                ? FOUND_HUES[foundIdxs[0]! % FOUND_HUES.length]
                : null;

            let background = "var(--fw-color-surface, #fff)";
            if (isPreview) {
              background = "color-mix(in srgb, var(--fw-color-accent, #2563eb) 35%, white)";
            } else if (isFound && hue !== null) {
              background = `hsl(${hue} 70% 88%)`;
            }

            return (
              <button
                key={k}
                type="button"
                role="gridcell"
                aria-label={`Row ${row + 1} column ${col + 1}, ${formatLetter(letter, letterCase)}`}
                aria-selected={isPreview || isFound}
                className="flex h-9 w-9 items-center justify-center rounded text-base font-bold uppercase touch-none select-none sm:h-10 sm:w-10"
                style={{
                  background,
                  transition: reducedMotion ? "none" : "background 120ms ease",
                  outline:
                    session.selectionStart?.row === row &&
                    session.selectionStart?.col === col
                      ? "2px solid var(--fw-color-accent, #2563eb)"
                      : undefined,
                }}
                data-row={row}
                data-col={col}
                data-testid={`wordsearch-cell-${row}-${col}`}
                disabled={
                  session.phase === "completed" || session.phase === "gameOver"
                }
                onPointerDown={(e) => onCellPointerDown(row, col, e)}
                onPointerEnter={() => onCellPointerEnter(row, col)}
                onPointerUp={() => endDrag(row, col)}
                onKeyDown={(e) => onCellKeyDown(row, col, e)}
              >
                {formatLetter(letter, letterCase)}
              </button>
            );
          }),
        )}
      </div>

      {settings.showWordList && (
        <div data-testid="wordsearch-word-list">
          <h3 className="mb-1 text-sm font-semibold">
            {WORDSEARCH_COPY.wordList}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {board.placements.map((p) => {
              const isFound = Boolean(session.found[p.wordId]);
              return (
                <li
                  key={p.wordId}
                  className={
                    isFound
                      ? "rounded bg-[var(--fw-color-success-soft,#dcfce7)] px-2 py-1 text-sm line-through opacity-80"
                      : "rounded bg-[var(--fw-color-surface,#fff)] px-2 py-1 text-sm ring-1 ring-[var(--fw-color-border,#d4d4d8)]"
                  }
                  data-found={isFound ? "true" : "false"}
                >
                  {p.displayWord}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {showAnswers && (
        <div
          className="flex flex-col gap-2 rounded-lg border border-[var(--fw-color-border,#d4d4d8)] p-3"
          data-testid="wordsearch-review"
        >
          <h3 className="text-sm font-semibold">{WORDSEARCH_COPY.foundList}</h3>
          <ul className="list-disc pl-5 text-sm">
            {session.foundOrder.map((id) => (
              <li key={id}>{session.found[id]?.displayWord}</li>
            ))}
          </ul>
          {board.placements.some((p) => !session.found[p.wordId]) && (
            <>
              <h3 className="text-sm font-semibold">{WORDSEARCH_COPY.missed}</h3>
              <ul className="list-disc pl-5 text-sm">
                {board.placements
                  .filter((p) => !session.found[p.wordId])
                  .map((p) => (
                    <li key={p.wordId}>{p.displayWord}</li>
                  ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="wordsearch-live"
      >
        {liveMessage}
      </div>
    </div>
  );
}
