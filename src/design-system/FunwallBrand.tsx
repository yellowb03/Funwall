import Link from "next/link";

export function FunwallBrand({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 rounded-[var(--fw-radius-md)] font-[family-name:var(--fw-font-heading)] text-lg font-bold tracking-[-0.035em] text-[var(--fw-color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--fw-color-focus-ring)]"
      aria-label="Funwall home"
    >
      <span
        className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[12px] bg-[var(--fw-color-ink)] text-white shadow-[0_5px_14px_rgba(16,42,58,0.18)]"
        aria-hidden="true"
      >
        <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-[var(--fw-color-coral)]" />
        <span className="relative text-base font-black">F</span>
      </span>
      <span>funwall</span>
    </Link>
  );
}
