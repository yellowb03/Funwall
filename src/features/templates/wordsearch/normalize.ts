/**
 * Unicode-aware word normalization for Wordsearch grid placement.
 *
 * v1 Latin alphabet policy (domain playable requires A–Z):
 * - NFKC normalize
 * - Optionally fold diacritics (NFD + strip combining marks)
 * - Strip spaces, hyphens, apostrophes, soft hyphens for placement
 * - Case map with Unicode uppercase (not locale-dependent Turkish I tricks)
 * - Reject unsupported grapheme clusters (non-Latin scripts, digits, symbols)
 *
 * Display words are never mutated here — only placement tokens are produced.
 *
 * @see FUNWALL_MASTER_PLAN.md §8.4
 */

import type { WordsearchDiacriticPolicy } from "@/features/templates/wordsearch/settings";

/** Letters allowed on the v1 Latin grid after normalization. */
const LATIN_LETTER_RE = /^[A-Z]$/;

/** Combining marks (Mn) after NFD. */
const COMBINING_MARKS_RE = /\p{M}+/gu;

/**
 * Placement separators removed from the grid form only.
 * Includes space, hyphen-minus, non-breaking hyphen, en/em dash,
 * soft hyphen, apostrophe / right single quotation mark.
 */
const PLACEMENT_STRIP_RE = /[\s\u00AD\u2010\u2011\u2012\u2013\u2014\-''']/gu;

export type NormalizeErrorCode =
  | "empty"
  | "too_short"
  | "too_long"
  | "unsupported_charset";

export interface NormalizeResult {
  /** Owner display form (trimmed). */
  displayWord: string;
  /** Grid placement token: uppercase A–Z only, or empty when invalid. */
  normalizedWord: string;
  ok: boolean;
  error?: NormalizeErrorCode;
  message?: string;
}

export interface NormalizeOptions {
  diacriticPolicy?: WordsearchDiacriticPolicy;
  /** Maximum normalized length (default 20 — fits max grid). */
  maxLength?: number;
  /** Minimum normalized length (default 2). */
  minLength?: number;
}

const DEFAULT_MAX = 20;
const DEFAULT_MIN = 2;

/**
 * Fold Latin diacritics to base letters via NFD + strip marks.
 * Leaves non-decomposing characters untouched for later rejection.
 */
export function foldDiacritics(input: string): string {
  return input.normalize("NFD").replace(COMBINING_MARKS_RE, "");
}

/**
 * Unicode uppercase without locale-sensitive Turkish mapping surprises.
 * Uses String#toUpperCase which is Unicode default case conversion.
 */
export function toGridCase(input: string): string {
  return input.toUpperCase();
}

/**
 * Normalize a display word for grid placement.
 * Pure — no DOM, no RNG.
 */
export function normalizeWord(
  displayRaw: string,
  options: NormalizeOptions = {},
): NormalizeResult {
  const maxLength = options.maxLength ?? DEFAULT_MAX;
  const minLength = options.minLength ?? DEFAULT_MIN;
  const policy = options.diacriticPolicy ?? "fold";

  const displayWord = (displayRaw ?? "").normalize("NFKC").trim();
  if (!displayWord) {
    return {
      displayWord: "",
      normalizedWord: "",
      ok: false,
      error: "empty",
      message: "Enter a word.",
    };
  }

  // Placement: strip separators first so "ice-cream" → "icecream"
  let working = displayWord.replace(PLACEMENT_STRIP_RE, "");

  if (policy === "fold" || policy === "retain") {
    // Domain playable schema is A–Z only. Fold for placement in both modes;
    // retain only affects documentation/owner expectation that display keeps accents.
    // When retain is requested and folding changes the string, we still fold so
    // the pack remains playable under wordsearch.v1.
    working = foldDiacritics(working);
  }

  working = toGridCase(working);

  // Keep only A–Z code units (BMP Latin). Multi-codepoint leftovers fail.
  const letters: string[] = [];
  for (const ch of working) {
    if (LATIN_LETTER_RE.test(ch)) {
      letters.push(ch);
    } else if (ch.length > 0) {
      // Non-Latin letter, digit, symbol, or leftover diacritic base
      return {
        displayWord,
        normalizedWord: "",
        ok: false,
        error: "unsupported_charset",
        message: `“${displayWord}” has characters this grid cannot use.`,
      };
    }
  }

  const normalizedWord = letters.join("");

  if (normalizedWord.length < minLength) {
    return {
      displayWord,
      normalizedWord,
      ok: false,
      error: "too_short",
      message: `“${displayWord}” needs at least ${minLength} letters for the grid.`,
    };
  }

  if (normalizedWord.length > maxLength) {
    return {
      displayWord,
      normalizedWord,
      ok: false,
      error: "too_long",
      message: `“${displayWord}” is too long for the grid.`,
    };
  }

  return {
    displayWord,
    normalizedWord,
    ok: true,
  };
}

/**
 * Ensure a stored normalizedWord is valid for placement, or recompute from display.
 */
export function resolveNormalizedWord(
  displayWord: string,
  storedNormalized: string | undefined,
  options: NormalizeOptions = {},
): NormalizeResult {
  const fromDisplay = normalizeWord(displayWord, options);
  if (!storedNormalized || !storedNormalized.trim()) {
    return fromDisplay;
  }

  // Prefer recomputing from display so editor preview stays authoritative.
  if (fromDisplay.ok) {
    return fromDisplay;
  }

  // Fall back to validating stored token
  const stored = storedNormalized.trim().toUpperCase();
  if (/^[A-Z]+$/.test(stored)) {
    const maxLength = options.maxLength ?? DEFAULT_MAX;
    const minLength = options.minLength ?? DEFAULT_MIN;
    if (stored.length < minLength) {
      return {
        displayWord: displayWord.trim(),
        normalizedWord: stored,
        ok: false,
        error: "too_short",
      };
    }
    if (stored.length > maxLength) {
      return {
        displayWord: displayWord.trim(),
        normalizedWord: stored,
        ok: false,
        error: "too_long",
      };
    }
    return {
      displayWord: displayWord.trim() || stored,
      normalizedWord: stored,
      ok: true,
    };
  }

  return fromDisplay;
}

/** v1 filler alphabet — uniform Latin uppercase. */
export const LATIN_FILLER_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" as const;

export function formatLetter(
  letter: string,
  letterCase: "upper" | "lower",
): string {
  return letterCase === "lower" ? letter.toLowerCase() : letter.toUpperCase();
}
