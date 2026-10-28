import {
  COMMENT_MAIN_SECTIONS,
  getCommentSectionLocation,
  getCommentSections,
} from "./CommentUtils";

const nameFor = (pathname: string, measure?: any) =>
  getCommentSectionLocation(pathname, measure).activeSubSection;

const measure = {
  model: "QI-Core v6.0.0",
  groups: [{ id: "group-one" }, { id: "group-two" }],
  testCases: [{ id: "case-one", title: "Example case", groupId: "group-two" }],
};

describe("sub-section names", () => {
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
    expect(nameFor(`/measures/measure-id/edit/${route}`, measure)).toBe(
      expected
    );
  });

  it("maps a test-case group UUID to its population criteria number", () => {
    expect(
      nameFor(
        "/measures/measure-id/edit/test-cases/list-page/group-two",
        measure
      )
    ).toBe("Population Criteria 2");
  });

  it("resolves a test case title", () => {
    expect(
      nameFor("/measures/measure-id/edit/test-cases/case-one", measure)
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
      nameFor(
        "/measures/measure-id/edit/test-cases/case-one",
        measureWithSeries
      )
    ).toBe("Series A - Example case");
  });

  it("supports test-case list subsections and trailing slashes", () => {
    expect(
      nameFor("/measures/measure-id/edit/test-cases/list-page/sde/", measure)
    ).toBe("SDE");
  });

  it("returns a safe fallback for an unknown route", () => {
    expect(nameFor("/measures/measure-id/edit/unknown", measure)).toBe(
      "Current section"
    );
  });

  it("maps base-configuration and reporting for QDM measures", () => {
    const qdmMeasure = { ...measure, model: "QDM v5.6" };

    expect(
      nameFor("/measures/measure-id/edit/base-configuration", qdmMeasure)
    ).toBe("Base Configuration");

    expect(nameFor("/measures/measure-id/edit/reporting", qdmMeasure)).toBe(
      "Reporting"
    );
  });

  it("returns fallback labels for unsupported paths and non-QDM conditional routes", () => {
    expect(
      nameFor("/measures/measure-id/edit/base-configuration", measure)
    ).toBe("Current section");

    expect(nameFor("/measures/measure-id/edit/reporting", measure)).toBe(
      "Current section"
    );

    expect(
      nameFor("/measures/measure-id/edit/groups/not-a-number", measure)
    ).toBe("Current section");

    expect(nameFor("/measures/measure-id/view/details", measure)).toBe(
      "Current section"
    );
  });

  it("maps list-page labels and fallback states", () => {
    expect(
      nameFor("/measures/measure-id/edit/test-cases/list-page", measure)
    ).toBe("Population Criteria 1");

    expect(
      nameFor("/measures/measure-id/edit/test-cases/list-page/rav", measure)
    ).toBe("RAV");

    expect(
      nameFor(
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
      nameFor(
        "/measures/measure-id/edit/test-cases/case-no-name",
        unnamedCaseMeasure
      )
    ).toBe("Test Case");
  });
});

