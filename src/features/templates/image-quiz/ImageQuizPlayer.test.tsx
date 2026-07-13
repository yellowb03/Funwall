import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSeededRng } from "@/services/rng/seeded-rng";
import { createNoopAudioEmitter } from "@/services/audio/semantic-audio";
import type { SessionEventEmitter } from "@/domain/session-events";
import { ImageQuizPlayer } from "@/features/templates/image-quiz/player/ImageQuizPlayer";
import { defaultImageQuizSettings } from "@/features/templates/image-quiz/settings";
import { imageQuizFixtureSmall } from "@/features/templates/image-quiz/fixtures";
import { buildImageQuizContent } from "@/test/fixtures/builders";

function createEvents(): SessionEventEmitter & {
  events: Array<{ type: string; metadata?: Record<string, unknown> }>;
} {
  const events: Array<{ type: string; metadata?: Record<string, unknown> }> =
    [];
  return {
    events,
    emit(event) {
      events.push({ type: event.type, metadata: event.metadata });
    },
  };
}

function renderPlayer(options?: {
  reducedMotion?: boolean;
  seed?: string;
  lives?: number | null;
  autoProceed?: boolean;
  layout?: "together" | "separate";
  content?: ReturnType<typeof buildImageQuizContent>;
  revealDurationSeconds?: number;
}) {
  const audio = createNoopAudioEmitter({ record: true });
  const sessionEvents = createEvents();
  const lifecycle = {
    onReady: vi.fn(),
    onPauseSafeState: vi.fn(),
    onComplete: vi.fn(),
    onGameOver: vi.fn(),
    onFatalError: vi.fn(),
  };

  const content = options?.content ?? imageQuizFixtureSmall.content;
  const settings = {
    ...defaultImageQuizSettings(),
    lives: options?.lives ?? null,
    autoProceed: options?.autoProceed ?? false,
    layout: options?.layout ?? "separate",
    revealDurationSeconds: options?.revealDurationSeconds ?? 5,
    showAnswers: false,
  };

  const view = render(
    <ImageQuizPlayer
      content={content}
      settings={settings}
      rng={createSeededRng(options?.seed ?? "fw-image-quiz-small-001")}
      audio={audio}
      sessionEvents={sessionEvents}
      lifecycle={lifecycle}
      reducedMotion={options?.reducedMotion ?? true}
      simulateImageLoad
    />,
  );

  return { ...view, audio, sessionEvents, lifecycle };
}

describe("ImageQuizPlayer", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("calls onReady and shows intro", () => {
    const { lifecycle } = renderPlayer();
    expect(lifecycle.onReady).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("image-quiz-start")).toBeInTheDocument();
  });

  it("loads image then reveals with buzzer", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    renderPlayer({ reducedMotion: true });

    await user.click(screen.getByTestId("image-quiz-start"));

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(await screen.findByTestId("image-quiz-buzzer")).toBeInTheDocument();
    expect(screen.getByTestId("image-quiz-reveal-stage")).toBeInTheDocument();
  });

  it("buzzer locks once and opens answers", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    const { audio, sessionEvents } = renderPlayer({ reducedMotion: true });

    await user.click(screen.getByTestId("image-quiz-start"));
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    const buzzer = await screen.findByTestId("image-quiz-buzzer");
    await user.click(buzzer);
    await user.click(buzzer);
    await user.click(buzzer);

    const buzzes = sessionEvents.events.filter((e) => e.type === "imageQuiz.buzz");
    expect(buzzes.length).toBe(1);
    expect(audio.events.some((e) => e.event === "imageQuiz.buzzer")).toBe(true);
    expect(await screen.findByTestId("image-quiz-answers")).toBeInTheDocument();
  });

  it("Space key buzzes without requiring button click", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    const { sessionEvents } = renderPlayer({ reducedMotion: true });

    await user.click(screen.getByTestId("image-quiz-start"));
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    await screen.findByTestId("image-quiz-buzzer");

    await user.keyboard(" ");

    expect(
      sessionEvents.events.some((e) => e.type === "imageQuiz.buzz"),
    ).toBe(true);
  });

  it("correct answer awards score and emits audio", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    const { audio } = renderPlayer({
      reducedMotion: true,
      content: buildImageQuizContent(),
      autoProceed: false,
    });

    await user.click(screen.getByTestId("image-quiz-start"));
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    await user.click(await screen.findByTestId("image-quiz-buzzer"));

    const correctId = buildImageQuizContent().questions[0]!.correctAnswerId!;
    await user.click(screen.getByTestId(`image-quiz-answer-${correctId}`));

    expect(await screen.findByTestId("image-quiz-feedback")).toBeInTheDocument();
    expect(audio.events.some((e) => e.event === "answer.correct")).toBe(true);
    const scoreText = screen.getByTestId("image-quiz-score").textContent ?? "";
    expect(scoreText).toMatch(/[1-9]/);
  });

  it("broken image path reports fatal error", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    const broken = buildImageQuizContent({
      questions: [
        {
          id: "55555555-5555-4555-8555-555555555551",
          prompt: { text: "Broken?" },
          revealImageAssetId: "dddddddd-dddd-4ddd-8ddd-00000000dead",
          revealImageAlt: "Broken",
          answers: [
            {
              id: "55555555-5555-4555-8555-5555555555a1",
              content: { text: "A" },
            },
            {
              id: "55555555-5555-4555-8555-5555555555a2",
              content: { text: "B" },
            },
          ],
          correctAnswerId: "55555555-5555-4555-8555-5555555555a1",
        },
      ],
    });
    const { lifecycle } = renderPlayer({ content: broken });

    await user.click(screen.getByTestId("image-quiz-start"));
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(lifecycle.onFatalError).toHaveBeenCalled();
  });

  it("together layout still shows buzzer flow", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    renderPlayer({ layout: "together", reducedMotion: true });

    await user.click(screen.getByTestId("image-quiz-start"));
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(await screen.findByTestId("image-quiz-buzzer")).toBeInTheDocument();
    expect(
      document.querySelector("[data-template-player='image-quiz']"),
    ).toHaveAttribute("data-layout", "together");
  });
});
