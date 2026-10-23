import { Measure } from "@madie/madie-models";
import type { CommentSection } from "@madie/madie-util";

// the slice of a measure the section catalogue depends on
type CommentMeasure = Pick<
  Measure,
  "model" | "groups" | "testCases" | "measureMetaData"
>;

export const COMMENT_MAIN_SECTIONS = {
  DETAILS: "Details",
  CQL_EDITOR: "CQL Editor",
  POPULATION_CRITERIA: "Population Criteria",
  TEST_CASES: "Test Cases",
} as const;

export type CommentMainSection =
  (typeof COMMENT_MAIN_SECTIONS)[keyof typeof COMMENT_MAIN_SECTIONS];

const FALLBACK_SECTION_NAME = "Current section";

export interface CommentSectionLocation {
  // undefined when the route isn't one that can be commented on
  mainSection?: CommentMainSection;
  subSectionName: string;
}

const UNKNOWN_SECTION: CommentSectionLocation = {
  subSectionName: FALLBACK_SECTION_NAME,
};

type SectionScope = "qdm" | "fhir";

interface SubSectionDefinition {
  route: string;
  name: string;
  scope?: SectionScope;
  // a few screens drop out of the nav for composite measures
  hiddenForComposite?: boolean;
}

interface MeasureContext {
  isQdm: boolean;
  isComposite: boolean;
}

const isPlaceholder = (route: string) => route.startsWith("__");

/*
  Routes and labels mirror the edit measure side navs (MeasureDetails,
  PopulationCriteriaSideNav, the test case list). Keep them in step when a nav
  entry is renamed, or stored comments detach from their row.
*/
const DETAILS_SUB_SECTIONS: SubSectionDefinition[] = [
  { route: "", name: "Name, Version & ID" },
  { route: "model&measurement-period", name: "Model & Measurement Period" },
  { route: "measure-steward", name: "Steward & Developers" },
  { route: "measure-description", name: "Description" },
  { route: "measure-rationale", name: "Rationale" },
  { route: "measure-purpose", name: "Purpose", scope: "fhir" },
  { route: "measure-guidance", name: "Guidance (Usage)" },
  { route: "measure-definition", name: "Definition", scope: "qdm" },
  {
    route: "measure-clinical-recommendation",
    name: "Clinical Recommendation",
  },
  { route: "measure-references", name: "References" },
  {
    route: "measure-authoritative-source",
    name: "Authoritative Source",
    scope: "fhir",
  },
  { route: "measure-definition", name: "Definition", scope: "fhir" },
  { route: "transmission-format", name: "Transmission Format", scope: "qdm" },
  { route: "measure-set", name: "Measure Set", scope: "qdm" },
  { route: "measure-limitations", name: "Limitations", scope: "fhir" },
  { route: "measure-trending-issues", name: "Trending Issues", scope: "fhir" },
  { route: "measure-copyright", name: "Copyright" },
  { route: "measure-disclaimer", name: "Disclaimer" },
];

const CRITERIA_PLACEHOLDER = "__criteria__";
const POPULATION_CRITERIA_PLACEHOLDER = "__population_criteria__";

const POPULATION_CRITERIA_SUB_SECTIONS: SubSectionDefinition[] = [
  { route: "base-configuration", name: "Base Configuration", scope: "qdm" },
  { route: CRITERIA_PLACEHOLDER, name: CRITERIA_PLACEHOLDER },
  { route: "reporting", name: "Reporting", scope: "qdm" },
  { route: "supplemental-data", name: "Supplemental Data" },
  { route: "risk-adjustment", name: "Risk Adjustment" },
];

const TEST_CASE_LIST_SUB_SECTIONS: SubSectionDefinition[] = [
  {
    route: POPULATION_CRITERIA_PLACEHOLDER,
    name: POPULATION_CRITERIA_PLACEHOLDER,
  },
  { route: "sde", name: "SDE", hiddenForComposite: true },
  { route: "rav", name: "RAV", hiddenForComposite: true },
  { route: "expansion", name: "Expansion" },
  { route: "execution-options", name: "Execution Options" },
  { route: "test-case-data", name: "Test Case Data" },
];

const toNameByRoute = (definitions: SubSectionDefinition[]) =>
  definitions
    .filter((definition) => !isPlaceholder(definition.route))
    .reduce<Record<string, string>>((names, definition) => {
      names[definition.route] = definition.name;
      return names;
    }, {});

const DETAILS_SECTIONS = toNameByRoute(DETAILS_SUB_SECTIONS);
const POPULATION_CRITERIA_SECTIONS = toNameByRoute(
  POPULATION_CRITERIA_SUB_SECTIONS
);
const TEST_CASE_LIST_SECTIONS = toNameByRoute(TEST_CASE_LIST_SUB_SECTIONS);

const isQdmMeasure = (measure?: CommentMeasure | null) =>
  Boolean(measure?.model?.includes("QDM"));

const namesInScope = (
  definitions: SubSectionDefinition[],
  { isQdm, isComposite }: MeasureContext
): string[] =>
  definitions
    .filter(
      (definition) =>
        (!definition.scope || definition.scope === (isQdm ? "qdm" : "fhir")) &&
        !(definition.hiddenForComposite && isComposite)
    )
    .map((definition) => definition.name);

/*
  A measure with no groups still shows Criteria 1, matching the population criteria side nav.
*/
const getCriteriaNames = (
  measure: CommentMeasure | null | undefined,
  label: string
): string[] => {
  const groupCount = measure?.groups?.length || 1;
  return Array.from(
    { length: groupCount },
    (_group, index) => `${label} ${index + 1}`
  );
};

