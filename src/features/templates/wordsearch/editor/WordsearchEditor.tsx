"use client";

import { useCallback, useId, useState, type ReactElement } from "react";
import type {
  WordsearchContentV1,
  WordsearchEntry,
} from "@/domain/content/wordsearch.v1";
import type { RichContent } from "@/domain/rich-content";
import type { EditorAdapterContext } from "@/features/editor/types";
import { Button } from "@/design-system/Button";
import { WORDSEARCH_COPY } from "@/features/templates/wordsearch/copy";
import { normalizeWord } from "@/features/templates/wordsearch/normalize";
import {
  WORDSEARCH_LIMITS,
  WORDSEARCH_MAX_WORDS,
} from "@/features/templates/wordsearch/validation";

function newWordId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `00000000-0000-4000-8000-${Math.floor(Math.random() * 1e12)
    .toString()
    .padStart(12, "0")
    .slice(0, 12)}`;
}

function emptyWord(): WordsearchEntry {
  return { id: newWordId(), displayWord: "", normalizedWord: "" };
}

export function WordsearchEditor(
  context: EditorAdapterContext<WordsearchContentV1>,
): ReactElement {
  const {
    draft,
    onDraftChange,
    onDirty,
    openMediaModal,
    validation,
    limits,
    RichContentField,
  } = context;

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [clueMode, setClueMode] = useState(() =>
    draft.words.some((w) => Boolean(w.clue?.text || w.clue?.imageAssetId)),
  );
  const baseId = useId();

  const helper = limits.helperCopy ?? WORDSEARCH_LIMITS.helperCopy;
  const maxItems = limits.maxItems ?? WORDSEARCH_MAX_WORDS;

  const commit = useCallback(
    (next: WordsearchContentV1) => {
      onDraftChange(next);
      onDirty();
    },
    [onDraftChange, onDirty],
  );

  const updateWord = (id: string, displayWord: string) => {
    const norm = normalizeWord(displayWord, { diacriticPolicy: "fold" });
    commit({
      ...draft,
      words: draft.words.map((w) =>
        w.id === id
          ? {
              ...w,
              displayWord,
              normalizedWord: norm.ok ? norm.normalizedWord : w.normalizedWord,
            }
          : w,
      ),
    });
  };

  const updateClue = (id: string, clue: RichContent | undefined) => {
    commit({
      ...draft,
      words: draft.words.map((w) =>
        w.id === id
          ? {
              ...w,
              clue:
                clue &&
                (clue.text?.trim() || clue.imageAssetId || clue.audioAssetId)
                  ? clue
                  : undefined,
            }
          : w,
      ),
    });
  };

  const addWord = () => {
    if (draft.words.length >= maxItems) return;
    commit({ ...draft, words: [...draft.words, emptyWord()] });
  };

  const deleteWord = (id: string) => {
    commit({ ...draft, words: draft.words.filter((w) => w.id !== id) });
  };

  const duplicateWord = (id: string) => {
    if (draft.words.length >= maxItems) return;
    const index = draft.words.findIndex((w) => w.id === id);
    if (index < 0) return;
    const source = draft.words[index]!;
    const copy: WordsearchEntry = {
      id: newWordId(),
      displayWord: source.displayWord,
      normalizedWord: source.normalizedWord,
      clue: source.clue ? { ...source.clue } : undefined,
    };
    const words = [...draft.words];
    words.splice(index + 1, 0, copy);
    commit({ ...draft, words });
  };

  const moveWord = (id: string, direction: -1 | 1) => {
    const index = draft.words.findIndex((w) => w.id === id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= draft.words.length) return;
    const words = [...draft.words];
    const [row] = words.splice(index, 1);
    words.splice(target, 0, row!);
    commit({ ...draft, words });
  };

  const applyBulkPaste = () => {
    const lines = bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      setBulkOpen(false);
      setBulkText("");
      return;
    }
    const room = maxItems - draft.words.length;
    const accepted = lines.slice(0, Math.max(0, room));
    const newWords: WordsearchEntry[] = accepted.map((line) => {
      const tab = line.indexOf("\t");
      const displayWord = (tab >= 0 ? line.slice(0, tab) : line).trim();
      const clueText = tab >= 0 ? line.slice(tab + 1).trim() : "";
      const norm = normalizeWord(displayWord, { diacriticPolicy: "fold" });
      return {
        id: newWordId(),
        displayWord,
        normalizedWord: norm.ok ? norm.normalizedWord : "",
        clue: clueText ? { text: clueText } : undefined,
      };
    });
    if (newWords.some((w) => w.clue)) setClueMode(true);
    commit({ ...draft, words: [...draft.words, ...newWords] });
    setBulkOpen(false);
    setBulkText("");
  };

  const errorMessages = validation
    .filter((v) => v.severity === "error")
    .map((v) => v.message);
  const warningMessages = validation
    .filter((v) => v.severity === "warning")
    .map((v) => v.message);

  return (
    <div
      className="flex flex-col gap-4 text-[var(--fw-color-ink)]"
      data-template-editor="wordsearch"
    >
      <p className="text-sm text-[var(--fw-color-muted-strong)]">{helper}</p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={clueMode ? "secondary" : "primary"}
          onClick={() => setClueMode(false)}
          data-testid="wordsearch-mode-words"
        >
          {WORDSEARCH_COPY.wordsOnlyMode}
        </Button>
        <Button
          type="button"
          variant={clueMode ? "primary" : "secondary"}
          onClick={() => setClueMode(true)}
          data-testid="wordsearch-mode-clues"
        >
          {WORDSEARCH_COPY.clueMode}
        </Button>
      </div>

      {(errorMessages.length > 0 || warningMessages.length > 0) && (
        <ul
          className="list-disc pl-5 text-sm"
          data-testid="wordsearch-editor-validation"
        >
          {errorMessages.map((m) => (
            <li key={m} className="text-[var(--fw-color-danger,#b91c1c)]">
              {m}
            </li>
          ))}
          {warningMessages.map((m) => (
            <li key={`w-${m}`} className="text-[var(--fw-color-warning,#a16207)]">
              {m}
            </li>
          ))}
        </ul>
      )}

      <div
        className="flex flex-col gap-3"
        role="list"
        aria-label="Wordsearch words"
      >
        {draft.words.map((word, index) => {
          const preview = normalizeWord(word.displayWord, {
            diacriticPolicy: "fold",
          });
          return (
            <div
              key={word.id}
              role="listitem"
              className="rounded-lg border border-[var(--fw-color-border,#d4d4d8)] bg-[var(--fw-color-surface,#fff)] p-3"
              data-testid={`wordsearch-row-${index}`}
            >
              <div className="flex flex-wrap items-start gap-2">
                <span className="mt-2 w-6 text-sm text-[var(--fw-color-muted-strong)]">
                  {index + 1}
                </span>
                <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
                  <label
                    htmlFor={`${baseId}-word-${word.id}`}
                    className="text-xs font-semibold"
                  >
                    {WORDSEARCH_COPY.wordLabel}
                  </label>
                  <input
                    id={`${baseId}-word-${word.id}`}
                    className="rounded border border-[var(--fw-color-border,#d4d4d8)] px-2 py-1.5 text-base"
                    value={word.displayWord}
                    maxLength={40}
                    onChange={(e) => updateWord(word.id, e.target.value)}
                    data-testid={`wordsearch-display-${index}`}
                  />
                  <p
                    className="text-xs text-[var(--fw-color-muted-strong)]"
                    data-testid={`wordsearch-normalized-${index}`}
                  >
                    {WORDSEARCH_COPY.normalizedLabel}:{" "}
                    <span className="font-mono tracking-wide">
                      {preview.ok
                        ? preview.normalizedWord
                        : preview.normalizedWord || "—"}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => moveWord(word.id, -1)}
                    disabled={index === 0}
                    aria-label={WORDSEARCH_COPY.moveUp}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => moveWord(word.id, 1)}
                    disabled={index === draft.words.length - 1}
                    aria-label={WORDSEARCH_COPY.moveDown}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => duplicateWord(word.id)}
                    disabled={draft.words.length >= maxItems}
                  >
                    {WORDSEARCH_COPY.duplicate}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => deleteWord(word.id)}
                  >
                    {WORDSEARCH_COPY.delete}
                  </Button>
                </div>
              </div>

              {clueMode && (
                <div className="mt-3 pl-8">
                  {RichContentField ? (
                    (RichContentField({
                      value: word.clue ?? { text: "" },
                      onChange: (next) => updateClue(word.id, next),
                      label: WORDSEARCH_COPY.clueLabel,
                      mediaTarget: {
                        kind: "item",
                        itemId: word.id,
                        channel: "image",
                      },
                    }) as ReactElement)
                  ) : (
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor={`${baseId}-clue-${word.id}`}
                        className="text-xs font-semibold"
                      >
                        {WORDSEARCH_COPY.clueLabel}
                      </label>
                      <input
                        id={`${baseId}-clue-${word.id}`}
                        className="rounded border border-[var(--fw-color-border,#d4d4d8)] px-2 py-1.5 text-sm"
                        value={word.clue?.text ?? ""}
                        onChange={(e) =>
                          updateClue(word.id, {
                            ...(word.clue ?? {}),
                            text: e.target.value,
                          })
                        }
                        data-testid={`wordsearch-clue-${index}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="self-start"
                        onClick={() =>
                          openMediaModal({
                            kind: "item",
                            itemId: word.id,
                            channel: "image",
                          })
                        }
                      >
                        Add image
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          onClick={addWord}
          disabled={draft.words.length >= maxItems}
          data-testid="wordsearch-add-word"
        >
          {WORDSEARCH_COPY.addWord}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setBulkOpen((v) => !v)}
          data-testid="wordsearch-bulk-toggle"
        >
          {WORDSEARCH_COPY.bulkPaste}
        </Button>
      </div>

      {bulkOpen && (
        <div
          className="flex flex-col gap-2 rounded-lg border border-dashed border-[var(--fw-color-border,#d4d4d8)] p-3"
          data-testid="wordsearch-bulk-panel"
        >
          <p className="text-xs text-[var(--fw-color-muted-strong)]">
            {WORDSEARCH_COPY.bulkHelp}
          </p>
          <label htmlFor={`${baseId}-bulk`} className="sr-only">
            {WORDSEARCH_COPY.bulkPaste}
          </label>
          <textarea
            id={`${baseId}-bulk`}
            className="min-h-[8rem] rounded border border-[var(--fw-color-border,#d4d4d8)] p-2 font-mono text-sm"
            placeholder={WORDSEARCH_COPY.bulkPastePlaceholder}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            aria-label={WORDSEARCH_COPY.bulkPaste}
          />
          <div className="flex gap-2">
            <Button type="button" variant="primary" onClick={applyBulkPaste}>
              {WORDSEARCH_COPY.applyBulk}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setBulkOpen(false);
                setBulkText("");
              }}
            >
              {WORDSEARCH_COPY.cancelBulk}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
