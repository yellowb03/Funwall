"use client";

import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { playUiPress } from "@/services/audio/ui-press";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  /** Soft click cue (default true). Set false for pure visual controls. */
  sound?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--fw-color-primary)] text-white shadow-[0_6px_16px_rgba(7,139,209,0.2)] hover:-translate-y-0.5 hover:bg-[var(--fw-color-primary-hover)] hover:shadow-[0_9px_20px_rgba(7,139,209,0.24)]",
  secondary:
    "bg-[var(--fw-color-surface)] text-[var(--fw-color-ink)] border border-[var(--fw-color-border)] hover:-translate-y-0.5 hover:border-[var(--fw-color-border-strong)] hover:shadow-[0_5px_14px_rgba(37,91,114,0.09)]",
  ghost:
    "bg-transparent text-[var(--fw-color-link)] hover:bg-[var(--fw-color-primary-subtle)] hover:text-[var(--fw-color-link-hover)]",
  danger:
    "bg-[var(--fw-color-coral)] text-white hover:bg-[var(--fw-color-coral-hover)]",
};

/**
 * Shared Funwall button shell. Keep rectangular with modest radius (not pills).
 * Plays a soft premium UI press cue after the first user gesture (muted-aware).
 */
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  sound = true,
  onClick,
  disabled,
  ...rest
}: ButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (sound && !disabled) {
      const intensity =
        variant === "primary" ? 0.6 : variant === "danger" ? 0.5 : 0.45;
      void playUiPress(intensity);
    }
    onClick?.(event);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={[
        "inline-flex min-h-[var(--fw-touch-min)] items-center justify-center gap-2 px-4 py-2",
        "rounded-[var(--fw-radius-md)] text-base font-semibold",
        "transition-all duration-[var(--fw-motion-fast)] ease-[var(--fw-ease-out)]",
        "active:scale-[0.98] motion-reduce:active:scale-100 motion-reduce:transition-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fw-color-focus-ring)]",
        "disabled:cursor-not-allowed disabled:bg-[var(--fw-color-disabled-bg)] disabled:text-[var(--fw-color-disabled-fg)]",
        "disabled:active:scale-100",
        variantClass[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
