"use client";

import { useCallback, useId, useState, type ReactElement } from "react";
import type { ListContentV1, ListItem } from "@/domain/content/list.v1";
import type { RichContent } from "@/domain/rich-content";
import type { EditorAdapterContext } from "@/features/editor/types";
import { Button } from "@/design-system/Button";
import { WHEEL_COPY } from "@/features/templates/wheel/copy";
import {
  WHEEL_LIMITS,
  WHEEL_MAX_ITEMS,
  WHEEL_WARN_ITEM_COUNT,
} from "@/features/templates/wheel/validation";

function newItemId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `00000000-0000-4000-8000-${Math.floor(Math.random() * 1e12)
    .toString()
    .padStart(12, "0")
    .slice(0, 12)}`;
}

function emptyItem(): ListItem {
  return { id: newItemId(), content: { text: "" } };
}

export function WheelEditor(
  context: EditorAdapterContext<ListContentV1>,
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

  const helper = limits.helperCopy ?? WHEEL_LIMITS.helperCopy;
  const maxItems = limits.maxItems ?? WHEEL_MAX_ITEMS;

  const commit = useCallback(
    (next: ListContentV1) => {
      onDraftChange(next);
      onDirty();
    },
    [onDraftChange, onDirty],
  );

  const updateInstruction = (instruction: string) => {
    commit({
      ...draft,
      instruction: instruction.length > 0 ? instruction : undefined,
    });
  };

  const updateItemContent = (id: string, content: RichContent) => {
    commit({
      ...draft,
      items: draft.items.map((item) =>
        item.id === id ? { ...item, content } : item,
      ),
    });
  };

  const addItem = () => {
    if (draft.items.length >= maxItems) return;
    commit({ ...draft, items: [...draft.items, emptyItem()] });
  };

  const deleteItem = (id: string) => {
    commit({ ...draft, items: draft.items.filter((i) => i.id !== id) });
  };

  const duplicateItem = (id: string) => {
    if (draft.items.length >= maxItems) return;
    const index = draft.items.findIndex((i) => i.id === id);
    if (index < 0) return;
    const source = draft.items[index]!;
    const copy: ListItem = {
      id: newItemId(),
      content: { ...source.content },
    };
    const items = [...draft.items];
    items.splice(index + 1, 0, copy);
    commit({ ...draft, items });
  };

  const moveItem = (id: string, direction: -1 | 1) => {
    const index = draft.items.findIndex((i) => i.id === id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= draft.items.length) return;
    const items = [...draft.items];
    const [row] = items.splice(index, 1);
    items.splice(target, 0, row!);
    commit({ ...draft, items });
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
    const room = maxItems - draft.items.length;
    const accepted = lines.slice(0, Math.max(0, room));
    const newItems: ListItem[] = accepted.map((text) => ({
      id: newItemId(),
      content: { text },
    }));
    commit({ ...draft, items: [...draft.items, ...newItems] });
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
      data-template-editor="wheel"
    >
      <p className="text-sm text-[var(--fw-color-muted-strong)]">{helper}</p>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`${baseId}-instruction`}
          className="text-sm font-semibold"
        >
          {WHEEL_COPY.instructionLabel}
        </label>
        <input
          id={`${baseId}-instruction`}
          type="text"
          value={draft.instruction ?? ""}
          onChange={(e) => updateInstruction(e.target.value)}
          maxLength={2000}
          className="min-h-[var(--fw-touch-min)] rounded-[var(--fw-radius-sm)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fw-color-focus-ring)]"
        />
      </div>

      {(errorMessages.length > 0 || warningMessages.length > 0) && (
        <div className="flex flex-col gap-1" role="status">
          {errorMessages.map((msg) => (
            <p
              key={`e-${msg}`}
              className="text-sm text-[var(--fw-color-danger-text)]"
            >
              {msg}
            </p>
          ))}
          {warningMessages.map((msg) => (
            <p
              key={`w-${msg}`}
              className="text-sm text-[var(--fw-color-warning)]"
            >
              {msg}
            </p>
          ))}
        </div>
      )}

      <ul className="flex list-none flex-col gap-3 p-0" aria-label="Wheel items">
        {draft.items.map((item, index) => (
          <li
            key={item.id}
            className="rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] p-3"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[var(--fw-color-muted-strong)]">
                {WHEEL_COPY.itemLabel} {index + 1}
              </span>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant="ghost"
                  className="min-h-9 px-2 text-sm"
                  onClick={() => moveItem(item.id, -1)}
                  disabled={index === 0}
                  aria-label={WHEEL_COPY.moveUp}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-9 px-2 text-sm"
                  onClick={() => moveItem(item.id, 1)}
                  disabled={index === draft.items.length - 1}
                  aria-label={WHEEL_COPY.moveDown}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-9 px-2 text-sm"
                  onClick={() => duplicateItem(item.id)}
                  disabled={draft.items.length >= maxItems}
                >
                  {WHEEL_COPY.duplicate}
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-9 px-2 text-sm text-[var(--fw-color-danger-text)]"
                  onClick={() => deleteItem(item.id)}
                >
                  {WHEEL_COPY.delete}
                </Button>
              </div>
            </div>

            {RichContentField ? (
              // Shared field from Workstream 02 when available
              (RichContentField({
                value: item.content,
                onChange: (next) => updateItemContent(item.id, next),
                label: `${WHEEL_COPY.itemLabel} ${index + 1}`,
              }) as ReactElement)
            ) : (
              <div className="flex flex-col gap-2">
                <label className="sr-only" htmlFor={`${baseId}-item-${item.id}`}>
                  {WHEEL_COPY.itemLabel} {index + 1} text
                </label>
                <input
                  id={`${baseId}-item-${item.id}`}
                  type="text"
                  value={item.content.text ?? ""}
                  onChange={(e) =>
                    updateItemContent(item.id, {
                      ...item.content,
                      text: e.target.value,
                    })
                  }
                  maxLength={2000}
                  className="min-h-[var(--fw-touch-min)] w-full rounded-[var(--fw-radius-sm)] border border-[var(--fw-color-border)] px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fw-color-focus-ring)]"
                  placeholder="Text"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    className="min-h-9 text-sm"
                    onClick={() =>
                      openMediaModal({
                        kind: "item",
                        itemId: item.id,
                        channel: "image",
                      })
                    }
                  >
                    {item.content.imageAssetId ? "Replace image" : "Add image"}
                  </Button>
                  {item.content.imageAssetId ? (
                    <span className="text-xs text-[var(--fw-color-muted)]">
                      Image attached
                      {item.content.imageAlt
                        ? ` · ${item.content.imageAlt}`
                        : ""}
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {draft.items.length > WHEEL_WARN_ITEM_COUNT ? (
        <p className="text-sm text-[var(--fw-color-warning)]" role="status">
          {WHEEL_COPY.warnMany}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={addItem}
          disabled={draft.items.length >= maxItems}
        >
          {WHEEL_COPY.addItem}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setBulkOpen((v) => !v)}
          disabled={draft.items.length >= maxItems}
        >
          {WHEEL_COPY.bulkPaste}
        </Button>
      </div>

      {bulkOpen ? (
        <div className="flex flex-col gap-2 rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface-sunken)] p-3">
          <p className="text-sm text-[var(--fw-color-muted-strong)]">
            {WHEEL_COPY.bulkHelp}
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={6}
            placeholder={WHEEL_COPY.bulkPastePlaceholder}
            className="w-full rounded-[var(--fw-radius-sm)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] p-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fw-color-focus-ring)]"
            aria-label={WHEEL_COPY.bulkPaste}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={applyBulkPaste}>
              {WHEEL_COPY.applyBulk}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setBulkOpen(false);
                setBulkText("");
              }}
            >
              {WHEEL_COPY.cancelBulk}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
