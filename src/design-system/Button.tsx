import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
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
 */
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex min-h-[var(--fw-touch-min)] items-center justify-center gap-2 px-4 py-2",
        "rounded-[var(--fw-radius-md)] text-base font-semibold",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fw-color-focus-ring)]",
        "disabled:cursor-not-allowed disabled:bg-[var(--fw-color-disabled-bg)] disabled:text-[var(--fw-color-disabled-fg)]",
        variantClass[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
