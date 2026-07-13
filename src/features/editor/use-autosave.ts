"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUTOSAVE_DEBOUNCE_MS,
  createAutosaveState,
  hasUnsavedChanges,
  reduceAutosave,
  shouldStartSave,
  type AutosaveMachineState,
} from "@/features/editor/autosave/machine";
import {
  clearRecoveryDraft,
  writeRecoveryDraft,
  type RecoveryDraft,
} from "@/features/editor/autosave/recovery";
import type { EditorActivityPort } from "@/features/editor/persistence/port";
import type { AutosavePatch } from "@/features/editor/persistence/types";
import { EditorConflictError } from "@/features/editor/persistence/types";
import type { ContentPackV1 } from "@/domain/content";
import type { TemplateKey } from "@/domain/template-keys";

export interface UseAutosaveOptions {
  activityId: string;
  templateKey: TemplateKey;
  baseRevision: number;
  port: EditorActivityPort;
  getPatch: () => AutosavePatch & {
    title: string;
    content: ContentPackV1;
    settings: Record<string, unknown>;
    themeKey: string;
    instruction?: string;
  };
  debounceMs?: number;
}

export interface UseAutosaveResult {
  state: AutosaveMachineState;
  markDirty: () => void;
  flush: () => Promise<boolean>;
  retry: () => void;
  resolveKeepLocal: () => void;
  resolveUseServer: (serverRevision: number) => void;
  hydrate: (baseRevision: number) => void;
}

/**
 * Wires pure autosave machine to persistence port, debounce, recovery, and
 * visibility flush.
 */
export function useAutosave(options: UseAutosaveOptions): UseAutosaveResult {
  const {
    activityId,
    templateKey,
    port,
    getPatch,
    debounceMs = AUTOSAVE_DEBOUNCE_MS,
  } = options;

  const [state, setState] = useState<AutosaveMachineState>(() =>
    createAutosaveState(options.baseRevision),
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getPatchRef = useRef(getPatch);
  getPatchRef.current = getPatch;
  const portRef = useRef(port);
  portRef.current = port;
  const savingRef = useRef(false);

  const dispatch = useCallback(
    (event: Parameters<typeof reduceAutosave>[1]) => {
      setState((prev) => {
        const next = reduceAutosave(prev, event);
        stateRef.current = next;
        return next;
      });
    },
    [],
  );

  const persistRecovery = useCallback(() => {
    const patch = getPatchRef.current();
    const s = stateRef.current;
    const draft: RecoveryDraft = {
      activityId,
      templateKey,
      title: patch.title,
      instruction: patch.instruction,
      content: patch.content,
      settings: patch.settings,
      themeKey: patch.themeKey,
      dirtySeq: s.dirtySeq,
      baseRevision: s.baseRevision,
      savedAt: new Date().toISOString(),
    };
    writeRecoveryDraft(draft);
  }, [activityId, templateKey]);

  const runSave = useCallback(async () => {
    if (savingRef.current) return;
    const current = stateRef.current;
    if (!shouldStartSave(current)) return;

    const seq = current.dirtySeq;
    savingRef.current = true;
    dispatch({ type: "SAVE_START", seq });

    const patch = getPatchRef.current();
    try {
      const result = await portRef.current.autosave(
        activityId,
        current.baseRevision,
        {
          title: patch.title,
          instruction: patch.instruction ?? null,
          content: patch.content,
          settings: patch.settings,
          themeKey: patch.themeKey,
        },
      );
      dispatch({
        type: "SAVE_SUCCESS",
        seq,
        revision: result.revision,
        updatedAt: result.updatedAt,
      });
      // Clear recovery only when fully caught up.
      if (stateRef.current.dirtySeq === seq) {
        clearRecoveryDraft(activityId);
      } else {
        persistRecovery();
      }
    } catch (err) {
      if (err instanceof EditorConflictError) {
        dispatch({
          type: "SAVE_CONFLICT",
          seq,
          serverRevision: err.server.revision,
          snapshot: err.server,
        });
        persistRecovery();
      } else {
        dispatch({
          type: "SAVE_ERROR",
          seq,
          message:
            err instanceof Error ? err.message : "Save failed. Try again.",
        });
        persistRecovery();
      }
    } finally {
      savingRef.current = false;
      // Chain another save if edits landed during flight.
      queueMicrotask(() => {
        if (shouldStartSave(stateRef.current)) {
          void runSave();
        }
      });
    }
  }, [activityId, dispatch, persistRecovery]);

  const markDirty = useCallback(() => {
    dispatch({ type: "EDIT" });
    persistRecovery();
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      dispatch({ type: "DEBOUNCE_ELAPSED" });
    }, debounceMs);
  }, [debounceMs, dispatch, persistRecovery]);

  const flush = useCallback(async (): Promise<boolean> => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    // Apply FLUSH synchronously on the ref so runSave sees it immediately.
    const flushed = reduceAutosave(stateRef.current, { type: "FLUSH" });
    stateRef.current = flushed;
    setState(flushed);

    let guard = 0;
    while (
      shouldStartSave(stateRef.current) ||
      stateRef.current.inFlightSeq !== null
    ) {
      if (shouldStartSave(stateRef.current) && !savingRef.current) {
        await runSave();
      } else {
        await new Promise((r) => setTimeout(r, 20));
      }
      guard += 1;
      if (guard > 50) break;
    }
    return !hasUnsavedChanges(stateRef.current);
  }, [runSave]);

  // Start save when saveRequested flips true.
  useEffect(() => {
    if (shouldStartSave(state)) {
      void runSave();
    }
  }, [state, runSave]);

  // Flush when tab becomes hidden.
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
          debounceTimer.current = null;
        }
        dispatch({ type: "FLUSH" });
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Navigation guard (best-effort).
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (hasUnsavedChanges(stateRef.current)) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return {
    state,
    markDirty,
    flush,
    retry: () => dispatch({ type: "RETRY" }),
    resolveKeepLocal: () => dispatch({ type: "RESOLVE_KEEP_LOCAL" }),
    resolveUseServer: (serverRevision: number) =>
      dispatch({ type: "RESOLVE_USE_SERVER", serverRevision }),
    hydrate: (baseRevision: number) =>
      dispatch({ type: "HYDRATE", baseRevision }),
  };
}
