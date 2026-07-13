/**
 * Stable-ID row operations for template editor adapters.
 * Pure functions — adapters receive bound helpers via context.
 */

export interface IdentifiedRow {
  id: string;
}

export function createRowId(): string {
  return crypto.randomUUID();
}

export function addRow<T extends IdentifiedRow>(
  rows: T[],
  create: () => T,
  options?: { maxItems?: number; index?: number },
): T[] {
  if (options?.maxItems !== undefined && rows.length >= options.maxItems) {
    return rows;
  }
  const next = create();
  if (options?.index === undefined || options.index >= rows.length) {
    return [...rows, next];
  }
  const copy = [...rows];
  copy.splice(Math.max(0, options.index), 0, next);
  return copy;
}

export function updateRow<T extends IdentifiedRow>(
  rows: T[],
  id: string,
  patch: Partial<T>,
): T[] {
  return rows.map((row) =>
    row.id === id ? ({ ...row, ...patch, id: row.id } as T) : row,
  );
}

export function reorderRows<T extends IdentifiedRow>(
  rows: T[],
  orderedIds: string[],
): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const ordered: T[] = [];
  for (const id of orderedIds) {
    const row = byId.get(id);
    if (row) {
      ordered.push(row);
      byId.delete(id);
    }
  }
  // Append any rows not listed (defensive).
  for (const row of byId.values()) {
    ordered.push(row);
  }
  return ordered;
}

export function duplicateRow<T extends IdentifiedRow>(
  rows: T[],
  id: string,
  clone: (source: T, newId: string) => T,
  options?: { maxItems?: number },
): T[] {
  if (options?.maxItems !== undefined && rows.length >= options.maxItems) {
    return rows;
  }
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return rows;
  const copy = clone(rows[index]!, createRowId());
  const next = [...rows];
  next.splice(index + 1, 0, copy);
  return next;
}

export function deleteRow<T extends IdentifiedRow>(
  rows: T[],
  id: string,
): { rows: T[]; removed: T | null } {
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return { rows, removed: null };
  const removed = rows[index]!;
  return {
    rows: rows.filter((row) => row.id !== id),
    removed,
  };
}

/**
 * Move a row up/down by one position (keyboard alternative to drag).
 */
export function moveRow<T extends IdentifiedRow>(
  rows: T[],
  id: string,
  direction: "up" | "down",
): T[] {
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return rows;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return rows;
  const next = [...rows];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item!);
  return next;
}
