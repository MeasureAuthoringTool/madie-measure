interface CommentGroup {
  id?: string;
  uuid?: string;
}

interface CommentTestCase {
  id?: string;
  uuid?: string;
  title?: string;
  name?: string;
  groupId?: string;
  groupUuid?: string;
}

interface CommentMeasure {
  model?: string;
  groups?: CommentGroup[];
  testCases?: CommentTestCase[];
}

const DETAILS_SECTIONS: Record<string, string> = {
  "model&measurement-period": "Model & Measurement Period",
  "measure-steward": "Steward & Developers",
  "measure-description": "Description",
  "measure-rationale": "Rationale",
  "measure-purpose": "Purpose",
  "measure-guidance": "Guidance (Usage)",
  "measure-clinical-recommendation": "Clinical Recommendation",
  "measure-references": "References",
  "measure-definition": "Definition",
  "transmission-format": "Transmission Format",
  "measure-set": "Measure Set",
  "measure-copyright": "Copyright",
  "measure-disclaimer": "Disclaimer",
};

const getGroupNumber = (
  groupId: string | undefined,
  groups: CommentGroup[] | undefined
): number | undefined => {
  if (!groupId || !groups?.length) {
    return undefined;
  }

  const index = groups.findIndex(
    (group) => group.id === groupId || group.uuid === groupId
  );
  return index >= 0 ? index + 1 : undefined;
};

export const getCommentSectionName = (
  pathname: string,
  measure?: CommentMeasure | null
): string => {
  const path = pathname.replace(/\/+$/, "");
  const editIndex = path.indexOf("/edit/");
  const editPath = editIndex >= 0 ? path.slice(editIndex + 6) : "";
  const segments = editPath.split("/").filter(Boolean);
  const [section, subsection, identifier] = segments;

  if (section === "details") {
    return DETAILS_SECTIONS[subsection] ?? "Name, Version & ID";
  }

  if (section === "cql-editor") {
    return "CQL Editor";
  }

  if (section === "base-configuration") {
    return measure?.model?.includes("QDM")
      ? "Base Configuration"
      : "Current section";
  }

  if (section === "groups") {
    const groupNumber = Number(subsection);
    return Number.isInteger(groupNumber) && groupNumber > 0
      ? `Criteria ${groupNumber}`
      : "Current section";
  }

  if (section === "supplemental-data") {
    return "Supplemental Data";
  }
  if (section === "risk-adjustment") {
    return "Risk Adjustment";
  }
  if (section === "reporting") {
    return measure?.model?.includes("QDM") ? "Reporting" : "Current section";
  }

  if (section === "test-cases") {
    if (subsection === "list-page") {
      const listSection = identifier;
      const listLabels: Record<string, string> = {
        sde: "SDE",
        rav: "RAV",
        expansion: "Expansion",
        "execution-options": "Execution Options",
        "test-case-data": "Test Case Data",
      };
      if (!listSection) {
        return "Test Case List";
      }
      if (listLabels[listSection]) {
        return listLabels[listSection];
      }

      const groupNumber = getGroupNumber(listSection, measure?.groups);
      return groupNumber
        ? `Population Criteria ${groupNumber}`
        : "Current section";
    }

    const testCase = measure?.testCases?.find(
      (candidate) =>
        candidate.id === subsection || candidate.uuid === subsection
    );
    if (testCase) {
      const groupNumber = getGroupNumber(
        testCase.groupId ?? testCase.groupUuid,
        measure?.groups
      );
      const groupText = groupNumber ? `, Group ${groupNumber}` : "";
      return `${testCase.title ?? testCase.name ?? "Test Case"}${groupText}`;
    }
  }

  return "Current section";
};
