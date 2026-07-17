"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { ContentPackV1 } from "@/domain/content";
import { parsePlayableContentPack } from "@/domain/content";
import type { TemplateKey } from "@/domain/template-keys";
import { EditorFrame } from "@/features/editor/EditorFrame";
import { RichContentField } from "@/features/editor/RichContentField";
import { useAutosave } from "@/features/editor/use-autosave";
import { createServerActionEditorPort } from "@/features/editor/persistence/server-action-port";
import type { EditorActivityPort } from "@/features/editor/persistence/port";
import type { EditorActivity } from "@/features/editor/persistence/types";
import {
  EditorConflictError,
  EditorValidationError,
} from "@/features/editor/persistence/types";
import type {
  EditorAdapter,
  EditorAdapterContext,
  MediaTargetDescriptor,
  ValidationIssue,
} from "@/features/editor/types";
import { getCatalogEntry } from "@/features/editor/template-catalog";
import {
  clearRecoveryDraft,
  readRecoveryDraft,
} from "@/features/editor/autosave/recovery";
import { MediaModal } from "@/features/media/MediaModal";
import { getDefaultMediaStore } from "@/features/media/media-store";
import type { MediaInsertion } from "@/features/media/types";
import { Button } from "@/design-system/Button";
import type { RichContent } from "@/domain/rich-content";
import { loadClientEditorAdapter } from "@/features/editor/client-adapter-loader";

export interface EditorWorkspaceProps {
  activity: EditorActivity;
  templateKey: TemplateKey;
  /** Preloaded adapter instance, or null when not available. */
  adapter?: EditorAdapter<ContentPackV1> | null;
  /**
   * Persistence port. Defaults to server-action port (foundation repository).
   * Tests may inject MemoryEditorPort.
   */
  port?: EditorActivityPort;
  /** Where Done navigates after finalize. Default: owner activity page. */
  doneHref?: (result: { id: string; publicSlug: string }) => string;
}

/**
 * Client editor shell: draft state, autosave, media modal, adapter slot, Done.
 */
