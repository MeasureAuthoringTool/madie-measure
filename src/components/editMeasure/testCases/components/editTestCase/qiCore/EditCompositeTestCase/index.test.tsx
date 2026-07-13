import * as React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import EditCompositeTestCase from "./index";

const mockFetchMeasuresByIds = jest.fn();

jest.mock("@madie/madie-util", () => ({
  ...jest.requireActual("@madie/madie-util"),
  useMeasureServiceApi: () => ({
    fetchMeasuresByIds: (...args: any[]) => mockFetchMeasuresByIds(...args),
  }),
}));

let mockExecutionContextReady = true;
jest.mock("../../../routes/qiCore/useExecutionContext", () => ({
  __esModule: true,
  default: () => ({
    executionContextReady: mockExecutionContextReady,
    measureState: [{}],
  }),
}));

jest.mock("./CompositeLeftPanelContent", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="create-panel">mock left panel</div>
  ),
}));

jest.mock("./CompositeRightPanelContent", () => ({
  __esModule: true,
  default: () => <div data-testid="right-panel">mock right panel</div>,
}));

const mockValidationPanelPane = jest.fn();
jest.mock("../ValidationPanelPane", () => ({
  __esModule: true,
  default: (props: any) => {
    mockValidationPanelPane(props);
    return (
      <div data-testid="validation-panel-pane">
        isQICore6:{String(props.isQICore6)} errors:
        {props.validationErrors?.length ?? 0}
      </div>
    );
  },
}));

jest.mock("allotment", () => {
  const React = require("react");
  const Allotment = React.forwardRef(({ children }: any, ref: any) => (
    <div data-testid="allotment" ref={ref}>
      {children}
    </div>
  ));
  (Allotment as any).Pane = ({ children }: any) => (
    <div data-testid="allotment-pane">{children}</div>
  );
  return { Allotment };
});

const measureWithComponents = {
  groups: [
    {
      components: [{ measureId: "m1" }, { measureId: "m2" }],
    },
  ],
};

const defaultProps = {
  allotmentRef: { current: null },
  editorVal: {},
  setEditorVal: jest.fn(),
  testCaseCanEdit: true,
  seriesState: { series: [] },
  isModified: () => false,
  setDiscardDialogOpen: jest.fn(),
  measure: measureWithComponents,
  formikStu6Context: null,
  testCase: null,
  setValidationSchema: jest.fn(),
  setInitialFormikValuesStu6: jest.fn(),
  validationErrors: [],
};

