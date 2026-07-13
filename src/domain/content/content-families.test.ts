import { describe, expect, it } from "vitest";
import {
  listContentV1Schema,
  pairsContentV1Schema,
  parseContentPackDraft,
  parsePlayableContentPack,
  quizContentV1Schema,
  imageQuizContentV1Schema,
  statementsContentV1Schema,
  wordsearchContentV1Schema,
} from "@/domain/content";
import {
  buildImageQuizContent,
  buildListContent,
  buildPairsContent,
  buildQuizContent,
  buildStatementsContent,
  buildWordsearchContent,
} from "@/test/fixtures/builders";

describe("content family schemas", () => {
  it("parses minimal valid list.v1", () => {
    const pack = buildListContent();
    const result = listContentV1Schema.safeParse(pack);
    expect(result.success).toBe(true);
  });

  it("parses minimal valid pairs.v1", () => {
    expect(pairsContentV1Schema.safeParse(buildPairsContent()).success).toBe(
      true,
    );
  });

  it("parses minimal valid quiz.v1", () => {
    expect(quizContentV1Schema.safeParse(buildQuizContent()).success).toBe(
      true,
    );
  });

  it("parses minimal valid wordsearch.v1", () => {
    expect(
      wordsearchContentV1Schema.safeParse(buildWordsearchContent()).success,
    ).toBe(true);
  });

  it("parses minimal valid imageQuiz.v1", () => {
    expect(
      imageQuizContentV1Schema.safeParse(buildImageQuizContent()).success,
    ).toBe(true);
  });

  it("parses minimal valid statements.v1", () => {
    expect(
      statementsContentV1Schema.safeParse(buildStatementsContent()).success,
    ).toBe(true);
  });

  it("rejects unknown version numbers", () => {
    const bad = { ...buildListContent(), version: 99 };
    expect(listContentV1Schema.safeParse(bad).success).toBe(false);
    expect(parseContentPackDraft(bad).success).toBe(false);
  });

  it("rejects unknown family", () => {
    const bad = { family: "bingo", version: 1, items: [] };
    expect(parseContentPackDraft(bad).success).toBe(false);
  });

  it("accepts playable fixtures for each family", () => {
    const fixtures = [
      buildListContent(),
      buildPairsContent(),
      buildQuizContent(),
      buildWordsearchContent(),
      buildImageQuizContent(),
      buildStatementsContent(),
    ];
    for (const fixture of fixtures) {
      const result = parsePlayableContentPack(fixture);
      expect(result.success, JSON.stringify(fixture.family)).toBe(true);
    }
  });

  it("rejects unplayable list with fewer than 2 items", () => {
    const pack = buildListContent({
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          content: { text: "Only one" },
        },
      ],
    });
    expect(parsePlayableContentPack(pack).success).toBe(false);
  });
});
