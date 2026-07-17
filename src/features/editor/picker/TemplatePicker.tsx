"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProgressStrip } from "@/design-system/ProgressStrip";
import { TemplateArtwork } from "@/design-system/TemplateArtwork";
import { FunwallBrand } from "@/design-system/FunwallBrand";
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
    <main id="main-content" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 sm:px-8">
      <nav className="flex items-center justify-between border-b border-[var(--fw-color-border)]/70 py-5">
        <FunwallBrand href="/activities" />
        <Link href="/activities" className="text-sm font-semibold text-[var(--fw-color-link)]">Cancel</Link>
      </nav>

      <div className="pt-7"><ProgressStrip activeIndex={0} steps={STEPS} /></div>

      <header className="flex flex-col gap-5 pb-7 pt-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="fw-eyebrow">Step one</p>
          <h1 className="fw-page-title mt-2 text-4xl sm:text-5xl">Pick a template</h1>
          <p className="mt-3 max-w-xl text-[var(--fw-color-muted-strong)]">
            Start with the kind of interaction you want. Your content remains
            easy to edit later.
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
              "min-h-11 w-full min-w-[220px] rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)]",
              "bg-[var(--fw-color-surface)] px-3 py-2 text-sm shadow-sm sm:w-72",
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
            const isRegistered = registeredKeys
              ? registered.has(entry.key)
              : true;
            return (
              <li key={entry.key}>
                <button
                  type="button"
                  aria-label={`Select ${entry.displayName}`}
                  aria-disabled={!isRegistered}
                  data-template-key={entry.key}
                  onClick={() => {
                    if (isRegistered) selectTemplate(entry.key);
                  }}
                  onKeyDown={(e) => {
                    if (isRegistered) onCardKeyDown(e, entry.key);
                  }}
                  className={[
                    "group flex h-full w-full flex-col overflow-hidden rounded-[var(--fw-radius-lg)] border bg-white text-left",
                    isRegistered
                      ? "fw-card-hover cursor-pointer border-[var(--fw-color-border)]"
                      : "cursor-not-allowed border-[var(--fw-color-border)] opacity-55 grayscale-[.15]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                    "focus-visible:outline-[var(--fw-color-focus-ring)]",
                  ].join(" ")}
                >
                  <div className="w-full p-3 pb-0">
                    <TemplateArtwork templateKey={entry.key} className="w-full" />
                  </div>
                  <div className="flex flex-1 flex-col p-4 pt-3">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-bold tracking-[-.025em]">{entry.displayName}</h2>
                      <span className={`text-[10px] font-bold uppercase tracking-[.1em] ${isRegistered ? "text-[var(--fw-color-success)]" : "text-[var(--fw-color-muted)]"}`}>
                        {isRegistered ? "ready" : "in progress"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-[var(--fw-color-muted-strong)]">{entry.description}</p>
                    <span className={`mt-auto pt-4 text-sm font-bold ${isRegistered ? "text-[var(--fw-color-link)]" : "text-[var(--fw-color-muted)]"}`}>
                      {isRegistered ? "Use this template →" : "Not available yet"}
                    </span>
                  </div>
                </button>
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

