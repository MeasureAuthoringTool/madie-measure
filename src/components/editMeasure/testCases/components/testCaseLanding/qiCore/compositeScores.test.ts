import { parseCompositeScores } from "./compositeScores";
import { MRCalculationOutput } from "fqm-execution/build/types/Calculator";

const buildGroup = (
  id: string,
  denominator: number,
  numerator: number,
  score: number
) => ({
  id,
  population: [
    {
      count: denominator,
      code: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/measure-population",
            code: "denominator",
          },
        ],
      },
    },
    {
      count: numerator,
      code: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/measure-population",
            code: "numerator",
          },
        ],
      },
    },
  ],
  measureScore: { value: score },
});

const buildOutput = (groups: any[]): MRCalculationOutput =>
  ({
    results: {
      resourceType: "MeasureReport",
      status: "complete",
      type: "summary",
      group: groups,
    },
  } as unknown as MRCalculationOutput);

describe("parseCompositeScores", () => {
  it("returns empty object when there is no calculation output", () => {
    expect(parseCompositeScores(undefined, "Group_1")).toEqual({});
  });

  it("returns empty object when no group display id is provided", () => {
    const output = buildOutput([buildGroup("Group_1", 4, 1, 0.25)]);
    expect(parseCompositeScores(output, undefined)).toEqual({});
  });

  it("returns empty object when the selected group is not found", () => {
    const output = buildOutput([buildGroup("Group_1", 4, 1, 0.25)]);
    expect(parseCompositeScores(output, "Group_9")).toEqual({});
  });

  it("parses the composite score as a percentage and the population counts", () => {
    const output = buildOutput([buildGroup("Group_1", 4, 1, 0.25)]);
    expect(parseCompositeScores(output, "Group_1")).toEqual({
      compositeScore: 25,
      denominatorScore: 4,
      numeratorScore: 1,
    });
  });

  it("selects the group matching the provided display id when there are multiple", () => {
    const output = buildOutput([
      buildGroup("Group_1", 4, 1, 0.25),
      buildGroup("Group_2", 8, 6, 0.75),
    ]);
    expect(parseCompositeScores(output, "Group_2")).toEqual({
      compositeScore: 75,
      denominatorScore: 8,
      numeratorScore: 6,
    });
  });

  it("rounds away floating point noise on the percentage", () => {
    const output = buildOutput([buildGroup("Group_1", 10, 1, 0.1)]);
    expect(parseCompositeScores(output, "Group_1").compositeScore).toBe(10);
  });

  it("supports results provided as an array of reports", () => {
    const output = {
      results: [
        {
          resourceType: "MeasureReport",
          group: [buildGroup("Group_1", 2, 1, 0.5)],
        },
      ],
    } as unknown as MRCalculationOutput;
    expect(parseCompositeScores(output, "Group_1")).toEqual({
      compositeScore: 50,
      denominatorScore: 2,
      numeratorScore: 1,
    });
  });

  it("leaves scores undefined when the report omits them", () => {
    const output = buildOutput([{ id: "Group_1" }]);
    expect(parseCompositeScores(output, "Group_1")).toEqual({
      compositeScore: undefined,
      denominatorScore: undefined,
      numeratorScore: undefined,
    });
  });
});
