export * from "@/features/editor/types";
export * from "@/features/editor/mock-adapter";
export * from "@/features/editor/template-catalog";
export * from "@/features/editor/empty-drafts";
export * from "@/features/editor/row-helpers";
export * from "@/features/editor/persistence/port";
export * from "@/features/editor/persistence/types";
export {
  MemoryEditorPort,
  getDefaultEditorPort,
  resetDefaultEditorPortForTests,
} from "@/features/editor/persistence/memory-port";
export {
  AUTOSAVE_DEBOUNCE_MS,
  createAutosaveState,
  reduceAutosave,
  shouldStartSave,
  hasUnsavedChanges,
  autosaveStatusLabel,
  type AutosavePhase,
  type AutosaveEvent,
  type AutosaveMachineState,
  type AutosaveConflict,
} from "@/features/editor/autosave/machine";
export {
  writeRecoveryDraft,
  readRecoveryDraft,
  clearRecoveryDraft,
  recoveryStorageKey,
  shouldOfferRecovery,
  type RecoveryDraft,
} from "@/features/editor/autosave/recovery";
export { EditorFrame, type EditorFrameProps } from "@/features/editor/EditorFrame";
export { AutosaveStatus, type AutosaveStatusProps } from "@/features/editor/AutosaveStatus";
export {
  ValidationSummary,
  type ValidationSummaryProps,
} from "@/features/editor/ValidationSummary";
export {
  RichContentField,
  type RichContentFieldProps,
} from "@/features/editor/RichContentField";
export {
  TemplatePicker,
  type TemplatePickerProps,
} from "@/features/editor/picker/TemplatePicker";
export {
  EditorWorkspace,
  type EditorWorkspaceProps,
} from "@/features/editor/EditorWorkspace";
export {
  useAutosave,
  type UseAutosaveOptions,
  type UseAutosaveResult,
} from "@/features/editor/use-autosave";