export function EditorWorkspace({
  activity: initial,
  templateKey,
  adapter,
  port: portProp,
  doneHref,
}: EditorWorkspaceProps) {
  const router = useRouter();
  const port = useMemo(
    () => portProp ?? createServerActionEditorPort(),
    [portProp],
  );
  const mediaStore = useMemo(() => getDefaultMediaStore(), []);
  const meta = getCatalogEntry(templateKey);

  const [title, setTitle] = useState(initial.title);
  const [instruction, setInstruction] = useState(initial.instruction ?? "");
  const [showInstruction, setShowInstruction] = useState(
    Boolean(initial.instruction),
  );
  const [content, setContent] = useState<ContentPackV1>(initial.content);
  const [resolvedAdapter, setResolvedAdapter] =
    useState<EditorAdapter<ContentPackV1> | null>(adapter ?? null);
  const [adapterLoading, setAdapterLoading] = useState(!adapter);
  const [adapterError, setAdapterError] = useState<string | null>(null);
  const [settings] = useState(initial.settings);
  const [themeKey] = useState(initial.themeKey);
  const [validation, setValidation] = useState<ValidationIssue[]>([]);
  const [donePending, setDonePending] = useState(false);
  const [recoveryOffer, setRecoveryOffer] = useState(() =>
    readRecoveryDraft(initial.id),
  );
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaTarget, setMediaTarget] =
    useState<MediaTargetDescriptor | null>(null);
  const [mediaSuggested, setMediaSuggested] = useState("");
  const mediaReturnRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (adapter) {
      setResolvedAdapter(adapter);
      setAdapterLoading(false);
      setAdapterError(null);
      return;
    }

    let cancelled = false;
    setAdapterLoading(true);
    setAdapterError(null);
    void loadClientEditorAdapter(templateKey)
      .then((next) => {
        if (!cancelled) setResolvedAdapter(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setAdapterError(
            error instanceof Error ? error.message : "Editor failed to load.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setAdapterLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [adapter, templateKey]);

  // Keep latest values for getPatch without re-creating autosave bindings.
  const draftRef = useRef({ title, instruction, content, settings, themeKey });
  draftRef.current = { title, instruction, content, settings, themeKey };

  const getPatch = useCallback(
    () => ({
      title: draftRef.current.title,
      instruction: draftRef.current.instruction || undefined,
      content: draftRef.current.content,
      settings: draftRef.current.settings,
      themeKey: draftRef.current.themeKey,
    }),
    [],
  );

  const autosave = useAutosave({
    activityId: initial.id,
    templateKey,
    baseRevision: initial.revision,
    port,
    getPatch,
  });

  const markDirty = autosave.markDirty;

  function onTitleChange(next: string) {
    setTitle(next);
    markDirty();
  }

  function onInstructionChange(next: string) {
    setInstruction(next);
    markDirty();
  }

  function onDraftChange(next: ContentPackV1) {
    setContent(next);
    markDirty();
  }

  function openMediaModal(target: MediaTargetDescriptor) {
    mediaReturnRef.current = document.activeElement as HTMLElement | null;
    setMediaTarget(target);
    setMediaSuggested(title || "");
    setMediaOpen(true);
  }

  function onMediaInsert(insertion: MediaInsertion) {
    if (!mediaTarget) return;
    mediaStore.upsert(insertion.asset);
    setContent((current) =>
      applyMediaInsertion(current, mediaTarget, insertion),
    );
    markDirty();
    setMediaOpen(false);
    setMediaTarget(null);
  }

  async function onDone() {
    setDonePending(true);
    setValidation([]);
    try {
      const flushed = await autosave.flush();
      if (!flushed && autosave.state.phase === "conflict") {
        setDonePending(false);
        return;
      }

      const issues: ValidationIssue[] = [];
      if (!title.trim()) {
        issues.push({
          path: ["title"],
          message: "Add an activity title.",
          severity: "error",
        });
      }
      const playable = parsePlayableContentPack(content);
      if (!playable.success) {
        if (
          "error" in playable &&
          playable.error &&
          typeof playable.error === "object" &&
          "issues" in playable.error
        ) {
          for (const issue of (
            playable.error as {
              issues: Array<{ path: PropertyKey[]; message: string }>;
            }
          ).issues) {
            issues.push({
              path: issue.path.map((p) =>
                typeof p === "symbol" ? String(p) : p,
              ) as Array<string | number>,
              message: issue.message,
              severity: "error",
            });
          }
        } else {
          issues.push({
            path: ["content"],
            message: "Check the highlighted fields.",
            severity: "error",
          });
        }
      }

      if (issues.length > 0) {
        setValidation(issues);
        setDonePending(false);
        return;
      }

      // Use latest base revision from the machine after flush (not a stale render).
      const current = await port.get(initial.id);
      const result = await port.finalize(initial.id, current.revision);
      clearRecoveryDraft(initial.id);
      const href =
        doneHref?.({ id: result.id, publicSlug: result.publicSlug }) ??
        `/activities/${result.id}`;
      router.push(href);
    } catch (err) {
      if (err instanceof EditorValidationError) {
        setValidation(
          err.issues.map((i) => ({
            ...i,
            severity: "error" as const,
          })),
        );
      } else if (err instanceof EditorConflictError) {
        autosave.resolveKeepLocal();
      } else {
        setValidation([
          {
            path: [],
            message:
              err instanceof Error
                ? err.message
                : "Could not finish. Try again.",
            severity: "error",
          },
        ]);
      }
      setDonePending(false);
    }
  }

  const adapterNode = useMemo(() => {
    if (adapterLoading) {
      return <AdapterLoading name={meta.displayName} />;
    }
    if (!resolvedAdapter) {
      return (
        <AdapterUnavailable
          name={meta.displayName}
          message={adapterError ?? "This editor is not available yet."}
        />
      );
    }

    const context: EditorAdapterContext<ContentPackV1> = {
      draft: content,
      onDraftChange,
      validation,
      onDirty: markDirty,
      openMediaModal,
      limits: limitsForTemplate(templateKey),
      RichContentField: (props) => (
        <RichContentFieldBridge
          {...props}
          openMediaModal={openMediaModal}
          resolveAsset={(id) => mediaStore.get(id)}
        />
      ),
    };

    const rendered = resolvedAdapter.render(context);
    if (rendered == null) {
      return (
        <AdapterUnavailable
          name={meta.displayName}
          message="The editor returned no fields."
        />
      );
    }
    return rendered as ReactNode;
  }, [
    resolvedAdapter,
    adapterLoading,
    adapterError,
    content,
    validation,
    markDirty,
    templateKey,
    meta.displayName,
    mediaStore,
  ]);

  // Apply recovery if user accepts.
  function acceptRecovery() {
    if (!recoveryOffer) return;
    setTitle(recoveryOffer.title);
    setInstruction(recoveryOffer.instruction ?? "");
    setShowInstruction(Boolean(recoveryOffer.instruction));
    setContent(recoveryOffer.content);
    setRecoveryOffer(null);
    markDirty();
  }

  function discardRecovery() {
    clearRecoveryDraft(initial.id);
    setRecoveryOffer(null);
  }

  return (
    <>
      <EditorFrame
        templateDisplayName={meta.displayName}
        title={title}
        instruction={instruction}
        showInstruction={showInstruction}
        onTitleChange={onTitleChange}
        onInstructionChange={onInstructionChange}
        onToggleInstruction={() => setShowInstruction(true)}
        autosavePhase={autosave.state.phase}
        autosaveError={autosave.state.errorMessage}
        onAutosaveRetry={autosave.retry}
        validation={validation}
        onDone={() => void onDone()}
        donePending={donePending}
        recoveryBanner={
          recoveryOffer ? (
            <div
              role="status"
              className="rounded-[var(--fw-radius-md)] border border-[var(--fw-color-warning)] bg-[var(--fw-color-warning-subtle)] px-3 py-2 text-sm"
            >
              <p className="font-semibold">Local recovery draft available</p>
              <p className="text-[var(--fw-color-ink-secondary)]">
                Unsaved changes from a previous session were found.
              </p>
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="primary" onClick={acceptRecovery}>
                  Restore draft
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={discardRecovery}
                >
                  Discard
                </Button>
              </div>
            </div>
          ) : null
        }
        conflictBanner={
          autosave.state.phase === "conflict" ? (
            <div
              role="alertdialog"
              aria-label="This activity changed elsewhere"
              className="rounded-[var(--fw-radius-md)] border border-[var(--fw-color-coral)] bg-[var(--fw-color-coral-subtle)] px-3 py-2 text-sm"
            >
              <p className="font-semibold">This activity changed elsewhere</p>
              <p>
                Keep your version or load the newer saved version. Your other
                version will not be discarded until you choose.
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => autosave.resolveKeepLocal()}
                >
                  Keep my version
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const snap = autosave.state.conflict?.snapshot as
                      | EditorActivity
                      | undefined;
                    if (snap) {
                      setTitle(snap.title);
                      setInstruction(snap.instruction ?? "");
                      setContent(snap.content);
                      autosave.resolveUseServer(snap.revision);
                      clearRecoveryDraft(initial.id);
                    }
                  }}
                >
                  Load saved version
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {adapterNode}
      </EditorFrame>

      <MediaModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onInsert={onMediaInsert}
        suggestedQuery={mediaSuggested}
        returnFocusRef={mediaReturnRef}
      />
    </>
  );
}

function AdapterLoading({ name }: { name: string }) {
  return (
    <div
      className="rounded-[var(--fw-radius-md)] bg-[var(--fw-color-surface-sunken)] px-4 py-8"
      data-testid="adapter-loading"
    >
      <p className="font-semibold">Loading {name} editor…</p>
      <div className="mt-4 h-24 animate-pulse rounded-[var(--fw-radius-md)] bg-[var(--fw-color-tile-pale)] motion-reduce:animate-none" />
    </div>
  );
}

function AdapterUnavailable({
  name,
  message,
}: {
  name: string;
  message: string;
}) {
  return (
    <div
      className="rounded-[var(--fw-radius-md)] border border-[var(--fw-color-coral)] bg-[var(--fw-color-coral-subtle)] px-4 py-6"
      data-testid="adapter-unavailable"
      role="alert"
    >
      <p className="font-semibold">{name} editor is unavailable</p>
      <p className="mt-1 text-sm text-[var(--fw-color-danger-text)]">
        {message}
      </p>
    </div>
  );
}

function limitsForTemplate(key: TemplateKey): EditorAdapterContext<unknown>["limits"] {
  switch (key) {
    case "wheel":
      return {
        minItems: 2,
        maxItems: 100,
        helperCopy: "2–100 items. Labels get hard to read above 30.",
      };
    case "matching-pairs":
      return {
        minItems: 2,
        maxItems: 30,
        helperCopy: "2–30 pairs. 6–12 works well for most classes.",
      };
    case "gameshow-quiz":
      return {
        minItems: 1,
        maxItems: 100,
        helperCopy: "1–100 questions. 2–6 answers each; mark one correct.",
      };
    case "wordsearch":
      return {
        minItems: 2,
        maxItems: 40,
        helperCopy: "2–40 words. 6–16 is a good classroom length.",
      };
    case "image-quiz":
      return {
        minItems: 1,
        maxItems: 100,
        helperCopy:
          "1–100 questions. Each needs a reveal image and 2–6 answers.",
      };
    case "true-false":
      return {
        minItems: 2,
        maxItems: 200,
        helperCopy:
          "2–200 statements. Each must be marked true or false.",
      };
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

/**
 * Bridge that lets adapters render RichContentField with media open wired.
 * Listens for funwall:media-insert when this field opened the modal.
 */
function RichContentFieldBridge(props: {
  value: RichContent;
  onChange: (next: RichContent) => void;
  label?: string;
  mediaTarget: MediaTargetDescriptor;
  openMediaModal: (target: MediaTargetDescriptor) => void;
  resolveAsset: (id: string) => ReturnType<
    ReturnType<typeof getDefaultMediaStore>["get"]
  >;
}) {
  const { openMediaModal, resolveAsset, mediaTarget, ...fieldProps } = props;

  return (
    <RichContentField
      {...fieldProps}
      resolveAsset={resolveAsset}
      onOpenMedia={() => openMediaModal(mediaTarget)}
    />
  );
}

function withImage(content: RichContent, insertion: MediaInsertion): RichContent {
  return {
    ...content,
    imageAssetId: insertion.assetId,
    imageAlt: insertion.alt,
    imageFit: insertion.imageFit,
  };
}

/** Apply a media selection to exactly one stable content target. */
export function applyMediaInsertion(
  pack: ContentPackV1,
  target: MediaTargetDescriptor,
  insertion: MediaInsertion,
): ContentPackV1 {
  if (target.channel === "audio") return pack;

  switch (target.kind) {
    case "item":
      if (pack.family === "list") {
        return {
          ...pack,
          items: pack.items.map((item) =>
            item.id === target.itemId
              ? { ...item, content: withImage(item.content, insertion) }
              : item,
          ),
        };
      }
      if (pack.family === "wordsearch") {
        return {
          ...pack,
          words: pack.words.map((word) =>
            word.id === target.itemId
              ? {
                  ...word,
                  clue: withImage(word.clue ?? { text: "" }, insertion),
                }
              : word,
          ),
        };
      }
      return pack;
    case "pairSide":
      if (pack.family !== "pairs") return pack;
      return {
        ...pack,
        pairs: pack.pairs.map((pair) =>
          pair.id === target.pairId
            ? { ...pair, [target.side]: withImage(pair[target.side], insertion) }
            : pair,
        ),
      };
    case "question":
      if (pack.family === "quiz") {
        return {
          ...pack,
          questions: pack.questions.map((question) =>
            question.id === target.questionId
              ? { ...question, prompt: withImage(question.prompt, insertion) }
              : question,
          ),
        };
      }
      if (pack.family === "imageQuiz") {
        return {
          ...pack,
          questions: pack.questions.map((question) => {
            if (question.id !== target.questionId) return question;
            if (target.channel === "revealImage") {
              return {
                ...question,
                revealImageAssetId: insertion.assetId,
                revealImageAlt: insertion.alt,
              };
            }
            return {
              ...question,
              prompt: withImage(question.prompt, insertion),
            };
          }),
        };
      }
      return pack;
    case "answer":
      if (pack.family !== "quiz" && pack.family !== "imageQuiz") return pack;
      return {
        ...pack,
        questions: pack.questions.map((question) =>
          question.id === target.questionId
            ? {
                ...question,
                answers: question.answers.map((answer) =>
                  answer.id === target.answerId
                    ? { ...answer, content: withImage(answer.content, insertion) }
                    : answer,
                ),
              }
            : question,
        ),
      } as ContentPackV1;
    case "statement":
      if (pack.family !== "statements") return pack;
      return {
        ...pack,
        statements: pack.statements.map((statement) =>
          statement.id === target.statementId
            ? {
                ...statement,
                content: withImage(statement.content, insertion),
              }
            : statement,
        ),
      };
    default: {
      const exhaustive: never = target;
      return exhaustive;
    }
  }
}