describe("getCommentSectionLocation", () => {
  const locationFor = (route: string, forMeasure: any = measure) =>
    getCommentSectionLocation(`/measures/measure-id/edit/${route}`, forMeasure);

  it.each([
    ["details", COMMENT_MAIN_SECTIONS.DETAILS, "Name, Version & ID"],
    [
      "details/model&measurement-period",
      COMMENT_MAIN_SECTIONS.DETAILS,
      "Model & Measurement Period",
    ],
    ["details/measure-disclaimer", COMMENT_MAIN_SECTIONS.DETAILS, "Disclaimer"],
    ["cql-editor", COMMENT_MAIN_SECTIONS.CQL_EDITOR, "CQL Editor"],
    ["groups/1", COMMENT_MAIN_SECTIONS.POPULATION_CRITERIA, "Criteria 1"],
    [
      "supplemental-data",
      COMMENT_MAIN_SECTIONS.POPULATION_CRITERIA,
      "Supplemental Data",
    ],
    [
      "risk-adjustment",
      COMMENT_MAIN_SECTIONS.POPULATION_CRITERIA,
      "Risk Adjustment",
    ],
    [
      "test-cases/list-page",
      COMMENT_MAIN_SECTIONS.TEST_CASES,
      "Population Criteria 1",
    ],
    [
      "test-cases/list-page/execution-options",
      COMMENT_MAIN_SECTIONS.TEST_CASES,
      "Execution Options",
    ],
    [
      "test-cases/list-page/group-one",
      COMMENT_MAIN_SECTIONS.TEST_CASES,
      "Population Criteria 1",
    ],
  ])(
    "places edit/%s under %s as %s",
    (route, activeMainSection, activeSubSection) => {
      expect(locationFor(route)).toEqual({
        activeMainSection,
        activeSubSection,
      });
    }
  );

  it("places an individual test case under Test Cases, keyed by its id", () => {
    expect(locationFor("test-cases/case-one")).toEqual({
      activeMainSection: COMMENT_MAIN_SECTIONS.TEST_CASES,
      activeSubSection: "Example case",
      activeSubSectionId: "case-one",
    });
  });

  it("places the QDM only screens under Population Criteria", () => {
    const qdmMeasure = { ...measure, model: "QDM v5.6" };

    expect(locationFor("base-configuration", qdmMeasure)).toEqual({
      activeMainSection: COMMENT_MAIN_SECTIONS.POPULATION_CRITERIA,
      activeSubSection: "Base Configuration",
    });
    expect(locationFor("reporting", qdmMeasure)).toEqual({
      activeMainSection: COMMENT_MAIN_SECTIONS.POPULATION_CRITERIA,
      activeSubSection: "Reporting",
    });
  });

  it("maps the details screens that are not in the main nav list", () => {
    expect(locationFor("details/measure-limitations")).toEqual({
      activeMainSection: COMMENT_MAIN_SECTIONS.DETAILS,
      activeSubSection: "Limitations",
    });
    expect(locationFor("details/measure-authoritative-source")).toEqual({
      activeMainSection: COMMENT_MAIN_SECTIONS.DETAILS,
      activeSubSection: "Authoritative Source",
    });
  });

  it.each([
    "unknown",
    "details/not-a-screen",
    "groups/not-a-number",
    "base-configuration",
    "reporting",
    "test-cases/list-page/unknown-group",
    "test-cases/unknown-case",
  ])("has no main section for edit/%s", (route) => {
    expect(locationFor(route)).toEqual({
      activeSubSection: "Current section",
    });
  });

  it("does not throw when the route is not known yet", () => {
    expect(getCommentSectionLocation(undefined, measure)).toEqual({
      activeSubSection: "Current section",
    });
  });

  it("has no main section outside of the measure edit routes", () => {
    expect(
      getCommentSectionLocation("/measures/measure-id/view/details", measure)
    ).toEqual({ activeSubSection: "Current section" });
  });
});