describe("EditCompositeTestCase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutionContextReady = true;
  });

  it("calls fetchMeasuresByIds and passes results to left panel", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([{ id: "m1" }, { id: "m2" }]);

    render(<EditCompositeTestCase {...defaultProps} />);

    await waitFor(() =>
      expect(mockFetchMeasuresByIds).toHaveBeenCalledWith(["m1", "m2"])
    );
    expect(screen.getByTestId("create-panel")).toBeInTheDocument();
  });

  it("disables discard/save when unmodified and enables when modified", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([]);

    const setDiscardDialogOpen = jest.fn();
    const { rerender } = render(
      <EditCompositeTestCase
        {...defaultProps}
        setDiscardDialogOpen={setDiscardDialogOpen}
      />
    );

    await waitFor(() => expect(mockFetchMeasuresByIds).toHaveBeenCalled());

    expect(screen.getByTestId("edit-test-case-discard-button")).toBeDisabled();

    expect(screen.getByTestId("edit-test-case-save-button")).toBeDisabled();

    rerender(
      <EditCompositeTestCase
        {...defaultProps}
        isModified={() => true}
        setDiscardDialogOpen={setDiscardDialogOpen}
      />
    );

    fireEvent.click(screen.getByTestId("edit-test-case-discard-button"));

    expect(setDiscardDialogOpen).toHaveBeenCalledWith(true);
  });

  it("handles empty results safely", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([]);

    render(<EditCompositeTestCase {...defaultProps} />);

    await waitFor(() => expect(mockFetchMeasuresByIds).toHaveBeenCalled());

    expect(screen.getByTestId("create-panel")).toBeInTheDocument();
  });

  it("logs an error when fetchMeasuresForComponents fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockFetchMeasuresByIds.mockRejectedValueOnce(new Error("fetch failed"));

    render(
      <EditCompositeTestCase
        {...defaultProps}
        measure={{
          groups: [
            {
              components: [{ measureId: "m1" }],
            },
          ],
        }}
      />
    );

    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith(
        "error retrieving components",
        expect.any(Error)
      )
    );

    consoleSpy.mockRestore();
  });

  it("triggers an empty block on request", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([{ id: "m1" }, { id: "m2" }]);

    render(<EditCompositeTestCase {...defaultProps} measure={{}} />);

    await waitFor(() => expect(mockFetchMeasuresByIds).not.toHaveBeenCalled());
    expect(screen.getByTestId("create-panel")).toBeInTheDocument();
  });

  it("fails to trigger a measureID push in the memo map", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([{ id: "m1" }, { id: "m2" }]);

    render(
      <EditCompositeTestCase
        {...defaultProps}
        measure={{
          groups: [
            {
              components: [{}],
            },
          ],
        }}
      />
    );

    await waitFor(() => expect(mockFetchMeasuresByIds).not.toHaveBeenCalled());
    expect(screen.getByTestId("create-panel")).toBeInTheDocument();
  });

  it("disables Run Test Case when editor JSON is empty", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([]);

    render(
      <EditCompositeTestCase
        {...defaultProps}
        editorVal=""
        validationErrors={[]}
      />
    );

    await waitFor(() => expect(mockFetchMeasuresByIds).toHaveBeenCalled());
    expect(screen.getByTestId("run-test-case-button")).toBeDisabled();
  });

  it("disables Run Test Case when execution context is not ready", async () => {
    mockExecutionContextReady = false;
    mockFetchMeasuresByIds.mockResolvedValueOnce([]);

    render(
      <EditCompositeTestCase
        {...defaultProps}
        editorVal='{"resourceType":"Bundle"}'
        validationErrors={[]}
      />
    );

    await waitFor(() => expect(mockFetchMeasuresByIds).toHaveBeenCalled());
    expect(screen.getByTestId("run-test-case-button")).toBeDisabled();
  });

  it("disables Run Test Case when validation errors have error severity", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([]);

    render(
      <EditCompositeTestCase
        {...defaultProps}
        editorVal='{"resourceType":"Bundle"}'
        validationErrors={[{ severity: "error" }]}
      />
    );

    await waitFor(() => expect(mockFetchMeasuresByIds).toHaveBeenCalled());
    expect(screen.getByTestId("run-test-case-button")).toBeDisabled();
  });

  it("enables Run Test Case despite validation errors when executeInvalidTestCases is true", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([]);

    render(
      <EditCompositeTestCase
        {...defaultProps}
        editorVal='{"resourceType":"Bundle"}'
        validationErrors={[{ severity: "error" }]}
        measure={{
          ...measureWithComponents,
          testCaseConfiguration: { executeInvalidTestCases: true },
        }}
      />
    );

    await waitFor(() => expect(mockFetchMeasuresByIds).toHaveBeenCalled());
    expect(screen.getByTestId("run-test-case-button")).not.toBeDisabled();
  });

  it("enables Run Test Case when JSON is valid, no validation errors, and context is ready", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([]);

    render(
      <EditCompositeTestCase
        {...defaultProps}
        editorVal='{"resourceType":"Bundle"}'
        validationErrors={[]}
      />
    );

    await waitFor(() => expect(mockFetchMeasuresByIds).toHaveBeenCalled());
    expect(screen.getByTestId("run-test-case-button")).not.toBeDisabled();
  });

  it("ignores validation errors with non-error severity", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([]);

    render(
      <EditCompositeTestCase
        {...defaultProps}
        editorVal='{"resourceType":"Bundle"}'
        validationErrors={[{ severity: "warning" }, { severity: "info" }]}
      />
    );

    await waitFor(() => expect(mockFetchMeasuresByIds).toHaveBeenCalled());
    expect(screen.getByTestId("run-test-case-button")).not.toBeDisabled();
  });

  it("renders the ValidationPanelPane with validationErrors and testCase", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([]);
    const testCase = { validationStatus: "VALID" };
    const validationErrors = [{ severity: "error" }, { severity: "warning" }];

    render(
      <EditCompositeTestCase
        {...defaultProps}
        testCase={testCase}
        validationErrors={validationErrors}
      />
    );

    await waitFor(() => expect(mockFetchMeasuresByIds).toHaveBeenCalled());

    expect(screen.getByTestId("validation-panel-pane")).toBeInTheDocument();
    expect(mockValidationPanelPane).toHaveBeenCalledWith(
      expect.objectContaining({
        testCase,
        validationErrors,
        allotmentRef: defaultProps.allotmentRef,
      })
    );
  });

  it("passes isQICore6=true when measure model is QI-Core v6.0.0", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([]);

    render(
      <EditCompositeTestCase
        {...defaultProps}
        measure={{ ...measureWithComponents, model: "QI-Core v6.0.0" }}
      />
    );

    await waitFor(() => expect(mockFetchMeasuresByIds).toHaveBeenCalled());

    expect(screen.getByTestId("validation-panel-pane")).toHaveTextContent(
      "isQICore6:true"
    );
  });

  it("passes isQICore6=false when measure model is not QI-Core v6.0.0", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([]);

    render(
      <EditCompositeTestCase
        {...defaultProps}
        measure={{ ...measureWithComponents, model: "QI-Core v4.1.1" }}
      />
    );

    await waitFor(() => expect(mockFetchMeasuresByIds).toHaveBeenCalled());

    expect(screen.getByTestId("validation-panel-pane")).toHaveTextContent(
      "isQICore6:false"
    );
  });
});
