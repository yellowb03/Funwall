import type { EditorActivityPort } from "@/features/editor/persistence/port";
import type {
  AutosavePatch,
  AutosaveSuccess,
  CreateDraftInput,
  EditorActivity,
  FinalizeSuccess,
} from "@/features/editor/persistence/types";
import {
  EditorConflictError,
  EditorNotFoundError,
  EditorValidationError,
} from "@/features/editor/persistence/types";
import { parsePlayableContentPack } from "@/domain/content";

const STORE_KEY = "__funwall_editor_activity_store__";

type Store = Map<string, EditorActivity>;

function getStore(): Store {
  const g = globalThis as typeof globalThis & {
    [STORE_KEY]?: Store;
  };
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = new Map();
  }
  return g[STORE_KEY]!;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function publicSlugFromId(id: string): string {
  // Unguessable-enough for local mode; real service will mint securely.
  return `p_${id.replace(/-/g, "").slice(0, 16)}`;
}

function cloneActivity(activity: EditorActivity): EditorActivity {
  return {
    ...activity,
    content: structuredClone(activity.content),
    settings: structuredClone(activity.settings),
  };
}

/**
 * In-memory activity store for standalone editor UX.
 * Survives HMR within the same process via globalThis.
 * Not durable across full restarts — 01 wires real persistence.
 */
export class MemoryEditorPort implements EditorActivityPort {
  private readonly store: Store;

  constructor(store: Store = getStore()) {
    this.store = store;
  }

  async createDraft(input: CreateDraftInput): Promise<EditorActivity> {
    const timestamp = nowIso();
    const activity: EditorActivity = {
      id: newId(),
      publicSlug: null,
      title: input.title?.trim() ?? "",
      instruction: input.instruction?.trim() || undefined,
      templateKey: input.templateKey,
      content: structuredClone(input.content),
      settings: structuredClone(input.settings ?? {}),
      themeKey: input.themeKey ?? "default",
      revision: 0,
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.store.set(activity.id, activity);
    return cloneActivity(activity);
  }

  async get(id: string): Promise<EditorActivity> {
    const found = this.store.get(id);
    if (!found) {
      throw new EditorNotFoundError(id);
    }
    return cloneActivity(found);
  }

  async autosave(
    id: string,
    baseRevision: number,
    patch: AutosavePatch,
  ): Promise<AutosaveSuccess> {
    const current = this.store.get(id);
    if (!current) {
      throw new EditorNotFoundError(id);
    }
    if (current.revision !== baseRevision) {
      throw new EditorConflictError(cloneActivity(current));
    }

    const next: EditorActivity = {
      ...current,
      title:
        patch.title !== undefined ? patch.title.trim() : current.title,
      instruction:
        patch.instruction === null
          ? undefined
          : patch.instruction !== undefined
            ? patch.instruction.trim() || undefined
            : current.instruction,
      content:
        patch.content !== undefined
          ? structuredClone(patch.content)
          : current.content,
      settings:
        patch.settings !== undefined
          ? structuredClone(patch.settings)
          : current.settings,
      themeKey: patch.themeKey ?? current.themeKey,
      revision: current.revision + 1,
      updatedAt: nowIso(),
    };

    this.store.set(id, next);
    return { revision: next.revision, updatedAt: next.updatedAt };
  }

  async finalize(
    id: string,
    baseRevision: number,
  ): Promise<FinalizeSuccess> {
    const current = this.store.get(id);
    if (!current) {
      throw new EditorNotFoundError(id);
    }
    if (current.revision !== baseRevision) {
      throw new EditorConflictError(cloneActivity(current));
    }

    if (!current.title.trim()) {
      throw new EditorValidationError("Add an activity title.", [
        { path: ["title"], message: "Add an activity title." },
      ]);
    }

    const playable = parsePlayableContentPack(current.content);
    if (!playable.success) {
      const issues =
        "error" in playable &&
        playable.error &&
        typeof playable.error === "object" &&
        "issues" in playable.error
          ? (
              playable.error as {
                issues: Array<{ path: PropertyKey[]; message: string }>;
              }
            ).issues.map((issue) => ({
              path: issue.path.map((p) =>
                typeof p === "symbol" ? String(p) : p,
              ) as Array<string | number>,
              message: issue.message,
            }))
          : [{ path: ["content"], message: "Content is not playable yet." }];
      throw new EditorValidationError(
        "Fix validation issues before continuing.",
        issues,
      );
    }

    const slug = current.publicSlug ?? publicSlugFromId(current.id);
    const next: EditorActivity = {
      ...current,
      publicSlug: slug,
      status: "finalized",
      revision: current.revision + 1,
      updatedAt: nowIso(),
    };
    this.store.set(id, next);
    return {
      id: next.id,
      publicSlug: slug,
      revision: next.revision,
      updatedAt: next.updatedAt,
    };
  }

  /** Test helper: clear all activities. */
  clear(): void {
    this.store.clear();
  }

  /** Test helper: seed an activity at a known revision. */
  seed(activity: EditorActivity): void {
    this.store.set(activity.id, structuredClone(activity));
  }
}

let defaultPort: MemoryEditorPort | null = null;

/** Process-wide default used by editor routes until 01 injects real port. */
export function getDefaultEditorPort(): EditorActivityPort {
  if (!defaultPort) {
    defaultPort = new MemoryEditorPort();
  }
  return defaultPort;
}

export function resetDefaultEditorPortForTests(): void {
  defaultPort?.clear();
  defaultPort = null;
  getStore().clear();
}
