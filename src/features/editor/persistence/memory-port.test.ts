import { describe, expect, it, beforeEach } from "vitest";
import { MemoryEditorPort } from "@/features/editor/persistence/memory-port";
import {
  EditorConflictError,
  EditorValidationError,
} from "@/features/editor/persistence/types";
import { buildListContent } from "@/test/fixtures";

describe("MemoryEditorPort", () => {
  let port: MemoryEditorPort;

  beforeEach(() => {
    port = new MemoryEditorPort(new Map());
  });

  it("creates a draft at revision 0", async () => {
    const activity = await port.createDraft({
      templateKey: "wheel",
      content: { family: "list", version: 1, items: [] },
    });
    expect(activity.revision).toBe(0);
    expect(activity.status).toBe("draft");
    expect(activity.templateKey).toBe("wheel");
  });

  it("autosaves with compare-and-swap", async () => {
    const activity = await port.createDraft({
      templateKey: "wheel",
      title: "A",
      content: { family: "list", version: 1, items: [] },
    });
    const result = await port.autosave(activity.id, 0, { title: "B" });
    expect(result.revision).toBe(1);
    const loaded = await port.get(activity.id);
    expect(loaded.title).toBe("B");
    expect(loaded.revision).toBe(1);
  });

  it("rejects stale baseRevision with conflict", async () => {
    const activity = await port.createDraft({
      templateKey: "wheel",
      content: { family: "list", version: 1, items: [] },
    });
    await port.autosave(activity.id, 0, { title: "one" });
    await expect(
      port.autosave(activity.id, 0, { title: "stale" }),
    ).rejects.toBeInstanceOf(EditorConflictError);
  });

  it("finalize requires title and playable content", async () => {
    const activity = await port.createDraft({
      templateKey: "wheel",
      content: { family: "list", version: 1, items: [] },
    });
    await expect(port.finalize(activity.id, 0)).rejects.toBeInstanceOf(
      EditorValidationError,
    );

    await port.autosave(activity.id, 0, {
      title: "Classroom wheel",
      content: buildListContent(),
    });
    const done = await port.finalize(activity.id, 1);
    expect(done.publicSlug).toMatch(/^p_/);
    const loaded = await port.get(activity.id);
    expect(loaded.status).toBe("finalized");
  });
});
