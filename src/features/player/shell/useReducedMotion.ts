"use client";

import { useEffect, useState } from "react";

/**
 * Combines explicit prop with prefers-reduced-motion media query.
 */
export function useReducedMotion(override?: boolean): boolean {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefers(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (override !== undefined) return override;
  return prefers;
}
