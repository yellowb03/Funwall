import { describe, expect, it } from "vitest";
import { createWordsearchRegistration } from "@/features/templates/wordsearch/registration";
import { wordsearchFixtureSmall } from "@/features/templates/wordsearch/fixtures";

describe("createWordsearchRegistration", () => {
  it("exports scored leaderboard capabilities", () => {
    const reg = createWordsearchRegistration();
    expect(reg.metadata.key).toBe("wordsearch");
    expect(reg.metadata.displayName).toBe("Wordsearch");
    expect(reg.contentSupport).toEqual({ family: "wordsearch", version: 1 });
    expect(reg.capabilities.isScored).toBe(true);
    expect(reg.capabilities.hasLeaderboard).toBe(true);
    expect(reg.settings.version).toBe(1);
    expect(reg.settings.migrate).toBeTypeOf("function");
    expect(reg.loadResultReviewAdapter).toBeTypeOf("function");
  });

  it("lazy-loads real editor and player adapters", async () => {
    const reg = createWordsearchRegistration();
    const editorMod = await reg.loadEditorAdapter();
    const playerMod = await reg.loadPlayerAdapter();
    expect(typeof editorMod.createEditorAdapter).toBe("function");
    expect(typeof playerMod.createPlayerAdapter).toBe("function");

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
    const reg = createWordsearchRegistration();
    expect(
      reg.playableSchema.safeParse(wordsearchFixtureSmall.content).success,
    ).toBe(true);
  });
});
