import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultReview } from "@/features/results/ResultReview";
import type { ResultContract } from "@/domain/result";

const baseResult: ResultContract = {
  sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
  templateKey: "wheel",
  templateVersion: 1,
  activityId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  activityRevision: 1,
  seed: "seed",
  status: "completed",
  score: null,
  durationMs: 1500,
  templateDetail: { version: 1 },
  completedAt: "2026-07-14T12:00:00.000Z",
};

describe("ResultReview", () => {
  it("wheel: Spin complete, no score stats, no leaderboard", () => {
    render(
      <ResultReview
        result={baseResult}
        isScored={false}
        hasLeaderboard={false}
        onPlayAgain={vi.fn()}
      />,
    );
    expect(screen.getByText("Spin complete")).toBeInTheDocument();
    expect(screen.queryByTestId("result-stats")).not.toBeInTheDocument();
    expect(screen.queryByTestId("leaderboard-form")).not.toBeInTheDocument();
  });

  it("scored: shows score/accuracy/duration and name form when hasLeaderboard", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => {});
    render(
      <ResultReview
        result={{
          ...baseResult,
          templateKey: "gameshow-quiz",
          score: 80,
          accuracy: 0.8,
          durationMs: 65000,
        }}
        isScored
        hasLeaderboard
        onSubmitLeaderboard={onSubmit}
      />,
    );

    expect(screen.getByTestId("result-score")).toHaveTextContent("80");
    expect(screen.getByTestId("result-accuracy")).toHaveTextContent("80%");
    expect(screen.getByTestId("result-duration")).toHaveTextContent("1:05");

    await user.type(screen.getByTestId("leaderboard-name-input"), "Sam");
    await user.click(screen.getByRole("button", { name: "Submit score" }));
    expect(onSubmit).toHaveBeenCalledWith("Sam");
  });
});
