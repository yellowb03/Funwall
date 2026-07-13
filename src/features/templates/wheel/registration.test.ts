import { describe, expect, it } from "vitest";
import { createWheelRegistration } from "@/features/templates/wheel/registration";
import { listContentV1PlayableSchema } from "@/domain/content/list.v1";
import { wheelFixtureSmall } from "@/features/templates/wheel/fixtures";

describe("createWheelRegistration", () => {
  it("exports frozen unscored capabilities", () => {
    const reg = createWheelRegistration();
    expect(reg.metadata.key).toBe("wheel");
    expect(reg.metadata.displayName).toBe("Spin the wheel");
    expect(reg.contentSupport).toEqual({ family: "list", version: 1 });
    expect(reg.capabilities.isScored).toBe(false);
    expect(reg.capabilities.hasLeaderboard).toBe(false);
    expect(reg.settings.version).toBe(1);
    expect(reg.settings.migrate).toBeTypeOf("function");
  });

  it("lazy-loads real editor and player adapters", async () => {
    const reg = createWheelRegistration();
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
    const reg = createWheelRegistration();
    expect(reg.playableSchema.safeParse(wheelFixtureSmall.content).success).toBe(
      true,
    );
    expect(
      listContentV1PlayableSchema.safeParse(wheelFixtureSmall.content).success,
    ).toBe(true);
  });
});