const getGroupNumber = (
  groupId: string | undefined,
  groups: CommentMeasure["groups"] | undefined
): number | undefined => {
  if (!groupId || !groups?.length) {
    return undefined;
  }

  const index = groups.findIndex((group) => group.id === groupId);
  return index >= 0 ? index + 1 : undefined;
};

export const getCommentSections = (
  measure?: CommentMeasure | null
): CommentSection[] => {
  const context: MeasureContext = {
    isQdm: isQdmMeasure(measure),
    isComposite: Boolean(measure?.measureMetaData?.composite),
  };
  const criteriaNames = getCriteriaNames(measure, "Criteria");
  const populationCriteriaNames = getCriteriaNames(
    measure,
    "Population Criteria"
  );

  const expandPlaceholders = (names: string[]) =>
    names.flatMap((name) => {
      if (name === CRITERIA_PLACEHOLDER) {
        return criteriaNames;
      }
      return name === POPULATION_CRITERIA_PLACEHOLDER
        ? populationCriteriaNames
        : name;
    });

  const sections: CommentSection[] = [
    {
      name: COMMENT_MAIN_SECTIONS.DETAILS,
      subSections: namesInScope(DETAILS_SUB_SECTIONS, context),
    },
    {
      name: COMMENT_MAIN_SECTIONS.CQL_EDITOR,
      subSections: ["CQL Editor"],
    },
    {
      name: COMMENT_MAIN_SECTIONS.POPULATION_CRITERIA,
      subSections: expandPlaceholders(
        namesInScope(POPULATION_CRITERIA_SUB_SECTIONS, context)
      ),
    },
    {
      name: COMMENT_MAIN_SECTIONS.TEST_CASES,
      subSections: expandPlaceholders(
        namesInScope(TEST_CASE_LIST_SUB_SECTIONS, context)
      ),
    },
  ];

  // composite measures have no CQL Editor tab, so they get no header for it
  return context.isComposite
    ? sections.filter(
        (section) => section.name !== COMMENT_MAIN_SECTIONS.CQL_EDITOR
      )
    : sections;
};

const getTestCasesLocation = (
  subsection: string,
  identifier: string,
  measure?: CommentMeasure | null
): CommentSectionLocation => {
  if (subsection === "list-page") {
    if (!identifier) {
      return {
        mainSection: COMMENT_MAIN_SECTIONS.TEST_CASES,
        subSectionName: "Population Criteria 1",
      };
    }

    const listSectionName = TEST_CASE_LIST_SECTIONS[identifier];
    if (listSectionName) {
      return {
        mainSection: COMMENT_MAIN_SECTIONS.TEST_CASES,
        subSectionName: listSectionName,
      };
    }

    // anything else on the list page is a group id, shown by its position
    const groupNumber = getGroupNumber(identifier, measure?.groups);
    return groupNumber
      ? {
          mainSection: COMMENT_MAIN_SECTIONS.TEST_CASES,
          subSectionName: `Population Criteria ${groupNumber}`,
        }
      : UNKNOWN_SECTION;
  }

  const testCase = measure?.testCases?.find(
    (candidate) => candidate.id === subsection
  );
  if (!testCase) {
    return UNKNOWN_SECTION;
  }

  const title = testCase.title ?? testCase.name ?? "Test Case";
  return {
    mainSection: COMMENT_MAIN_SECTIONS.TEST_CASES,
    subSectionName: testCase.series ? `${testCase.series} - ${title}` : title,
  };
};

/*
  Resolves the measure edit route the user is on into the main header and
  sub-section their comment would be attached to.
*/
export const getCommentSectionLocation = (
  pathname: string,
  measure?: CommentMeasure | null
): CommentSectionLocation => {
  const path = (pathname ?? "").replace(/\/+$/, "");
  const editIndex = path.indexOf("/edit/");
  const editPath = editIndex >= 0 ? path.slice(editIndex + 6) : "";
  const segments = editPath.split("/").filter(Boolean);
  const [section, subsection, identifier] = segments;
  const isQdm = isQdmMeasure(measure);

  if (section === "details") {
    const detailsName = DETAILS_SECTIONS[subsection ?? ""];
    return detailsName
      ? {
          mainSection: COMMENT_MAIN_SECTIONS.DETAILS,
          subSectionName: detailsName,
        }
      : UNKNOWN_SECTION;
  }

  if (section === "cql-editor") {
    return {
      mainSection: COMMENT_MAIN_SECTIONS.CQL_EDITOR,
      subSectionName: "CQL Editor",
    };
  }

  if (section === "groups") {
    const groupNumber = Number(subsection);
    return Number.isInteger(groupNumber) && groupNumber > 0
      ? {
          mainSection: COMMENT_MAIN_SECTIONS.POPULATION_CRITERIA,
          subSectionName: `Criteria ${groupNumber}`,
        }
      : UNKNOWN_SECTION;
  }

  if (POPULATION_CRITERIA_SECTIONS[section]) {
    const definition = POPULATION_CRITERIA_SUB_SECTIONS.find(
      (candidate) => candidate.route === section
    );
    // Base Configuration and Reporting only exist on QDM measures
    return !definition.scope || definition.scope === (isQdm ? "qdm" : "fhir")
      ? {
          mainSection: COMMENT_MAIN_SECTIONS.POPULATION_CRITERIA,
          subSectionName: definition.name,
        }
      : UNKNOWN_SECTION;
  }

  if (section === "test-cases") {
    return getTestCasesLocation(subsection, identifier, measure);
  }

  return UNKNOWN_SECTION;
};
