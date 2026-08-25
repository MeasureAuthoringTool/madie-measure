import { TestCaseValidator } from "./TestCaseValidator";
import { PopulationType } from "@madie/madie-models";

describe("TestCaseValidator", () => {
  const buildBaseModel = () => ({
    title: "Valid Title",
    description: "description",
    series: "series",
    groupPopulations: [],
  });

  it("validates a fully valid model", async () => {
    await expect(
      TestCaseValidator.validate(buildBaseModel())
    ).resolves.toBeTruthy();
  });

  describe("title validation", () => {
    it("requires title", async () => {
      try {
        await TestCaseValidator.validate(
          {
            ...buildBaseModel(),
            title: "",
          },
          { abortEarly: false }
        );
      } catch (error: any) {
        expect(error.errors).toContain("Test Case Title is required.");
      }
    });

    it("rejects title with only numbers", async () => {
      try {
        await TestCaseValidator.validate(
          {
            ...buildBaseModel(),
            title: "12345",
          },
          { abortEarly: false }
        );
      } catch (error: any) {
        expect(error.errors).toContain("Test Case Title is required.");
      }
    });

    it("rejects title over 250 chars", async () => {
      try {
        await TestCaseValidator.validate(
          {
            ...buildBaseModel(),
            title: "a".repeat(251),
          },
          { abortEarly: false }
        );
      } catch (error: any) {
        expect(error.errors).toContain(
          "Test Case Title cannot be more than 250 characters."
        );
      }
    });
  });

  describe("description validation", () => {
    it("allows null description", async () => {
      await expect(
        TestCaseValidator.validate({
          ...buildBaseModel(),
          description: null,
        })
      ).resolves.toBeTruthy();
    });

    it("rejects long description", async () => {
      try {
        await TestCaseValidator.validate({
          ...buildBaseModel(),
          description: "a".repeat(251),
        });
      } catch (error: any) {
        expect(error.errors).toContain(
          "Test Case Description cannot be more than 250 characters."
        );
      }
    });
  });

  describe("series validation", () => {
    it("allows null series", async () => {
      await expect(
        TestCaseValidator.validate({
          ...buildBaseModel(),
          series: null,
        })
      ).resolves.toBeTruthy();
    });

    it("rejects long series", async () => {
      try {
        await TestCaseValidator.validate({
          ...buildBaseModel(),
          series: "a".repeat(251),
        });
      } catch (error: any) {
        expect(error.errors).toContain(
          "Test Case Group cannot be more than 250 characters."
        );
      }
    });
  });

  describe("population expected value validation", () => {
    it("allows undefined expected value", async () => {
      await expect(
        TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              populationBasis: "integer",
              populationValues: [
                {
                  name: "DENOM",
                  expected: undefined,
                },
              ],
            },
          ],
        })
      ).resolves.toBeTruthy();
    });

    it("allows null expected value", async () => {
      await expect(
        TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              populationBasis: "integer",
              populationValues: [
                {
                  name: "DENOM",
                  expected: null,
                },
              ],
            },
          ],
        })
      ).resolves.toBeTruthy();
    });

    it("passes boolean population with boolean value", async () => {
      await expect(
        TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              populationBasis: "boolean",
              populationValues: [
                {
                  name: "DENOM",
                  expected: true,
                },
              ],
            },
          ],
        })
      ).resolves.toBeTruthy();
    });

    it("fails boolean population with non boolean value", async () => {
      try {
        await TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              populationBasis: "boolean",
              populationValues: [
                {
                  name: "DENOM",
                  expected: "1",
                },
              ],
            },
          ],
        });
      } catch (error: any) {
        expect(error.message).toEqual(
          "Expected value type must match population basis type"
        );
      }
    });

    it("allows decimals for observation populations", async () => {
      await expect(
        TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              populationBasis: "integer",
              populationValues: [
                {
                  name: PopulationType.NUMERATOR_OBSERVATION,
                  expected: "5.25",
                },
              ],
            },
          ],
        })
      ).resolves.toBeTruthy();
    });

    it("rejects decimals for non observation populations", async () => {
      try {
        await TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              populationBasis: "integer",
              populationValues: [
                {
                  name: "DENOM",
                  expected: "5.25",
                },
              ],
            },
          ],
        });
      } catch (error: any) {
        expect(error.message).toEqual(
          "Decimals values cannot be entered in the population expected values"
        );
      }
    });

    it("rejects negative values", async () => {
      try {
        await TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              populationBasis: "integer",
              populationValues: [
                {
                  name: "DENOM",
                  expected: -1,
                },
              ],
            },
          ],
        });
      } catch (error: any) {
        expect(error.message).toEqual(
          "Only positive numeric values can be entered in the expected values"
        );
      }
    });

    it("rejects non numeric values", async () => {
      try {
        await TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              populationBasis: "integer",
              populationValues: [
                {
                  name: "DENOM",
                  expected: "abc",
                },
              ],
            },
          ],
        });
      } catch (error: any) {
        expect(error.message).toEqual(
          "Only positive numeric values can be entered in the expected values"
        );
      }
    });
  });

  describe("composite score values", () => {
    it("allows valid values", async () => {
      await expect(
        TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              compositeScoreValues: {
                denominatorScore: {
                  expected: 10,
                },
                numeratorScore: {
                  expected: 10.25,
                },
                compositeScore: {
                  expected: 50.5,
                },
              },
            },
          ],
        })
      ).resolves.toBeTruthy();
    });

    it("rejects decimal denominator", async () => {
      try {
        await TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              compositeScoreValues: {
                denominatorScore: {
                  expected: 10.25,
                },
              },
            },
          ],
        });
      } catch (error: any) {
        expect(error.message).toEqual(
          "Decimals values cannot be entered in the population expected values"
        );
      }
    });

    it("rejects negative denominator", async () => {
      try {
        await TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              compositeScoreValues: {
                denominatorScore: {
                  expected: -1,
                },
              },
            },
          ],
        });
      } catch (error: any) {
        expect(error.message).toEqual(
          "Only positive numeric values can be entered in the expected values"
        );
      }
    });

    it("allows empty composite values", async () => {
      await expect(
        TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              compositeScoreValues: {
                denominatorScore: {
                  expected: null,
                },
                numeratorScore: {
                  expected: "",
                },
                compositeScore: {
                  expected: undefined,
                },
              },
            },
          ],
        })
      ).resolves.toBeTruthy();
    });

    it("rejects invalid numerator value", async () => {
      try {
        await TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              compositeScoreValues: {
                numeratorScore: {
                  expected: "abc",
                },
              },
            },
          ],
        });
      } catch (error: any) {
        expect(error.message).toEqual(
          "Only positive numeric values can be entered in the expected values"
        );
      }
    });

    it("rejects invalid actual score", async () => {
      try {
        await TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              compositeScoreValues: {
                denominatorScore: {
                  expected: 10,
                  actual: -1,
                },
              },
            },
          ],
        });
      } catch (error: any) {
        expect(error.message).toEqual(
          "Value must be greater than or equal to 0"
        );
      }
    });

    it("allows nullable actual score", async () => {
      await expect(
        TestCaseValidator.validate({
          ...buildBaseModel(),
          groupPopulations: [
            {
              compositeScoreValues: {
                denominatorScore: {
                  expected: 10,
                  actual: null,
                },
              },
            },
          ],
        })
      ).resolves.toBeTruthy();
    });
  });
});
