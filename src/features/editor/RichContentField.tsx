"use client";

import type { RichContent, ImageFit } from "@/domain/rich-content";
import { Button } from "@/design-system/Button";
import type { MediaAsset } from "@/features/media/types";

export interface RichContentFieldProps {
  value: RichContent;
  onChange: (next: RichContent) => void;
  label?: string;
  /** Multiline text when true. */
  multiline?: boolean;
  placeholder?: string;
  /** Resolve stored asset id to a displayable thumbnail URL. */
  resolveAsset?: (assetId: string) => MediaAsset | null;
  onOpenMedia?: () => void;
  error?: string;
  id?: string;
}

/**
 * Plain-text + optional image rich content field.
 * Never accepts arbitrary HTML.
 */
export function RichContentField({
  value,
  onChange,
  label,
  multiline = false,
  placeholder,
  resolveAsset,
  onOpenMedia,
  error,
  id,
}: RichContentFieldProps) {
  const fieldId = id ?? "rich-content";
  const asset =
    value.imageAssetId && resolveAsset
      ? resolveAsset(value.imageAssetId)
      : null;

  function setText(text: string) {
    onChange({ ...value, text });
  }

  function removeImage() {
    const next: RichContent = { ...value };
    delete next.imageAssetId;
    delete next.imageAlt;
    delete next.imageFit;
    delete next.focalPoint;
    onChange(next);
  }

  function setAlt(imageAlt: string) {
    onChange({ ...value, imageAlt });
  }

  function setFit(imageFit: ImageFit) {
    onChange({ ...value, imageFit });
  }

  const InputTag = multiline ? "textarea" : "input";

  return (
    <div className="space-y-2" data-testid="rich-content-field">
      {label ? (
        <label
          htmlFor={fieldId}
          className="text-sm font-semibold text-[var(--fw-color-ink-secondary)]"
        >
          {label}
        </label>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <InputTag
          id={fieldId}
          value={value.text ?? ""}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          maxLength={2000}
          rows={multiline ? 3 : undefined}
          className={[
            "min-w-0 flex-1 rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)]",
            "bg-[var(--fw-color-surface)] px-3 py-2 text-base",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            "focus-visible:outline-[var(--fw-color-focus-ring)]",
            error ? "border-[var(--fw-color-coral)]" : "",
          ].join(" ")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...(multiline ? {} : { type: "text" })}
        />

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {value.imageAssetId ? (
            <>
              <div className="relative h-14 w-14 overflow-hidden rounded-[var(--fw-radius-sm)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface-sunken)]">
                {asset?.thumbnailUrl || asset?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.thumbnailUrl || asset.url}
                    alt={value.imageAlt || asset.defaultAlt || ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-[10px] text-[var(--fw-color-muted)]">
                    img
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                className="min-h-0 px-2 py-1 text-sm"
                onClick={onOpenMedia}
              >
                Replace image
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="min-h-0 px-2 py-1 text-sm"
                onClick={removeImage}
              >
                Remove image
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="secondary"
              className="min-h-0 px-2 py-1 text-sm"
              onClick={onOpenMedia}
              disabled={!onOpenMedia}
            >
              Add image
            </Button>
          )}
        </div>
      </div>

      {value.imageAssetId ? (
        <div className="grid gap-2 rounded-[var(--fw-radius-md)] bg-[var(--fw-color-surface-sunken)] p-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor={`${fieldId}-alt`}
              className="text-xs font-semibold text-[var(--fw-color-muted-strong)]"
            >
              Alt text
            </label>
            <input
              id={`${fieldId}-alt`}
              type="text"
              value={value.imageAlt ?? ""}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe what is in the image"
              maxLength={500}
              className="w-full rounded-[var(--fw-radius-sm)] border border-[var(--fw-color-border)] px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fw-color-focus-ring)]"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--fw-color-muted-strong)]">
              Fit
            </span>
            <div className="flex gap-2">
              {(["contain", "cover"] as const).map((fit) => (
                <button
                  key={fit}
                  type="button"
                  aria-pressed={(value.imageFit ?? "contain") === fit}
                  onClick={() => setFit(fit)}
                  className={[
                    "rounded-[var(--fw-radius-sm)] border px-3 py-1.5 text-sm font-semibold capitalize",
                    (value.imageFit ?? "contain") === fit
                      ? "border-[var(--fw-color-primary)] bg-[var(--fw-color-primary-subtle)] text-[var(--fw-color-primary)]"
                      : "border-[var(--fw-color-border)] text-[var(--fw-color-ink-secondary)]",
                  ].join(" ")}
                >
                  {fit}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <p
          id={`${fieldId}-error`}
          className="text-sm text-[var(--fw-color-danger-text)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
