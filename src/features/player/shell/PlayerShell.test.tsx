import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerShell } from "@/features/player/shell/PlayerShell";
import { createMemoryPublicPlayPort } from "@/features/player/session/memory-public-play-port";
import {
  buildScoredQuizSnapshot,
  buildWheelSnapshot,
} from "@/features/player/fixtures";
import { createFakePlayerAdapter } from "@/features/player/harness/fake-adapter";
import { PlayerHud } from "@/features/player/shell/Hud";

describe("PlayerShell", () => {
  it("smoke: loads wheel snapshot, shows start overlay, no score in HUD", async () => {
    const snapshot = buildWheelSnapshot();
    const port = createMemoryPublicPlayPort({
      snapshots: { [snapshot.publicSlug]: snapshot },
    });
    const adapter = createFakePlayerAdapter({ autoReady: true });

    render(
      <PlayerShell
        snapshot={snapshot}
        port={port}
        loadAdapter={async () => ({
          createPlayerAdapter: () => adapter,
        })}
        reducedMotion
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("start-overlay")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: snapshot.title })).toBeInTheDocument();
    expect(screen.getByTestId("player-shell")).toHaveAttribute(
      "data-scored",
      "false",
    );
    expect(screen.getByTestId("player-shell")).toHaveAttribute(
      "data-leaderboard",
      "false",
    );
    expect(screen.queryByTestId("hud-score")).not.toBeInTheDocument();
  });

  it("Play starts a session with a stored seed and enters playing", async () => {
    const user = userEvent.setup();
    const snapshot = buildWheelSnapshot();
    const port = createMemoryPublicPlayPort({
      snapshots: { [snapshot.publicSlug]: snapshot },
    });
    const adapter = createFakePlayerAdapter({ autoReady: true });

    render(
      <PlayerShell
        snapshot={snapshot}
        port={port}
        loadAdapter={async () => ({
          createPlayerAdapter: () => adapter,
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("play-button")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("play-button"));

    await waitFor(() => {
      expect(screen.getByTestId("player-shell")).toHaveAttribute(
        "data-phase",
        "playing",
      );
    });

    const ctx = adapter.getContext();
    expect(ctx?.rng.seed).toBeTruthy();
    expect(ctx?.snapshot.isScored).toBe(false);
  });

  it("unscored complete shows Spin complete review without leaderboard form", async () => {
    const user = userEvent.setup();
    const snapshot = buildWheelSnapshot();
    const port = createMemoryPublicPlayPort({
      snapshots: { [snapshot.publicSlug]: snapshot },
    });
    const adapter = createFakePlayerAdapter({
      autoReady: true,
      autoAction: "unscoredComplete",
    });

    render(
      <PlayerShell
        snapshot={snapshot}
        port={port}
        loadAdapter={async () => ({
          createPlayerAdapter: () => adapter,
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("play-button")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("play-button"));

    await waitFor(() => {
      expect(screen.getByTestId("result-review")).toBeInTheDocument();
    });

    expect(screen.getByText("Spin complete")).toBeInTheDocument();
    expect(screen.queryByTestId("leaderboard-form")).not.toBeInTheDocument();
    expect(screen.queryByTestId("result-stats")).not.toBeInTheDocument();
    expect(screen.getByTestId("play-again")).toBeInTheDocument();
  });

  it("scored template can show score stats and leaderboard entry", async () => {
    const user = userEvent.setup();
    const snapshot = buildScoredQuizSnapshot();
    const port = createMemoryPublicPlayPort({
      snapshots: { [snapshot.publicSlug]: snapshot },
    });
    const adapter = createFakePlayerAdapter({
      autoReady: true,
      autoAction: "complete",
    });

    render(
      <PlayerShell
        snapshot={snapshot}
        port={port}
        loadAdapter={async () => ({
          createPlayerAdapter: () => adapter,
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("play-button")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("play-button"));

    await waitFor(() => {
      expect(screen.getByTestId("result-review")).toBeInTheDocument();
    });

    expect(screen.getByTestId("result-score")).toHaveTextContent("100");
    expect(screen.getByTestId("leaderboard-form")).toBeInTheDocument();
  });
});

describe("PlayerHud capabilities", () => {
  it("hides score when isScored is false (Wheel)", () => {
    render(
      <PlayerHud
        isScored={false}
        score={999}
        muted={false}
        volume={0.72}
        onMuteToggle={vi.fn()}
        onVolumeChange={vi.fn()}
        onFullscreen={vi.fn()}
        onRestart={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("hud-score")).not.toBeInTheDocument();
  });

  it("shows score when isScored is true", () => {
    render(
      <PlayerHud
        isScored
        score={42}
        muted={false}
        volume={0.72}
        onMuteToggle={vi.fn()}
        onVolumeChange={vi.fn()}
        onFullscreen={vi.fn()}
        onRestart={vi.fn()}
      />,
    );
    expect(screen.getByTestId("hud-score")).toHaveTextContent("Score: 42");
  });

  it("renders volume slider and reflects mute as zero", () => {
    render(
      <PlayerHud
        isScored={false}
        muted
        volume={0.5}
        onMuteToggle={vi.fn()}
        onVolumeChange={vi.fn()}
        onFullscreen={vi.fn()}
        onRestart={vi.fn()}
      />,
    );
    const slider = screen.getByTestId("hud-volume") as HTMLInputElement;
    expect(slider).toBeDisabled();
    expect(slider.value).toBe("0");
  });
});
