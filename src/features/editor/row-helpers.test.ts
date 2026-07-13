import { describe, expect, it } from "vitest";
import {
  addRow,
  createRowId,
  deleteRow,
  duplicateRow,
  moveRow,
  reorderRows,
  updateRow,
} from "@/features/editor/row-helpers";

interface Row {
  id: string;
  text: string;
}

describe("row helpers", () => {
  it("adds, updates, reorders, duplicates, deletes with stable ids", () => {
    let rows: Row[] = [];
    rows = addRow(rows, () => ({ id: createRowId(), text: "A" }));
    rows = addRow(rows, () => ({ id: createRowId(), text: "B" }));
    expect(rows).toHaveLength(2);
    const idA = rows[0]!.id;
    const idB = rows[1]!.id;

    rows = updateRow(rows, idA, { text: "A1" });
    expect(rows[0]!.text).toBe("A1");

    rows = reorderRows(rows, [idB, idA]);
    expect(rows.map((r) => r.id)).toEqual([idB, idA]);

    rows = duplicateRow(rows, idB, (src, newId) => ({
      id: newId,
      text: `${src.text} copy`,
    }));
    expect(rows).toHaveLength(3);
    expect(rows[1]!.text).toBe("B copy");

    const deleted = deleteRow(rows, idA);
    expect(deleted.removed?.id).toBe(idA);
    expect(deleted.rows).toHaveLength(2);
  });

  it("enforces max items on add", () => {
    let rows: Row[] = [
      { id: "1", text: "A" },
      { id: "2", text: "B" },
    ];
    rows = addRow(rows, () => ({ id: "3", text: "C" }), { maxItems: 2 });
    expect(rows).toHaveLength(2);
  });

  it("moves rows for keyboard reorder", () => {
    const rows = [
      { id: "1", text: "A" },
      { id: "2", text: "B" },
      { id: "3", text: "C" },
    ];
    expect(moveRow(rows, "2", "up").map((r) => r.id)).toEqual(["2", "1", "3"]);
    expect(moveRow(rows, "2", "down").map((r) => r.id)).toEqual([
      "1",
      "3",
      "2",
    ]);
  });
});
