import { describe, expect, it } from "vitest";
import { createTrueFalseRegistration } from "@/features/templates/true-false/registration";
import { statementsContentV1PlayableSchema } from "@/domain/content/statements.v1";
import { trueFalseFixtureSmall } from "@/features/templates/true-false/fixtures";

describe("createTrueFalseRegistration", () => {
  it("exports scored leaderboard capabilities", () => {
    const reg = createTrueFalseRegistration();
    expect(reg.metadata.key).toBe("true-false");
    expect(reg.metadata.displayName).toBe("True or false");
    expect(reg.contentSupport).toEqual({ family: "statements", version: 1 });
    expect(reg.capabilities.isScored).toBe(true);
    expect(reg.capabilities.hasLeaderboard).toBe(true);
    expect(reg.settings.version).toBe(1);
    expect(reg.settings.migrate).toBeTypeOf("function");
    expect(reg.loadResultReviewAdapter).toBeTypeOf("function");
  });

  it("lazy-loads editor, player, and result-review adapters", async () => {
    const reg = createTrueFalseRegistration();
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
    };
    expect(typeof player.mount).toBe("function");
    expect(typeof player.unmount).toBe("function");
  });

  it("playable schema accepts small fixture", () => {
    const reg = createTrueFalseRegistration();
    expect(
      reg.playableSchema.safeParse(trueFalseFixtureSmall.content).success,
    ).toBe(true);
    expect(
      statementsContentV1PlayableSchema.safeParse(
        trueFalseFixtureSmall.content,
      ).success,
    ).toBe(true);
  });
});
