import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { createSeededRng } from "@/services/rng/seeded-rng";
import { createNoopAudioEmitter } from "@/services/audio/semantic-audio";
import type { SessionEventEmitter } from "@/domain/session-events";
import { WordsearchPlayer } from "@/features/templates/wordsearch/player/WordsearchPlayer";
import { defaultWordsearchSettings } from "@/features/templates/wordsearch/settings";
import { wordsearchFixtureMin } from "@/features/templates/wordsearch/fixtures";
import { createWordsearchSession, beginPlaying } from "@/features/templates/wordsearch/session";

function createEvents(): SessionEventEmitter & {
  events: Array<{ type: string }>;
} {
  const events: Array<{ type: string }> = [];
  return {
    events,
    emit(event) {
      events.push({ type: event.type });
    },
  };
}

function renderPlayer(options?: { seed?: string; lives?: number | null }) {
  const audio = createNoopAudioEmitter({ record: true });
  const sessionEvents = createEvents();
  const lifecycle = {
    onReady: vi.fn(),
    onPauseSafeState: vi.fn(),
    onComplete: vi.fn(),
    onGameOver: vi.fn(),
    onFatalError: vi.fn(),
  };

  const content = wordsearchFixtureMin.content;
  const settings = {
    ...defaultWordsearchSettings(),
    lives: options?.lives ?? null,
    showWordList: true,
  };
  const seed = options?.seed ?? "fw-wordsearch-min-001";

  const view = render(
    <WordsearchPlayer
      content={content}
      settings={settings}
      rng={createSeededRng(seed)}
      audio={audio}
      sessionEvents={sessionEvents}
      lifecycle={lifecycle}
      reducedMotion
    />,
  );

  return { ...view, audio, sessionEvents, lifecycle, seed, settings, content };
}

describe("WordsearchPlayer", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a semantic grid", () => {
    renderPlayer();
    expect(screen.getByTestId("wordsearch-grid")).toBeInTheDocument();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getAllByRole("gridcell").length).toBeGreaterThan(4);
  });

  it("calls onReady on mount", () => {
    const { lifecycle } = renderPlayer();
    expect(lifecycle.onReady).toHaveBeenCalledTimes(1);
  });

  it("shows word list when enabled", () => {
    renderPlayer();
    expect(screen.getByTestId("wordsearch-word-list")).toBeInTheDocument();
    expect(screen.getByText("CAT")).toBeInTheDocument();
    expect(screen.getByText("DOG")).toBeInTheDocument();
  });

  it("selecting a solution path marks the word found", () => {
    const { audio, seed, settings, content, lifecycle } = renderPlayer();
    // Rebuild session with same seed to know path coordinates
    const session = beginPlaying(
      createWordsearchSession(content, settings, createSeededRng(seed)),
    );
    expect(session.board).not.toBeNull();
    const placement = session.board!.placements[0]!;
    const start = placement.path[0]!;
    const end = placement.path[placement.path.length - 1]!;

    const startBtn = screen.getByTestId(
      `wordsearch-cell-${start.row}-${start.col}`,
    );
    const endBtn = screen.getByTestId(`wordsearch-cell-${end.row}-${end.col}`);

    fireEvent.pointerDown(startBtn, { pointerId: 1, button: 0 });
    // walk intermediate cells
    for (const cell of placement.path) {
      const btn = screen.getByTestId(
        `wordsearch-cell-${cell.row}-${cell.col}`,
      );
      fireEvent.pointerEnter(btn);
    }
    fireEvent.pointerUp(endBtn, { pointerId: 1, button: 0 });

    expect(audio.events.some((e) => e.event === "wordsearch.found")).toBe(true);
    expect(screen.getByTestId("wordsearch-live").textContent).toMatch(/Found:/i);
    expect(screen.getByTestId("wordsearch-score").textContent).toMatch(/1\/2/);

    // find second word to complete
    const session2 = beginPlaying(
      createWordsearchSession(content, settings, createSeededRng(seed)),
    );
    const second = session2.board!.placements.find(
      (p) => p.wordId !== placement.wordId,
    )!;
    const s2 = second.path[0]!;
    const e2 = second.path[second.path.length - 1]!;
    fireEvent.pointerDown(
      screen.getByTestId(`wordsearch-cell-${s2.row}-${s2.col}`),
      { pointerId: 2 },
    );
    for (const cell of second.path) {
      fireEvent.pointerEnter(
        screen.getByTestId(`wordsearch-cell-${cell.row}-${cell.col}`),
      );
    }
    fireEvent.pointerUp(
      screen.getByTestId(`wordsearch-cell-${e2.row}-${e2.col}`),
      { pointerId: 2 },
    );

    expect(lifecycle.onComplete).toHaveBeenCalled();
    expect(screen.getByTestId("wordsearch-live").textContent).toMatch(
      /every word/i,
    );
  });

  it("exposes aria-live region for found words", () => {
    renderPlayer();
    const live = screen.getByTestId("wordsearch-live");
    expect(live).toHaveAttribute("aria-live", "polite");
  });
});
