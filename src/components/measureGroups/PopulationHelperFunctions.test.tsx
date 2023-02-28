import "@testing-library/jest-dom";
import { describe, expect, it } from "@jest/globals";
import { getAssociationType } from "./PopulationHelperFunctions";
import { PopulationType } from "@madie/madie-models";

describe("PopulationHelperFunctions", () => {
  it("IgetAssociationType works as expected", async () => {
    const popType = getAssociationType("Initial Population", "Ratio", {
      id: "id-1",
      name: PopulationType.INITIAL_POPULATION,
      definition: "Initial Population",
      description: "",
      associationType: undefined,
    });
    const popType1 = getAssociationType("Initial Population 1", "Ratio", {
      id: "id-1",
      name: PopulationType.INITIAL_POPULATION,
      definition: "Initial Population 1",
      description: "",
      associationType: undefined,
    });
    const popType2 = getAssociationType("Initial Population 2", "Ratio", {
      id: "id-1",
      name: PopulationType.INITIAL_POPULATION,
      definition: "Initial Population",
      description: "",
      associationType: undefined,
    });
    expect(popType).toBe(undefined);
    expect(popType1).toBe("Denominator");
    expect(popType2).toBe("Numerator");
  });
});
