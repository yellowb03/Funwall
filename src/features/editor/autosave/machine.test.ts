import { describe, expect, it } from "vitest";
import {
  createAutosaveState,
  hasUnsavedChanges,
  reduceAutosave,
  shouldStartSave,
} from "@/features/editor/autosave/machine";

describe("autosave state machine", () => {
  it("starts clean", () => {
    const state = createAutosaveState(0);
    expect(state.phase).toBe("clean");
    expect(hasUnsavedChanges(state)).toBe(false);
    expect(shouldStartSave(state)).toBe(false);
  });

  it("marks dirty on edit and does not save until debounce or flush", () => {
    let state = createAutosaveState(0);
    state = reduceAutosave(state, { type: "EDIT" });
    expect(state.phase).toBe("dirty");
    expect(state.dirtySeq).toBe(1);
    expect(shouldStartSave(state)).toBe(false);

    state = reduceAutosave(state, { type: "DEBOUNCE_ELAPSED" });
    expect(state.saveRequested).toBe(true);
    expect(shouldStartSave(state)).toBe(true);
  });

  it("debounces by requiring DEBOUNCE_ELAPSED after further edits", () => {
    let state = createAutosaveState(0);
    state = reduceAutosave(state, { type: "EDIT" });
    state = reduceAutosave(state, { type: "DEBOUNCE_ELAPSED" });
    expect(shouldStartSave(state)).toBe(true);

    state = reduceAutosave(state, { type: "EDIT" });
    expect(state.saveRequested).toBe(false);
    expect(shouldStartSave(state)).toBe(false);

    state = reduceAutosave(state, { type: "DEBOUNCE_ELAPSED" });
    expect(shouldStartSave(state)).toBe(true);
  });

  it("flush requests save immediately for dirty drafts", () => {
    let state = createAutosaveState(0);
    state = reduceAutosave(state, { type: "EDIT" });
    state = reduceAutosave(state, { type: "FLUSH" });
    expect(state.saveRequested).toBe(true);
    expect(shouldStartSave(state)).toBe(true);
  });

  it("completes a successful save and becomes saved", () => {
    let state = createAutosaveState(0);
    state = reduceAutosave(state, { type: "EDIT" });
    state = reduceAutosave(state, { type: "FLUSH" });
    state = reduceAutosave(state, { type: "SAVE_START", seq: 1 });
    expect(state.phase).toBe("saving");
    expect(state.inFlightSeq).toBe(1);

    state = reduceAutosave(state, {
      type: "SAVE_SUCCESS",
      seq: 1,
      revision: 1,
      updatedAt: "2026-07-14T00:00:00.000Z",
    });
    expect(state.phase).toBe("saved");
    expect(state.baseRevision).toBe(1);
    expect(state.acknowledgedSeq).toBe(1);
    expect(hasUnsavedChanges(state)).toBe(false);
  });

  it("ignores stale success when a newer edit is in progress", () => {
    let state = createAutosaveState(0);
    state = reduceAutosave(state, { type: "EDIT" }); // seq 1
    state = reduceAutosave(state, { type: "FLUSH" });
    state = reduceAutosave(state, { type: "SAVE_START", seq: 1 });
    state = reduceAutosave(state, { type: "EDIT" }); // seq 2 during flight

    state = reduceAutosave(state, {
      type: "SAVE_SUCCESS",
      seq: 1,
      revision: 1,
      updatedAt: "2026-07-14T00:00:00.000Z",
    });

    expect(state.baseRevision).toBe(1);
    expect(state.acknowledgedSeq).toBe(1);
    expect(state.phase).toBe("dirty");
    expect(state.dirtySeq).toBe(2);
    expect(state.saveRequested).toBe(true);
    expect(shouldStartSave(state)).toBe(true);
  });

  it("ignores completely stale SAVE_SUCCESS for wrong inFlightSeq", () => {
    let state = createAutosaveState(0);
    state = reduceAutosave(state, { type: "EDIT" });
    state = reduceAutosave(state, { type: "FLUSH" });
    state = reduceAutosave(state, { type: "SAVE_START", seq: 1 });
    state = reduceAutosave(state, {
      type: "SAVE_SUCCESS",
      seq: 99,
      revision: 5,
      updatedAt: "2026-07-14T00:00:00.000Z",
    });
    expect(state.phase).toBe("saving");
    expect(state.baseRevision).toBe(0);
  });

  it("enters error and can retry", () => {
    let state = createAutosaveState(0);
    state = reduceAutosave(state, { type: "EDIT" });
    state = reduceAutosave(state, { type: "FLUSH" });
    state = reduceAutosave(state, { type: "SAVE_START", seq: 1 });
    state = reduceAutosave(state, {
      type: "SAVE_ERROR",
      seq: 1,
      message: "network",
    });
    expect(state.phase).toBe("error");
    expect(state.errorMessage).toBe("network");
    expect(hasUnsavedChanges(state)).toBe(true);

    state = reduceAutosave(state, { type: "RETRY" });
    expect(state.phase).toBe("dirty");
    expect(shouldStartSave(state)).toBe(true);
  });

  it("enters conflict and preserves both paths", () => {
    let state = createAutosaveState(0);
    state = reduceAutosave(state, { type: "EDIT" });
    state = reduceAutosave(state, { type: "FLUSH" });
    state = reduceAutosave(state, { type: "SAVE_START", seq: 1 });
    state = reduceAutosave(state, {
      type: "SAVE_CONFLICT",
      seq: 1,
      serverRevision: 3,
      snapshot: { revision: 3, title: "Server" },
    });
    expect(state.phase).toBe("conflict");
    expect(state.conflict?.serverRevision).toBe(3);
    expect(shouldStartSave(state)).toBe(false);

    const keep = reduceAutosave(state, { type: "RESOLVE_KEEP_LOCAL" });
    expect(keep.phase).toBe("dirty");
    expect(keep.baseRevision).toBe(3);
    expect(shouldStartSave(keep)).toBe(true);

    const useServer = reduceAutosave(state, {
      type: "RESOLVE_USE_SERVER",
      serverRevision: 3,
    });
    expect(useServer.phase).toBe("saved");
    expect(useServer.baseRevision).toBe(3);
    expect(useServer.dirtySeq).toBe(0);
  });

  it("does not allow a second concurrent SAVE_START", () => {
    let state = createAutosaveState(0);
    state = reduceAutosave(state, { type: "EDIT" });
    state = reduceAutosave(state, { type: "FLUSH" });
    state = reduceAutosave(state, { type: "SAVE_START", seq: 1 });
    const again = reduceAutosave(state, { type: "SAVE_START", seq: 1 });
    expect(again.inFlightSeq).toBe(1);
    expect(again.phase).toBe("saving");
  });
});
