import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSeededRng } from "@/services/rng/seeded-rng";
import { createNoopAudioEmitter } from "@/services/audio/semantic-audio";
import type { SessionEventEmitter } from "@/domain/session-events";
import type { Clock } from "@/services/timer/clock";
import { TrueFalsePlayer } from "@/features/templates/true-false/player/TrueFalsePlayer";
import {
  defaultTrueFalseSettings,
  type TrueFalseSettings,
} from "@/features/templates/true-false/settings";
import { trueFalseFixtureMin } from "@/features/templates/true-false/fixtures";

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

function createFakeClock(start = 0): Clock & { advance: (ms: number) => void; t: number } {
  let t = start;
  return {
    get t() {
      return t;
    },
    now() {
      return t;
    },
    advance(ms: number) {
      t += ms;
    },
  };
}

function renderPlayer(options?: {
  reducedMotion?: boolean;
  settings?: Partial<TrueFalseSettings>;
  clock?: Clock & { advance: (ms: number) => void };
  seed?: string;
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
  const clock = options?.clock ?? createFakeClock(0);
  const settings = {
    ...defaultTrueFalseSettings(),
    speed: 10, // short window for tests
    ...options?.settings,
  };

  const view = render(
    <TrueFalsePlayer
      content={trueFalseFixtureMin.content}
      settings={settings}
      rng={createSeededRng(options?.seed ?? "fw-true-false-min-001")}
      audio={audio}
      sessionEvents={sessionEvents}
      lifecycle={lifecycle}
      reducedMotion={options?.reducedMotion ?? true}
      clock={clock}
    />,
  );

  return { ...view, audio, sessionEvents, lifecycle, clock, settings };
}

describe("TrueFalsePlayer", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders intro and calls onReady", () => {
    const { lifecycle } = renderPlayer();
    expect(screen.getByTestId("tf-intro")).toBeInTheDocument();
    expect(lifecycle.onReady).toHaveBeenCalledTimes(1);
  });

  it("double-click resolves once", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const clock = createFakeClock(0);
    const { sessionEvents } = renderPlayer({ clock, reducedMotion: true });

    await user.click(screen.getByTestId("tf-start"));
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    const trueBtn = await screen.findByTestId("tf-answer-true");
    expect(trueBtn).toBeEnabled();

    await user.click(trueBtn);
    await user.click(trueBtn);
    await user.click(screen.getByTestId("tf-answer-false"));

    const resolved = sessionEvents.events.filter(
      (e) => e.type === "answer.resolved",
    );
    expect(resolved.length).toBe(1);
  });

  it("expiry boundary with fake clock", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const clock = createFakeClock(0);
    // speed 10 → window 1200ms
    const { sessionEvents, audio } = renderPlayer({
      clock,
      reducedMotion: true,
      settings: { speed: 10 },
    });

    await user.click(screen.getByTestId("tf-start"));
    await act(async () => {
      vi.advanceTimersByTime(20);
    });
    expect(await screen.findByTestId("tf-answer-true")).toBeEnabled();

    // Advance fake clock past deadline and flush poll interval
    await act(async () => {
      clock.advance(1300);
      vi.advanceTimersByTime(100);
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const resolved = sessionEvents.events.filter(
      (e) => e.type === "answer.resolved",
    );
    expect(resolved.length).toBeGreaterThanOrEqual(1);
    expect(resolved[0]?.metadata?.kind).toBe("expired");
    expect(
      audio.events.some((e) => e.event === "trueFalse.resolve"),
    ).toBe(true);
  });

  it("reduced-motion shows stationary progress bar", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const clock = createFakeClock(0);
    renderPlayer({ clock, reducedMotion: true });

    await user.click(screen.getByTestId("tf-start"));
    await act(async () => {
      vi.advanceTimersByTime(30);
    });

    expect(await screen.findByTestId("tf-window-progress")).toBeInTheDocument();
    expect(screen.getByTestId("true-false-player")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
  });

  it("emits trueFalse.enter on item present", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const clock = createFakeClock(0);
    const { audio } = renderPlayer({ clock, reducedMotion: true });

    await user.click(screen.getByTestId("tf-start"));
    await act(async () => {
      vi.advanceTimersByTime(30);
    });

    expect(audio.events.some((e) => e.event === "trueFalse.enter")).toBe(true);
  });
});
