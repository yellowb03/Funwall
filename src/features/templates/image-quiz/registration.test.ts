import { describe, expect, it } from "vitest";
import { createImageQuizRegistration } from "@/features/templates/image-quiz/registration";
import { imageQuizContentV1PlayableSchema } from "@/domain/content/imageQuiz.v1";
import { imageQuizFixtureSmall } from "@/features/templates/image-quiz/fixtures";

describe("createImageQuizRegistration", () => {
  it("exports scored leaderboard capabilities", () => {
    const reg = createImageQuizRegistration();
    expect(reg.metadata.key).toBe("image-quiz");
    expect(reg.metadata.displayName).toBe("Image quiz");
    expect(reg.contentSupport).toEqual({ family: "imageQuiz", version: 1 });
    expect(reg.capabilities.isScored).toBe(true);
    expect(reg.capabilities.hasLeaderboard).toBe(true);
    expect(reg.settings.version).toBe(1);
    expect(reg.settings.migrate).toBeTypeOf("function");
    expect(reg.loadResultReviewAdapter).toBeTypeOf("function");
  });

  it("lazy-loads editor, player, and review adapters", async () => {
    const reg = createImageQuizRegistration();
    const editorMod = await reg.loadEditorAdapter();
    const playerMod = await reg.loadPlayerAdapter();
    const reviewMod = await reg.loadResultReviewAdapter!();
    expect(typeof editorMod.createEditorAdapter).toBe("function");
    expect(typeof playerMod.createPlayerAdapter).toBe("function");
    expect(typeof reviewMod.createResultReviewAdapter).toBe("function");

    const editor = editorMod.createEditorAdapter() as {
      render: (ctx: unknown) => unknown;
    };
    expect(typeof editor.render).toBe("function");

    const player = playerMod.createPlayerAdapter() as {
      mount: (ctx: unknown) => unknown;
      unmount: () => void;
      pause: () => void;
      resume: () => void;
    };
    expect(typeof player.mount).toBe("function");
    expect(typeof player.unmount).toBe("function");
  });

  it("playable schema accepts small fixture", () => {
    const reg = createImageQuizRegistration();
    expect(
      reg.playableSchema.safeParse(imageQuizFixtureSmall.content).success,
    ).toBe(true);
    expect(
      imageQuizContentV1PlayableSchema.safeParse(imageQuizFixtureSmall.content)
        .success,
    ).toBe(true);
  });
});
