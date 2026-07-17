"use client";

import { useCallback, useId, useState, type ReactElement } from "react";
import type {
  Statement,
  StatementsContentV1,
} from "@/domain/content/statements.v1";
import type { RichContent } from "@/domain/rich-content";
import type { EditorAdapterContext } from "@/features/editor/types";
import { Button } from "@/design-system/Button";
import { parseBulkPaste } from "@/features/templates/true-false/bulk-paste";
import { TRUE_FALSE_COPY } from "@/features/templates/true-false/copy";
import {
  TRUE_FALSE_LIMITS,
  TF_MAX_STATEMENTS,
} from "@/features/templates/true-false/validation";

function newStatementId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `00000000-0000-4000-8000-${Math.floor(Math.random() * 1e12)
    .toString()
    .padStart(12, "0")
    .slice(0, 12)}`;
}

function emptyStatement(): Statement {
  return { id: newStatementId(), content: { text: "" }, isTrue: null };
}

export function TrueFalseEditor(
  context: EditorAdapterContext<StatementsContentV1>,
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
  const baseId = useId();

  const helper = limits.helperCopy ?? TRUE_FALSE_LIMITS.helperCopy;
  const maxItems = limits.maxItems ?? TF_MAX_STATEMENTS;

  const commit = useCallback(
    (next: StatementsContentV1) => {
      onDraftChange(next);
      onDirty();
    },
    [onDraftChange, onDirty],
  );

  const updateStatementContent = (id: string, content: RichContent) => {
    commit({
      ...draft,
      statements: draft.statements.map((s) =>
        s.id === id ? { ...s, content } : s,
      ),
    });
  };

  const setTruth = (id: string, isTrue: boolean) => {
    commit({
      ...draft,
      statements: draft.statements.map((s) =>
        s.id === id ? { ...s, isTrue } : s,
      ),
    });
  };

  const addStatement = () => {
    if (draft.statements.length >= maxItems) return;
    commit({
      ...draft,
      statements: [...draft.statements, emptyStatement()],
    });
  };

  const deleteStatement = (id: string) => {
    commit({
      ...draft,
      statements: draft.statements.filter((s) => s.id !== id),
    });
  };

  const duplicateStatement = (id: string) => {
    if (draft.statements.length >= maxItems) return;
    const index = draft.statements.findIndex((s) => s.id === id);
    if (index < 0) return;
    const source = draft.statements[index]!;
    const copy: Statement = {
      id: newStatementId(),
      content: { ...source.content },
      isTrue: source.isTrue,
    };
    const statements = [...draft.statements];
    statements.splice(index + 1, 0, copy);
    commit({ ...draft, statements });
  };

  const moveStatement = (id: string, direction: -1 | 1) => {
    const index = draft.statements.findIndex((s) => s.id === id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= draft.statements.length) return;
    const statements = [...draft.statements];
    const [row] = statements.splice(index, 1);
    statements.splice(target, 0, row!);
    commit({ ...draft, statements });
  };

  const applyBulkPaste = () => {
    const lines = parseBulkPaste(bulkText);
    if (lines.length === 0) {
      setBulkOpen(false);
      setBulkText("");
      return;
    }
    const room = maxItems - draft.statements.length;
    const accepted = lines.slice(0, Math.max(0, room));
    const newRows: Statement[] = accepted.map((line) => ({
      id: newStatementId(),
      content: { text: line.text },
      isTrue: line.isTrue,
    }));
    commit({
      ...draft,
      statements: [...draft.statements, ...newRows],
    });
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
      data-template-editor="true-false"
      data-testid="true-false-editor"
    >
      <p className="text-sm text-[var(--fw-color-muted-strong)]">{helper}</p>
      <p className="text-xs text-[var(--fw-color-muted-strong)]">
        {TRUE_FALSE_COPY.bulkPasteHelp}
      </p>

      {(errorMessages.length > 0 || warningMessages.length > 0) && (
        <div className="flex flex-col gap-1" role="status">
          {errorMessages.map((msg) => (
            <p
              key={`e-${msg}`}
              className="text-sm text-[var(--fw-color-danger-text)]"
              data-testid="tf-validation-error"
            >
              {msg}
            </p>
          ))}
          {warningMessages.map((msg) => (
            <p
              key={`w-${msg}`}
              className="text-sm text-[var(--fw-color-warning)]"
              data-testid="tf-validation-warning"
            >
              {msg}
            </p>
          ))}
        </div>
      )}

      <ul
        className="flex list-none flex-col gap-3 p-0"
        aria-label="Statements"
        data-testid="tf-statement-list"
      >
        {draft.statements.map((statement, index) => (
          <li
            key={statement.id}
            className="rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] p-3"
            data-testid={`tf-statement-row-${index}`}
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[var(--fw-color-muted-strong)]">
                {TRUE_FALSE_COPY.statementLabel} {index + 1}
              </span>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant="ghost"
                  className="min-h-9 px-2 text-sm"
                  onClick={() => moveStatement(statement.id, -1)}
                  disabled={index === 0}
                  aria-label={TRUE_FALSE_COPY.moveUp}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-9 px-2 text-sm"
                  onClick={() => moveStatement(statement.id, 1)}
                  disabled={index === draft.statements.length - 1}
                  aria-label={TRUE_FALSE_COPY.moveDown}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-9 px-2 text-sm"
                  onClick={() => duplicateStatement(statement.id)}
                  disabled={draft.statements.length >= maxItems}
                  aria-label={TRUE_FALSE_COPY.duplicate}
                >
                  {TRUE_FALSE_COPY.duplicate}
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-9 px-2 text-sm"
                  onClick={() => deleteStatement(statement.id)}
                  aria-label={TRUE_FALSE_COPY.delete}
                >
                  {TRUE_FALSE_COPY.delete}
                </Button>
              </div>
            </div>

            {RichContentField ? (
              (RichContentField({
                value: statement.content,
                onChange: (next) =>
                  updateStatementContent(statement.id, next),
                label: TRUE_FALSE_COPY.statementLabel,
                mediaTarget: {
                  kind: "statement",
                  statementId: statement.id,
                  channel: "image",
                },
              }) as ReactElement)
            ) : (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor={`${baseId}-text-${statement.id}`}
                  className="text-sm font-semibold"
                >
                  {TRUE_FALSE_COPY.statementLabel}
                </label>
                <textarea
                  id={`${baseId}-text-${statement.id}`}
                  value={statement.content.text ?? ""}
                  onChange={(e) =>
                    updateStatementContent(statement.id, {
                      ...statement.content,
                      text: e.target.value,
                    })
                  }
                  rows={2}
                  maxLength={2000}
                  className="min-h-[var(--fw-touch-min)] w-full rounded-[var(--fw-radius-sm)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fw-color-focus-ring)]"
                  data-testid={`tf-statement-text-${index}`}
                />
                <Button
                  variant="ghost"
                  className="self-start text-sm"
                  onClick={() =>
                    openMediaModal({
                      kind: "statement",
                      statementId: statement.id,
                      channel: "image",
                    })
                  }
                >
                  Add image
                </Button>
              </div>
            )}

            <fieldset className="mt-3">
              <legend className="mb-1 text-sm font-semibold">
                {TRUE_FALSE_COPY.truthToggleLabel}
              </legend>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={TRUE_FALSE_COPY.truthToggleLabel}
              >
                <Button
                  variant={statement.isTrue === true ? "primary" : "secondary"}
                  className="min-h-[var(--fw-touch-min)] min-w-[5.5rem]"
                  onClick={() => setTruth(statement.id, true)}
                  aria-pressed={statement.isTrue === true}
                  data-testid={`tf-truth-true-${index}`}
                >
                  {TRUE_FALSE_COPY.markTrue}
                </Button>
                <Button
                  variant={statement.isTrue === false ? "primary" : "secondary"}
                  className="min-h-[var(--fw-touch-min)] min-w-[5.5rem]"
                  onClick={() => setTruth(statement.id, false)}
                  aria-pressed={statement.isTrue === false}
                  data-testid={`tf-truth-false-${index}`}
                >
                  {TRUE_FALSE_COPY.markFalse}
                </Button>
              </div>
            </fieldset>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={addStatement}
          disabled={draft.statements.length >= maxItems}
          data-testid="tf-add-statement"
        >
          {TRUE_FALSE_COPY.addStatement}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setBulkOpen((v) => !v)}
          data-testid="tf-bulk-toggle"
        >
          {TRUE_FALSE_COPY.bulkPaste}
        </Button>
      </div>

      {bulkOpen ? (
        <div
          className="flex flex-col gap-2 rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-tile-pale)] p-3"
          data-testid="tf-bulk-panel"
        >
          <label
            htmlFor={`${baseId}-bulk`}
            className="text-sm font-semibold"
          >
            {TRUE_FALSE_COPY.bulkPasteHelp}
          </label>
          <textarea
            id={`${baseId}-bulk`}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={6}
            placeholder={TRUE_FALSE_COPY.bulkPastePlaceholder}
            className="w-full rounded-[var(--fw-radius-sm)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] px-3 py-2 text-base"
            data-testid="tf-bulk-textarea"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={applyBulkPaste}
              data-testid="tf-bulk-apply"
            >
              {TRUE_FALSE_COPY.applyBulk}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setBulkOpen(false);
                setBulkText("");
              }}
            >
              {TRUE_FALSE_COPY.cancelBulk}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
