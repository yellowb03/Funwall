"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Button } from "@/design-system/Button";
import type {
  ImageFit,
  MediaAsset,
  MediaInsertion,
  MediaModalTab,
  MediaSearchResponse,
  MediaSearchResult,
} from "@/features/media/types";

export interface MediaModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (insertion: MediaInsertion) => void;
  /** Suggested search query from the field text. */
  suggestedQuery?: string;
  /** Return focus to this element on close. */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

type Stage = "browse" | "confirm";

/**
 * In-app image modal: Search / Upload / My images.
 * Works against mock/fixture providers when Openverse keys are absent.
 */
export function MediaModal({
  open,
  onClose,
  onInsert,
  suggestedQuery = "",
  returnFocusRef,
}: MediaModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<MediaModalTab>("search");
  const [query, setQuery] = useState(suggestedQuery);
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [library, setLibrary] = useState<MediaAsset[]>([]);
  const [stage, setStage] = useState<Stage>("browse");
  const [pending, setPending] = useState<MediaSearchResult | MediaAsset | null>(
    null,
  );
  const [alt, setAlt] = useState("");
  const [fit, setFit] = useState<ImageFit>("contain");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadLibrary = useCallback(async () => {
    try {
      const res = await fetch("/api/media/library");
      if (!res.ok) return;
      const data = (await res.json()) as { assets: MediaAsset[] };
      setLibrary(data.assets);
    } catch {
      // library is best-effort in local mode
    }
  }, []);

  const runSearch = useCallback(
    async (searchQuery: string, event?: FormEvent) => {
      event?.preventDefault();
      setLoading(true);
      setError(null);
      setWarning(null);
      try {
        const params = new URLSearchParams({
          q: searchQuery.trim(),
          page: "1",
          pageSize: "24",
        });
        const res = await fetch(`/api/media/search?${params}`);
        if (!res.ok) {
          throw new Error("search failed");
        }
        const data = (await res.json()) as MediaSearchResponse;
        setResults(data.results);
        setWarning(data.warning ?? null);
      } catch {
        setResults([]);
        setError(
          "Image search is unavailable right now. Try upload or My images.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    setQuery(suggestedQuery);
    setTab("search");
    setStage("browse");
    setPending(null);
    setError(null);
    setUploadError(null);
    // Immediately show choosable images (live Openverse or samples).
    void runSearch(suggestedQuery);
  }, [open, suggestedQuery, runSearch]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    node?.querySelector<HTMLElement>("button, input, [tabindex]")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab" && node) {
        trapFocus(event, node);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      (returnFocusRef?.current ?? previous)?.focus?.();
    };
  }, [open, onClose, returnFocusRef]);

  useEffect(() => {
    if (open && tab === "library") {
      void loadLibrary();
    }
  }, [open, tab, loadLibrary]);

  function beginConfirm(item: MediaSearchResult | MediaAsset) {
    setPending(item);
    setAlt(
      "altCandidate" in item
        ? item.altCandidate
        : item.defaultAlt || item.title,
    );
    setFit("contain");
    setStage("confirm");
  }

  async function confirmUse() {
    if (!pending) return;
    setUploading(true);
    setUploadError(null);
    try {
      let asset: MediaAsset;
      if ("providerAssetId" in pending && "fullUrl" in pending) {
        const res = await fetch("/api/media/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: pending.provider,
            providerAssetId: pending.providerAssetId,
            thumbnailUrl: pending.thumbnailUrl,
            fullUrl: pending.fullUrl,
            width: pending.width,
            height: pending.height,
            title: pending.title,
            alt: alt.trim() || pending.title,
            creatorName: pending.creatorName,
            creatorUrl: pending.creatorUrl,
            sourcePageUrl: pending.sourcePageUrl,
            license: pending.license,
            licenseUrl: pending.licenseUrl,
            attributionText: pending.attributionText,
            imageFit: fit,
          }),
        });
        if (!res.ok) {
          throw new Error("select failed");
        }
        const data = (await res.json()) as { asset: MediaAsset };
        asset = data.asset;
      } else {
        asset = pending as MediaAsset;
      }

      const resolvedAlt =
        alt.trim() ||
        ("altCandidate" in pending
          ? pending.altCandidate
          : (pending as MediaAsset).defaultAlt) ||
        pending.title ||
        "Image";

      onInsert({
        assetId: asset.id,
        alt: resolvedAlt,
        imageFit: fit,
        asset,
      });
      onClose();
    } catch {
      setUploadError("Could not use that image. Try another, or upload your own.");
    } finally {
      setUploading(false);
    }
  }

  async function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { asset?: MediaAsset; error?: string };
      if (!res.ok || !data.asset) {
        throw new Error(data.error ?? "upload failed");
      }
      beginConfirm(data.asset);
      void loadLibrary();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "That file could not be uploaded.",
      );
    } finally {
      setUploading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[var(--fw-color-overlay)]"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--fw-radius-lg)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] shadow-lg"
      >
        <header className="flex items-center justify-between border-b border-[var(--fw-color-border)] px-4 py-3">
          <h2 id={titleId} className="text-lg font-bold">
            Add image
          </h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </header>

        {stage === "browse" ? (
          <>
            <div
              className="flex gap-1 border-b border-[var(--fw-color-border)] px-2"
              role="tablist"
              aria-label="Media sources"
            >
              {(
                [
                  ["search", "Search"],
                  ["upload", "Upload"],
                  ["library", "My images"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={[
                    "px-4 py-2 text-sm font-semibold",
                    tab === id
                      ? "border-b-2 border-[var(--fw-color-primary)] text-[var(--fw-color-primary)]"
                      : "text-[var(--fw-color-muted-strong)]",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {tab === "search" ? (
                <div className="space-y-4">
                  <form
                    className="flex flex-wrap gap-2"
                    onSubmit={(event) => void runSearch(query, event)}
                  >
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search free images"
                      className="min-w-[200px] flex-1 rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fw-color-focus-ring)]"
                    />
                    <Button type="submit" variant="primary" disabled={loading}>
                      {loading ? "Searching…" : "Search"}
                    </Button>
                  </form>
                  <p className="text-xs text-[var(--fw-color-muted)]">
                    Click any image to choose it
                    {suggestedQuery ? ` · Suggested: ${suggestedQuery}` : ""}.
                  </p>
                  {warning ? (
                    <p className="text-sm text-[var(--fw-color-muted-strong)]" role="status">
                      {warning}
                    </p>
                  ) : null}
                  {error ? (
                    <p className="text-sm text-[var(--fw-color-danger-text)]" role="alert">
                      {error}
                    </p>
                  ) : null}
                  {loading && results.length === 0 ? (
                    <p className="text-sm text-[var(--fw-color-muted)]" role="status">
                      Loading images…
                    </p>
                  ) : null}
                  {!loading && results.length === 0 && !error ? (
                    <p className="text-sm text-[var(--fw-color-muted)]">
                      No images found. Try another word, or use Upload.
                    </p>
                  ) : null}
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {results.map((item) => (
                      <li key={`${item.provider}-${item.providerAssetId}`}>
                        <button
                          type="button"
                          onClick={() => beginConfirm(item)}
                          aria-label={`Use image: ${item.title}`}
                          className="group flex w-full flex-col overflow-hidden rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] text-left hover:border-[var(--fw-color-primary-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fw-color-focus-ring)]"
                        >
                          <div className="aspect-[4/3] bg-[var(--fw-color-tile-pale)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.thumbnailUrl || item.fullUrl}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <span className="truncate px-2 py-1.5 text-xs font-medium text-[var(--fw-color-ink)]">
                            {item.title}
                          </span>
                          <span className="truncate px-2 pb-1.5 text-[10px] text-[var(--fw-color-muted-strong)]">
                            {item.creatorName ?? "Unknown"} · {item.license}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {tab === "upload" ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--fw-color-muted-strong)]">
                    JPEG, PNG, or WebP up to 10 MB.
                  </p>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--fw-radius-lg)] border-2 border-dashed border-[var(--fw-color-border)] bg-[var(--fw-color-surface-sunken)] px-6 py-10 text-center">
                    <span className="font-semibold">
                      Drop an image here or browse
                    </span>
                    <span className="text-sm text-[var(--fw-color-link)]">
                      Browse files
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={uploading}
                      onChange={(e) => onFileChange(e.target.files)}
                    />
                  </label>
                  {uploading ? (
                    <p className="text-sm" role="status">
                      Uploading…
                    </p>
                  ) : null}
                  {uploadError ? (
                    <p className="text-sm text-[var(--fw-color-danger-text)]" role="alert">
                      {uploadError}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {tab === "library" ? (
                <div className="space-y-3">
                  {library.length === 0 ? (
                    <p className="text-sm text-[var(--fw-color-muted)]">
                      No saved images yet. Search or upload to build your
                      library.
                    </p>
                  ) : (
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {library.map((asset) => (
                        <li key={asset.id}>
                          <button
                            type="button"
                            onClick={() => beginConfirm(asset)}
                            className="w-full overflow-hidden rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] text-left hover:border-[var(--fw-color-primary-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fw-color-focus-ring)]"
                          >
                            <div className="aspect-[4/3] bg-[var(--fw-color-tile-pale)]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={asset.thumbnailUrl || asset.url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="block truncate px-2 py-1 text-xs">
                              {asset.title}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="space-y-4 p-4">
            <div className="mx-auto max-w-md overflow-hidden rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface-sunken)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  pending && "fullUrl" in pending
                    ? pending.fullUrl
                    : (pending as MediaAsset | null)?.url ?? ""
                }
                alt=""
                className={[
                  "mx-auto max-h-64 w-full",
                  fit === "cover" ? "object-cover" : "object-contain",
                ].join(" ")}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="media-alt"
                className="text-sm font-semibold"
              >
                Alt text
              </label>
              <input
                id="media-alt"
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe what is in the image"
                className="w-full rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fw-color-focus-ring)]"
              />
            </div>
            <div className="flex gap-2">
              {(["contain", "cover"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={fit === option}
                  onClick={() => setFit(option)}
                  className={[
                    "rounded-[var(--fw-radius-sm)] border px-3 py-1.5 text-sm font-semibold capitalize",
                    fit === option
                      ? "border-[var(--fw-color-primary)] bg-[var(--fw-color-primary-subtle)] text-[var(--fw-color-primary)]"
                      : "border-[var(--fw-color-border)]",
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>
            {uploadError ? (
              <p className="text-sm text-[var(--fw-color-danger-text)]" role="alert">
                {uploadError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setStage("browse");
                  setPending(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => void confirmUse()}
                disabled={uploading}
              >
                Use image
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function trapFocus(event: KeyboardEvent, container: HTMLElement) {
  const focusable = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  if (focusable.length === 0) return;
  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
