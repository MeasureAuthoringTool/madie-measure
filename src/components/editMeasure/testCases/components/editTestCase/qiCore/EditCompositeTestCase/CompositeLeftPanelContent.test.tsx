import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CompositeLeftPanelContent from "./CompositeLeftPanelContent";

// --- Mock ALL heavy dependencies ---

jest.mock("../../../routes/qiCore/useExecutionContext", () => ({
  __esModule: true,
  default: () => ({
    measureState: [{}],
  }),
}));

jest.mock("../../../../util/QiCorePatientProvider", () => ({
  useQiCoreResource: jest.fn().mockReturnValue({
    state: { bundle: { entry: [] } },
    dispatch: jest.fn(),
  }),
  ResourceActionType: {},
}));

jest.mock("../../../../api/useFhirDefinitionsService", () => ({
  __esModule: true,
  default: () => ({
    getResources: jest.fn().mockResolvedValue([]),
  }),
}));

jest.mock("../../../../../../../api/useFhirElmTranslationServiceApi", () => ({
  __esModule: true,
  default: () => ({
    fetchRelevantDataElements: jest.fn().mockResolvedValue([]),
  }),
}));

jest.mock("../../../../api/useTestCaseServiceApi", () => ({
  __esModule: true,
  default: () => ({
    getTestCasesByMeasureId: jest.fn().mockResolvedValue([]),
  }),
}));

// --- Mock child UI components ---

jest.mock("./CompositeMeasuresTable", () => ({
  __esModule: true,
  default: () => <div data-testid="measure-list-tbl" />,
}));

jest.mock("./CompositeTestCasesTable", () => ({
  __esModule: true,
  default: () => <div data-testid="composite-test-cases-panel" />,
}));

jest.mock("../LeftPanel/ElementsTab/ElementsTab", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="elements-tab" data-active={props.activeTab} />
  ),
}));

jest.mock("../LeftPanel/ElementsTab/builder/HowItWorks/HowItWorks", () => ({
  __esModule: true,
  default: ({ isOpen }: any) =>
    isOpen ? (
      <div data-testid="how-it-works-content" />
    ) : (
      <button data-testid="how-it-works-link">How it works</button>
    ),
}));

jest.mock("../../../editor/Editor", () => ({
  __esModule: true,
  default: () => <div data-testid="json-editor" />,
}));

// --- Shared props ---

const baseProps = {
  leftPanelActiveTab: "available",
  setLeftPanelActiveTab: jest.fn(),
  editorVal: "",
  setEditorVal: jest.fn(),
  compositeMeasures: [{ id: "m1" }],
  testCaseCanEdit: true,
  formikStu6Context: {},
  testCase: {},
  setValidationSchema: jest.fn(),
  setInitialFormikValuesStu6: jest.fn(),
};

// --- Tests ---

describe("CompositeLeftPanelContent (light coverage)", () => {
  it("renders available tab with measures table", () => {
    render(<CompositeLeftPanelContent {...baseProps} />);

    expect(screen.getByTestId("available-panel")).toBeInTheDocument();
  });

  it("renders json tab", () => {
    render(
      <CompositeLeftPanelContent {...baseProps} leftPanelActiveTab="json" />
    );

    expect(screen.getByTestId("json-editor")).toBeInTheDocument();
  });

  it("renders added tab with ElementsTab", () => {
    render(
      <CompositeLeftPanelContent {...baseProps} leftPanelActiveTab="added" />
    );

    expect(screen.getByTestId("added-panel")).toBeInTheDocument();
  });

  it("does not render create panel when not on available tab", () => {
    render(
      <CompositeLeftPanelContent {...baseProps} leftPanelActiveTab="added" />
    );

    expect(screen.queryByTestId("create-panel")).not.toBeInTheDocument();
  });
});
