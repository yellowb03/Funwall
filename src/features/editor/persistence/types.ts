import type { ContentPackV1 } from "@/domain/content";
import type { TemplateKey } from "@/domain/template-keys";

/**
 * Activity shape used by the shared editor.
 * Workstream 01 owns the durable DB model; this is the editor-facing projection.
 */
export type ActivityStatus = "draft" | "finalized";

export interface EditorActivity {
  id: string;
  publicSlug: string | null;
  title: string;
  instruction?: string;
  templateKey: TemplateKey;
  content: ContentPackV1;
  settings: Record<string, unknown>;
  themeKey: string;
  /** Server revision for compare-and-swap autosave (ADR-004). */
  revision: number;
  status: ActivityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDraftInput {
  templateKey: TemplateKey;
  title?: string;
  instruction?: string;
  content: ContentPackV1;
  settings?: Record<string, unknown>;
  themeKey?: string;
}

export interface AutosavePatch {
  title?: string;
  instruction?: string | null;
  content?: ContentPackV1;
  settings?: Record<string, unknown>;
  themeKey?: string;
}

export interface AutosaveSuccess {
  revision: number;
  updatedAt: string;
}

export interface FinalizeSuccess {
  id: string;
  publicSlug: string;
  revision: number;
  updatedAt: string;
}

export class EditorPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EditorPersistenceError";
  }
}

export class EditorNotFoundError extends EditorPersistenceError {
  constructor(id: string) {
    super(`Activity "${id}" was not found`);
    this.name = "EditorNotFoundError";
  }
}

/**
 * Compare-and-swap conflict: client baseRevision does not match server.
 * Caller must preserve local edits and present conflict UI.
 */
export class EditorConflictError extends EditorPersistenceError {
  readonly server: EditorActivity;

  constructor(server: EditorActivity) {
    super(
      `Revision conflict for activity "${server.id}": server is at ${server.revision}`,
    );
    this.name = "EditorConflictError";
    this.server = server;
  }
}

export class EditorValidationError extends EditorPersistenceError {
  readonly issues: Array<{ path: Array<string | number>; message: string }>;

  constructor(
    message: string,
    issues: Array<{ path: Array<string | number>; message: string }>,
  ) {
    super(message);
    this.name = "EditorValidationError";
    this.issues = issues;
  }
}
