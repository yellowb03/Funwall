import type {
  AutosavePatch,
  AutosaveSuccess,
  CreateDraftInput,
  EditorActivity,
  FinalizeSuccess,
} from "@/features/editor/persistence/types";

/**
 * Editor persistence port.
 * Workstream 02 ships a MemoryEditorPort so the UI works standalone.
 * Workstream 01 / integration lead swap in the real repository.
 *
 * @see docs/adr/ADR-004-autosave-revision.md
 * @see agent-work/shared/CONTRACTS.md §14
 */
export interface EditorActivityPort {
  createDraft(input: CreateDraftInput): Promise<EditorActivity>;
  autosave(
    id: string,
    baseRevision: number,
    patch: AutosavePatch,
  ): Promise<AutosaveSuccess>;
  finalize(id: string, baseRevision: number): Promise<FinalizeSuccess>;
  get(id: string): Promise<EditorActivity>;
}
