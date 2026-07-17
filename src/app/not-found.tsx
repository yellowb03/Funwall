import Link from "next/link";
import { Button } from "@/design-system/Button";
import { FunwallBrand } from "@/design-system/FunwallBrand";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-5 py-12 text-center">
      <div className="mx-auto"><FunwallBrand /></div>
      <p className="fw-eyebrow mt-12">404 · page not found</p>
      <h1 className="fw-page-title mt-3 text-5xl">This activity wandered off.</h1>
      <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-[var(--fw-color-ink-secondary)]">
        The link may be old, disabled, or typed incorrectly. Head back to your
        activity shelf and choose another one.
      </p>
      <div className="mt-8"><Link href="/activities"><Button variant="primary">Go to my activities</Button></Link></div>
    </main>
  );
}
