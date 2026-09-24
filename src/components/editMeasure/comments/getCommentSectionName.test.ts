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

  it("resolves a test case title", () => {
    expect(
      getCommentSectionName(
        "/measures/measure-id/edit/test-cases/case-one",
        measure
      )
    ).toBe("Example case");
  });

  it("prefixes the test case series when present", () => {
    const measureWithSeries = {
      ...measure,
      testCases: [
        {
          id: "case-one",
          title: "Example case",
          series: "Series A",
        },
      ],
    };

    expect(
      getCommentSectionName(
        "/measures/measure-id/edit/test-cases/case-one",
        measureWithSeries
      )
    ).toBe("Series A - Example case");
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

  it("maps base-configuration and reporting for QDM measures", () => {
    const qdmMeasure = { ...measure, model: "QDM v5.6" };

    expect(
      getCommentSectionName(
        "/measures/measure-id/edit/base-configuration",
        qdmMeasure
      )
    ).toBe("Base Configuration");

    expect(
      getCommentSectionName("/measures/measure-id/edit/reporting", qdmMeasure)
    ).toBe("Reporting");
  });

  it("returns fallback labels for unsupported paths and non-QDM conditional routes", () => {
    expect(
      getCommentSectionName(
        "/measures/measure-id/edit/base-configuration",
        measure
      )
    ).toBe("Current section");

    expect(
      getCommentSectionName("/measures/measure-id/edit/reporting", measure)
    ).toBe("Current section");

    expect(
      getCommentSectionName(
        "/measures/measure-id/edit/groups/not-a-number",
        measure
      )
    ).toBe("Current section");

    expect(
      getCommentSectionName("/measures/measure-id/view/details", measure)
    ).toBe("Current section");
  });

  it("maps list-page labels and fallback states", () => {
    expect(
      getCommentSectionName(
        "/measures/measure-id/edit/test-cases/list-page",
        measure
      )
    ).toBe("Test Case List");

    expect(
      getCommentSectionName(
        "/measures/measure-id/edit/test-cases/list-page/rav",
        measure
      )
    ).toBe("RAV");

    expect(
      getCommentSectionName(
        "/measures/measure-id/edit/test-cases/list-page/unknown-group",
        measure
      )
    ).toBe("Current section");
  });

  it("returns default test case title when title and name are missing", () => {
    const unnamedCaseMeasure = {
      ...measure,
      testCases: [{ id: "case-no-name" }],
    };

    expect(
      getCommentSectionName(
        "/measures/measure-id/edit/test-cases/case-no-name",
        unnamedCaseMeasure
      )
    ).toBe("Test Case");
  });
});
