import { getCommentSectionName } from "./getCommentSectionName";

const measure = {
  model: "QI-Core v6.0.0",
  groups: [{ id: "group-one" }, { id: "group-two" }],
  testCases: [{ id: "case-one", title: "Example case", groupId: "group-two" }],
};

describe("getCommentSectionName", () => {
  it.each([
    ["details", "Name, Version & ID"],
    ["details/model&measurement-period", "Model & Measurement Period"],
    ["details/measure-steward", "Steward & Developers"],
    ["details/measure-purpose", "Purpose"],
    ["details/measure-clinical-recommendation", "Clinical Recommendation"],
    ["cql-editor", "CQL Editor"],
    ["groups/2", "Criteria 2"],
    ["supplemental-data", "Supplemental Data"],
    ["risk-adjustment", "Risk Adjustment"],
  ])("maps edit/%s to %s", (route, expected) => {
    expect(
      getCommentSectionName(`/measures/measure-id/edit/${route}`, measure)
    ).toBe(expected);
  });

  it("maps a test-case group UUID to its population criteria number", () => {
    expect(
      getCommentSectionName(
        "/measures/measure-id/edit/test-cases/list-page/group-two",
        measure
      )
    ).toBe("Population Criteria 2");
  });

  it("resolves a test case title and group", () => {
    expect(
      getCommentSectionName(
        "/measures/measure-id/edit/test-cases/case-one",
        measure
      )
    ).toBe("Example case, Group 2");
  });

  it("supports test-case list subsections and trailing slashes", () => {
    expect(
      getCommentSectionName(
        "/measures/measure-id/edit/test-cases/list-page/sde/",
        measure
      )
    ).toBe("SDE");
  });

  it("returns a safe fallback for an unknown route", () => {
    expect(
      getCommentSectionName("/measures/measure-id/edit/unknown", measure)
    ).toBe("Current section");
  });
});
