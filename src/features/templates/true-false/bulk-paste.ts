/**
 * Bulk paste with unambiguous truth markers.
 *
 * Format (one statement per line):
 *   Statement text [T]
 *   Statement text [F]
 *   Statement text [true]
 *   Statement text [false]
 *   Statement text    // defaults to True when no marker
 *
 * Markers are case-insensitive and must be at the end of the line.
 */

export interface BulkPasteLine {
  text: string;
  isTrue: boolean;
}

const MARKER_RE = /\s*\[(t|f|true|false)\]\s*$/i;

export function parseBulkPasteLine(line: string): BulkPasteLine | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const match = trimmed.match(MARKER_RE);
  if (!match) {
    return { text: trimmed, isTrue: true };
  }

  const marker = match[1]!.toLowerCase();
  const isTrue = marker === "t" || marker === "true";
  const text = trimmed.slice(0, match.index).trim();
  if (!text) return null;
  return { text, isTrue };
}

export function parseBulkPaste(raw: string): BulkPasteLine[] {
  return raw
    .split(/\r?\n/)
    .map(parseBulkPasteLine)
    .filter((line): line is BulkPasteLine => line !== null);
}
