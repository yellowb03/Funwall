import type { EditorAdapter, EditorAdapterContext } from "@/features/editor/types";

/**
 * No-op editor adapter for contract tests and scaffolds.
 * Workstream 02 replaces this with the real shared editor shell + field kit.
 */
export function createNoopEditorAdapter<TDraft>(): EditorAdapter<TDraft> {
  return {
    render(_context: EditorAdapterContext<TDraft>) {
      void _context;
      return null;
    },
  };
}

export async function loadNoopEditorAdapterModule() {
  return {
    createEditorAdapter: createNoopEditorAdapter,
  };
}
