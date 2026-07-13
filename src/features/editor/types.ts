import type { RichContent } from "@/domain/rich-content";

/**
 * Shared editor adapter contract (fake/mock surface for Wave 1).
 * @see agent-work/shared/CONTRACTS.md §13
 */
export type MediaTargetDescriptor =
  | { kind: "item"; itemId: string; channel: "image" | "audio" }
  | { kind: "pairSide"; pairId: string; side: "left" | "right"; channel: "image" | "audio" }
  | { kind: "question"; questionId: string; channel: "image" | "audio" | "revealImage" }
  | { kind: "answer"; questionId: string; answerId: string; channel: "image" | "audio" }
  | { kind: "statement"; statementId: string; channel: "image" | "audio" };

export interface ValidationIssue {
  path: Array<string | number>;
  message: string;
  severity: "error" | "warning";
}

export interface EditorRowHelpers<TRow> {
  add: (row?: Partial<TRow>) => void;
  update: (id: string, patch: Partial<TRow>) => void;
  reorder: (orderedIds: string[]) => void;
  duplicate: (id: string) => void;
  delete: (id: string) => void;
}

export interface EditorAdapterContext<TDraft> {
  draft: TDraft;
  onDraftChange: (next: TDraft) => void;
  validation: ValidationIssue[];
  onDirty: () => void;
  openMediaModal: (target: MediaTargetDescriptor) => void;
  limits: {
    minItems: number;
    maxItems: number;
    helperCopy?: string;
  };
  /** Shared rich-content field renderer will be provided by Workstream 02. */
  RichContentField?: (props: {
    value: RichContent;
    onChange: (next: RichContent) => void;
    label?: string;
  }) => unknown;
}

/**
 * Template editor adapters return field UI only.
 * They must not render title, progress strip, autosave, Done, or owner chrome.
 */
export interface EditorAdapter<TDraft> {
  render(context: EditorAdapterContext<TDraft>): unknown;
}
