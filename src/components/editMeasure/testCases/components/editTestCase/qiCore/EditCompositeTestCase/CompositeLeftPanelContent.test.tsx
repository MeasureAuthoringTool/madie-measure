import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import CompositeLeftPanelContent from "./CompositeLeftPanelContent";
import { useQiCoreResource } from "../../../../util/QiCorePatientProvider";

// --- Mock external API services (expensive/external dependencies) ---

jest.mock("../../../routes/qiCore/useExecutionContext", () => ({
  __esModule: true,
  default: () => ({
    measureState: [{}],
  }),
}));

jest.mock("../../../../util/QiCorePatientProvider", () => ({
  useQiCoreResource: jest.fn(),
  ResourceActionType: {
    MODIFY_BUNDLE_ENTRY: "ModifyBundleEntry",
    ADD_BUNDLE_ENTRY: "AddBundleEntry",
  },
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
    fetchRelevantDataElements: jest
      .fn()
      .mockReturnValue(new Promise(() => undefined)),
  }),
}));

jest.mock("../../../../api/useTestCaseServiceApi", () => ({
  __esModule: true,
  default: () => ({
    getTestCasesByMeasureId: jest
      .fn()
      .mockResolvedValue([
        { id: "tc-source", json: '{"resourceType":"Bundle","entry":[]}' },
      ]),
  }),
}));

// --- Mock essential child UI components for test isolation ---
jest.mock("./CompositeTestCasesTable", () => ({
  __esModule: true,
  default: ({ onInsertProfilesFromTestCase }) => (
    <div data-testid="composite-test-cases-panel">
      <button
        data-testid="trigger-insert-callback"
        onClick={() =>
          onInsertProfilesFromTestCase?.({
            id: "tc-source",
            json: '{"resourceType":"Bundle","entry":[]}',
          })
        }
      >
        Trigger Insert
      </button>
    </div>
  ),
}));

jest.mock("./CompositeProfilesViews", () => ({
  __esModule: true,
  default: ({ handleSelectTestCase }) => (
    <button
      data-testid="select-measure-for-test-cases"
      onClick={() => handleSelectTestCase({ id: "measure-1" })}
    >
      Select Measure
    </button>
  ),
}));

jest.mock("../LeftPanel/ElementsTab/ElementsTab", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="elements-tab" data-active={props.activeTab}>
      <button data-testid="open-insert-tab" onClick={props.onInsertTCClick}>
        Open Insert Tab
      </button>
    </div>
  ),
}));

jest.mock("../../../editor/Editor", () => ({
  __esModule: true,
  default: () => <div data-testid="json-editor" />,
}));

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

describe("CompositeLeftPanelContent", () => {
  const mockDispatch = jest.fn();

  const openInsertAndRenderCases = async () => {
    userEvent.click(screen.getByTestId("open-insert-tab"));
    userEvent.click(screen.getByTestId("select-measure-for-test-cases"));
    await screen.findByTestId("composite-test-cases-panel");
  };

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders available tab with measures table", () => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: { bundle: { entry: [] } },
      dispatch: mockDispatch,
    });
    render(<CompositeLeftPanelContent {...baseProps} />);

    expect(screen.getByTestId("available-panel")).toBeInTheDocument();
  });

  it("renders json tab", () => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: { bundle: { entry: [] } },
      dispatch: mockDispatch,
    });
    render(
      <CompositeLeftPanelContent {...baseProps} leftPanelActiveTab="json" />
    );

    expect(screen.getByTestId("json-editor")).toBeInTheDocument();
  });

  it("renders added tab with ElementsTab", () => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: { bundle: { entry: [] } },
      dispatch: mockDispatch,
    });
    render(
      <CompositeLeftPanelContent {...baseProps} leftPanelActiveTab="added" />
    );

    expect(screen.getByTestId("added-panel")).toBeInTheDocument();
  });

  it("does not render create panel when not on available tab", () => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: { bundle: { entry: [] } },
      dispatch: mockDispatch,
    });
    render(
      <CompositeLeftPanelContent {...baseProps} leftPanelActiveTab="added" />
    );

    expect(screen.queryByTestId("create-panel")).not.toBeInTheDocument();
  });

  it("shows error toast when selected test case bundle is invalid", async () => {
    const setEditorVal = jest.fn();
    const dispatch = jest.fn();
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: { bundle: { entry: [] } },
      dispatch,
    });

    render(
      <CompositeLeftPanelContent
        {...baseProps}
        setEditorVal={setEditorVal}
        testCase={{ json: "invalid-json-{" }}
      />
    );

    await openInsertAndRenderCases();
    userEvent.click(screen.getByTestId("trigger-insert-callback"));

    expect(
      await screen.findByTestId("composite-profile-insert-toast")
    ).toHaveTextContent("Unable to insert profiles from selected testcase");
    expect(dispatch).not.toHaveBeenCalled();
    expect(setEditorVal).not.toHaveBeenCalled();
  });

  it("calls setEditorVal and shows success when bundle insert succeeds", async () => {
    const setEditorVal = jest.fn();
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: {
        bundle: {
          entry: [
            {
              fullUrl: "https://madie.cms.gov/Patient/current-patient-id",
              resource: {
                resourceType: "Patient",
                id: "current-patient-id",
              },
            },
          ],
        },
      },
      dispatch: jest.fn(),
    });

    const selectedBundle = {
      resourceType: "Bundle",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: "source-patient-id",
            gender: "female",
          },
        },
      ],
    };

    render(
      <CompositeLeftPanelContent
        {...baseProps}
        setEditorVal={setEditorVal}
        testCase={{ json: JSON.stringify(selectedBundle) }}
      />
    );

    await openInsertAndRenderCases();
    userEvent.click(screen.getByTestId("trigger-insert-callback"));

    await waitFor(() => {
      expect(setEditorVal).toHaveBeenCalled();
    });
    expect(
      await screen.findByTestId("composite-profile-insert-toast")
    ).toHaveTextContent("Profiles were inserted successfully");
  });

  it("skips dispatch when context dispatch is unavailable", async () => {
    const setEditorVal = jest.fn();
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: {
        bundle: {
          entry: [
            {
              resource: {
                resourceType: "Patient",
                id: "current-patient-id",
              },
            },
          ],
        },
      },
      dispatch: undefined,
    });

    const selectedBundle = {
      resourceType: "Bundle",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: "source-patient-id",
            gender: "male",
          },
        },
      ],
    };

    render(
      <CompositeLeftPanelContent
        {...baseProps}
        setEditorVal={setEditorVal}
        testCase={{ json: JSON.stringify(selectedBundle) }}
      />
    );

    await openInsertAndRenderCases();
    userEvent.click(screen.getByTestId("trigger-insert-callback"));

    expect(setEditorVal).toHaveBeenCalled();
    expect(
      screen.queryByTestId("composite-profile-insert-toast")
    ).not.toBeInTheDocument();
  });
});