describe("getCommentSections", () => {
  const subSectionsOf = (sections: any[], name: string) =>
    sections.find((section) => section.name === name)?.subSections;

  it("lists the QI-Core details screens in side nav order", () => {
    const sections = getCommentSections(measure);

    expect(subSectionsOf(sections, COMMENT_MAIN_SECTIONS.DETAILS)).toEqual([
      "Name, Version & ID",
      "Model & Measurement Period",
      "Steward & Developers",
      "Description",
      "Rationale",
      "Purpose",
      "Guidance (Usage)",
      "Clinical Recommendation",
      "References",
      "Authoritative Source",
      "Definition",
      "Limitations",
      "Trending Issues",
      "Copyright",
      "Disclaimer",
    ]);
  });

  it("lists the QDM details screens in side nav order", () => {
    const sections = getCommentSections({ ...measure, model: "QDM v5.6" });

    expect(subSectionsOf(sections, COMMENT_MAIN_SECTIONS.DETAILS)).toEqual([
      "Name, Version & ID",
      "Model & Measurement Period",
      "Steward & Developers",
      "Description",
      "Rationale",
      "Guidance (Usage)",
      "Definition",
      "Clinical Recommendation",
      "References",
      "Transmission Format",
      "Measure Set",
      "Copyright",
      "Disclaimer",
    ]);
  });

  it("leaves out screens the other model does not have", () => {
    const qiCore = subSectionsOf(
      getCommentSections(measure),
      COMMENT_MAIN_SECTIONS.DETAILS
    );
    const qdm = subSectionsOf(
      getCommentSections({ ...measure, model: "QDM v5.6" }),
      COMMENT_MAIN_SECTIONS.DETAILS
    );

    // QDM only
    expect(qiCore).not.toContain("Transmission Format");
    expect(qiCore).not.toContain("Measure Set");
    // QI-Core only
    expect(qdm).not.toContain("Purpose");
    expect(qdm).not.toContain("Authoritative Source");
    expect(qdm).not.toContain("Limitations");
    expect(qdm).not.toContain("Trending Issues");
  });

  it("numbers population criteria from the measure groups", () => {
    expect(
      subSectionsOf(
        getCommentSections(measure),
        COMMENT_MAIN_SECTIONS.POPULATION_CRITERIA
      )
    ).toEqual([
      "Criteria 1",
      "Criteria 2",
      "Supplemental Data",
      "Risk Adjustment",
    ]);
  });

  it("adds the QDM only population criteria screens in nav order", () => {
    expect(
      subSectionsOf(
        getCommentSections({ ...measure, model: "QDM v5.6" }),
        COMMENT_MAIN_SECTIONS.POPULATION_CRITERIA
      )
    ).toEqual([
      "Base Configuration",
      "Criteria 1",
      "Criteria 2",
      "Reporting",
      "Supplemental Data",
      "Risk Adjustment",
    ]);
  });

  it("shows Criteria 1 for a measure with no groups", () => {
    expect(
      subSectionsOf(
        getCommentSections({ ...measure, groups: [] }),
        COMMENT_MAIN_SECTIONS.POPULATION_CRITERIA
      )
    ).toEqual(["Criteria 1", "Supplemental Data", "Risk Adjustment"]);
  });

  it("lists the test case screens in side nav order", () => {
    expect(
      subSectionsOf(
        getCommentSections(measure),
        COMMENT_MAIN_SECTIONS.TEST_CASES
      )
    ).toEqual([
      "Population Criteria 1",
      "Population Criteria 2",
      "SDE",
      "RAV",
      "Expansion",
      "Execution Options",
      "Test Case Data",
      { id: "case-one", name: "Example case" },
    ]);
  });

  it("lists each test case by id with its group and title as the name", () => {
    const measureWithSeries = {
      ...measure,
      testCases: [
        { id: "case-one", title: "Example case", series: "Series A" },
        { id: "case-two", title: "Other case" },
      ],
    };

    expect(
      subSectionsOf(
        getCommentSections(measureWithSeries),
        COMMENT_MAIN_SECTIONS.TEST_CASES
      ).slice(-2)
    ).toEqual([
      { id: "case-one", name: "Series A - Example case" },
      { id: "case-two", name: "Other case" },
    ]);
  });

  it("no longer lists a Test Case List screen", () => {
    expect(
      subSectionsOf(
        getCommentSections(measure),
        COMMENT_MAIN_SECTIONS.TEST_CASES
      )
    ).not.toContain("Test Case List");
  });

  it("drops SDE and RAV for composite measures", () => {
    expect(
      subSectionsOf(
        getCommentSections({
          ...measure,
          measureMetaData: { composite: true },
        }),
        COMMENT_MAIN_SECTIONS.TEST_CASES
      )
    ).toEqual([
      "Population Criteria 1",
      "Population Criteria 2",
      "Expansion",
      "Execution Options",
      "Test Case Data",
      { id: "case-one", name: "Example case" },
    ]);
  });

  it("drops the CQL Editor header for composite measures", () => {
    const sections = getCommentSections({
      ...measure,
      measureMetaData: { composite: true },
    });

    expect(sections.map((section) => section.name)).not.toContain(
      COMMENT_MAIN_SECTIONS.CQL_EDITOR
    );
    expect(sections.map((section) => section.name)).toEqual([
      COMMENT_MAIN_SECTIONS.DETAILS,
      COMMENT_MAIN_SECTIONS.POPULATION_CRITERIA,
      COMMENT_MAIN_SECTIONS.TEST_CASES,
    ]);
  });
});
