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
    "bg-[var(--fw-color-primary)] text-white hover:bg-[var(--fw-color-primary-hover)]",
  secondary:
    "bg-[var(--fw-color-surface)] text-[var(--fw-color-ink)] border border-[var(--fw-color-border)] hover:border-[var(--fw-color-border-strong)]",
  ghost:
    "bg-transparent text-[var(--fw-color-link)] hover:text-[var(--fw-color-link-hover)]",
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
        "transition-transform duration-[var(--fw-motion-instant)] ease-[var(--fw-ease-out)]",
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
