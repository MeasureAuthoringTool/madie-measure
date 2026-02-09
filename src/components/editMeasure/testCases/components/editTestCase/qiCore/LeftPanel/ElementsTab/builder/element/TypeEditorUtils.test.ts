import {
  getEmptyValueForType,
  getLastSegmentCapitalized,
} from "./TypeEditorUtils";

describe("TypeEditorUtils", () => {
  it("getEmptyValueForType should return null for case: http://hl7.org/fhirpath/System.Boolean", () => {
    expect(getEmptyValueForType("http://hl7.org/fhirpath/System.Boolean")).toBe(
      null
    );
  });

  it("getLastSegmentCapitalized should return the last segment capitalized", () => {
    expect(getLastSegmentCapitalized("Encounter.period")).toBe("Period");
    expect(
      getLastSegmentCapitalized("ClaimResponse.addItem[0].provider[0]")
    ).toBe("Provider[0]");
    expect(
      getLastSegmentCapitalized("ClaimResponse.addItem[0].itemSequence[0]")
    ).toBe("ItemSequence[0]");
    expect(getLastSegmentCapitalized("period")).toBe("Period");
    expect(getLastSegmentCapitalized("element")).toBe("Element");
    expect(getLastSegmentCapitalized("")).toBe("");
    expect(getLastSegmentCapitalized(undefined as any)).toBe("");
  });
});
