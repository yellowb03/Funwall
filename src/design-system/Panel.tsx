import type { HTMLAttributes, ReactNode } from "react";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  as?: "div" | "section" | "article";
}

/** White content panel with hairline border — owner UI surface. */
export function Panel({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: PanelProps) {
  return (
    <Tag
      className={[
        "rounded-[var(--fw-radius-lg)] border border-[var(--fw-color-border)]",
        "bg-[var(--fw-color-surface)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.9)]",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </Tag>
  );
}
