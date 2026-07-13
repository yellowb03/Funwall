"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressStrip } from "@/design-system/ProgressStrip";
import { Panel } from "@/design-system/Panel";
import {
  filterTemplates,
  type TemplateCatalogEntry,
  type TemplateSortMode,
} from "@/features/editor/template-catalog";

export interface TemplatePickerProps {
  /** Optional override for tests. Defaults to full catalog. */
  entries?: TemplateCatalogEntry[];
  /** Registered template keys (for subtle ready badge). */
  registeredKeys?: string[];
}

const STEPS = [
  { id: "pick", label: "Pick a template" },
  { id: "content", label: "Enter content" },
  { id: "play", label: "Play" },
];

/**
 * Six-card template picker with search, recommended/alphabetical sort,
 * and keyboard-selectable cards.
 */
export function TemplatePicker({
  entries,
  registeredKeys,
}: TemplatePickerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TemplateSortMode>("recommended");

  const visible = useMemo(() => {
    if (entries) {
      const q = query.trim().toLowerCase();
      let list = [...entries];
      if (sort === "alphabetical") {
        list.sort((a, b) =>
          a.displayName.localeCompare(b.displayName, "en", {
            sensitivity: "base",
          }),
        );
      } else {
        list.sort((a, b) => a.recommendedOrder - b.recommendedOrder);
      }
      if (q) {
        list = list.filter(
          (e) =>
            e.displayName.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            e.shortLabel.toLowerCase().includes(q),
        );
      }
      return list;
    }
    return filterTemplates(query, sort);
  }, [entries, query, sort]);

  const registered = useMemo(
    () => new Set(registeredKeys ?? []),
    [registeredKeys],
  );

  function selectTemplate(key: string) {
    router.push(`/activities/new/${key}`);
  }

  function onCardKeyDown(
    event: React.KeyboardEvent<HTMLElement>,
    key: string,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectTemplate(key);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <ProgressStrip activeIndex={0} steps={STEPS} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Pick a template</h1>
          <p className="text-sm text-[var(--fw-color-muted)]">
            Choose how students will play. You can switch templates later when
            content is compatible.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <label className="sr-only" htmlFor="template-search">
            Search templates
          </label>
          <input
            id="template-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates"
            className={[
              "w-full min-w-[220px] rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)]",
              "bg-[var(--fw-color-surface)] px-3 py-2 text-sm sm:w-64",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-[var(--fw-color-focus-ring)]",
            ].join(" ")}
          />
          <div
            className="inline-flex rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] p-0.5 text-sm"
            role="group"
            aria-label="Sort templates"
          >
            <SortButton
              active={sort === "recommended"}
              onClick={() => setSort("recommended")}
            >
              Recommended
            </SortButton>
            <SortButton
              active={sort === "alphabetical"}
              onClick={() => setSort("alphabetical")}
            >
              Alphabetical
            </SortButton>
          </div>
        </div>
      </header>

      {visible.length === 0 ? (
        <p className="text-sm text-[var(--fw-color-muted-strong)]" role="status">
          No templates match your search.
        </p>
      ) : (
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="template-grid"
        >
          {visible.map((entry) => {
            const isRegistered = registered.has(entry.key);
            return (
              <li key={entry.key}>
                <Panel
                  as="article"
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${entry.displayName}`}
                  data-template-key={entry.key}
                  onClick={() => selectTemplate(entry.key)}
                  onKeyDown={(e) => onCardKeyDown(e, entry.key)}
                  className={[
                    "h-full cursor-pointer transition-shadow",
                    "hover:border-[var(--fw-color-primary-light)] hover:shadow-[var(--fw-shadow-card)]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                    "focus-visible:outline-[var(--fw-color-focus-ring)]",
                  ].join(" ")}
                >
                  <div
                    className="mb-3 flex h-28 items-center justify-center rounded-[var(--fw-radius-sm)] bg-[var(--fw-color-tile-pale)]"
                    aria-hidden
                  >
                    <TemplateGlyph name={entry.shortLabel} />
                  </div>
                  <h2 className="text-lg font-semibold">{entry.displayName}</h2>
                  <p className="mt-1 text-sm text-[var(--fw-color-muted)]">
                    {entry.description}
                  </p>
                  {isRegistered ? (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--fw-color-success)]">
                      Ready
                    </p>
                  ) : null}
                </Panel>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-[var(--fw-radius-sm)] px-3 py-1.5 font-semibold",
        active
          ? "bg-[var(--fw-color-primary-subtle)] text-[var(--fw-color-primary)]"
          : "text-[var(--fw-color-muted-strong)] hover:text-[var(--fw-color-ink)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function TemplateGlyph({ name }: { name: string }) {
  return (
    <span className="text-sm font-bold uppercase tracking-wide text-[var(--fw-color-primary)]">
      {name.slice(0, 1)}
    </span>
  );
}
