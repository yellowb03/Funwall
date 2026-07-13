import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSeededRng } from "@/services/rng/seeded-rng";
import { createNoopAudioEmitter } from "@/services/audio/semantic-audio";
import type { SessionEventEmitter } from "@/domain/session-events";
import { WheelPlayer } from "@/features/templates/wheel/player/WheelPlayer";
import { defaultWheelSettings } from "@/features/templates/wheel/settings";
import { wheelFixtureSmall } from "@/features/templates/wheel/fixtures";
import { buildListContent } from "@/test/fixtures/builders";

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

function renderPlayer(options?: {
  reducedMotion?: boolean;
  seed?: string;
  allowEliminate?: boolean;
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

  const content = wheelFixtureSmall.content;
  const settings = {
    ...defaultWheelSettings(),
    allowEliminate: options?.allowEliminate ?? true,
    spinPower: "low" as const,
  };

  const view = render(
    <WheelPlayer
      content={content}
      settings={settings}
      rng={createSeededRng(options?.seed ?? "fw-wheel-small-001")}
      audio={audio}
      sessionEvents={sessionEvents}
      lifecycle={lifecycle}
      reducedMotion={options?.reducedMotion ?? true}
    />,
  );

  return { ...view, audio, sessionEvents, lifecycle };
}

describe("WheelPlayer", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders a Spin button", () => {
    renderPlayer();
    expect(screen.getByTestId("wheel-spin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /spin/i })).toBeEnabled();
  });

  it("calls onReady on mount", () => {
    const { lifecycle } = renderPlayer();
    expect(lifecycle.onReady).toHaveBeenCalledTimes(1);
  });

  it("reduced-motion path selects and announces without multi-turn requirement", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    const { audio } = renderPlayer({ reducedMotion: true });

    await user.click(screen.getByTestId("wheel-spin"));

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(await screen.findByTestId("wheel-result")).toBeInTheDocument();
    expect(screen.getByTestId("wheel-result-text")).toBeTruthy();
    expect(audio.events.some((e) => e.event === "wheel.selected")).toBe(true);
    expect(screen.getByTestId("wheel-live").textContent).toMatch(/Selected:/i);
  });

  it("locks rapid repeated spins to a single in-flight spin", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    const { sessionEvents } = renderPlayer({ reducedMotion: true });

    const btn = screen.getByTestId("wheel-spin");
    await user.click(btn);
    await user.click(btn);
    await user.click(btn);

    const spins = sessionEvents.events.filter((e) => e.type === "wheel.spin");
    expect(spins.length).toBe(1);
  });

  it("has no score or leaderboard UI", () => {
    renderPlayer();
    expect(screen.queryByText(/leaderboard/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
  });

  it("shows no-leaderboard note on result", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    renderPlayer({ reducedMotion: true });
    await user.click(screen.getByTestId("wheel-spin"));
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(
      await screen.findByText(/no score or leaderboard/i),
    ).toBeInTheDocument();
  });
});

describe("WheelPlayer eliminate", () => {
  afterEach(() => {
    cleanup();
  });

  it("eliminate rebuilds remaining segments without touching content pack", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    const content = buildListContent();
    const snapshot = structuredClone(content);
    const audio = createNoopAudioEmitter({ record: true });
    const sessionEvents = createEvents();
    const lifecycle = {
      onReady: vi.fn(),
      onPauseSafeState: vi.fn(),
      onComplete: vi.fn(),
      onGameOver: vi.fn(),
      onFatalError: vi.fn(),
    };

    render(
      <WheelPlayer
        content={content}
        settings={{ ...defaultWheelSettings(), spinPower: "low" }}
        rng={createSeededRng("elim-ui-seed")}
        audio={audio}
        sessionEvents={sessionEvents}
        lifecycle={lifecycle}
        reducedMotion
      />,
    );

    await user.click(screen.getByTestId("wheel-spin"));
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    await screen.findByTestId("wheel-result");
    await user.click(screen.getByRole("button", { name: /eliminate/i }));

    expect(content).toEqual(snapshot);
    // Back to idle/spin for remaining items
    expect(screen.getByTestId("wheel-spin")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
