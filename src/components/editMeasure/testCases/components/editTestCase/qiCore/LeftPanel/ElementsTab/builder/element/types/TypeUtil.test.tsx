import React from "react";
import { getMultipleCardinalityLabel } from "./TypeUtil";

describe("getMultipleCardinalityLabel", () => {
  it("should return an empty string for empty input", () => {
    const input = "";
    const expectedOutput = "";
    expect(getMultipleCardinalityLabel(input)).toEqual(expectedOutput);
  });

  it("Should return original label if it includes 'Repeat.When['", () => {
    const input = "Repeat.When[1]";
    const expectedOutput = input;
    expect(getMultipleCardinalityLabel(input)).toEqual(expectedOutput);
  });

  it("Should return original label if it includes 'Repeat.Day of Week['", () => {
    const input = "Repeat.Day of Week[1]";
    const expectedOutput = input;
    expect(getMultipleCardinalityLabel(input)).toEqual(expectedOutput);
  });

  it("Should return original label if it includes 'Repeat.Time of Day['", () => {
    const input = "Repeat.Time of Day[1]";
    const expectedOutput = input;
    expect(getMultipleCardinalityLabel(input)).toEqual(expectedOutput);
  });

  it("should return the correct label for a given input with multiple cardinality", () => {
    const input = "ClaimResponse.addItem[1].itemSequence[0]";
    const expectedOutput = "Item Sequence 1";
    expect(getMultipleCardinalityLabel(input)).toEqual(expectedOutput);
  });

  it("should return the original label if no match is found", () => {
    const input = "ClaimResponse.addItem[0].itemSequence";
    const expectedOutput = input;
    expect(getMultipleCardinalityLabel(input)).toEqual(expectedOutput);
  });
});
