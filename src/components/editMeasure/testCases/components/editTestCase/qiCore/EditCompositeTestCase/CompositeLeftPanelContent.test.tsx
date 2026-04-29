import * as React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { useFormik } from "formik";
import CompositeLeftPanelContent from "./CompositeLeftPanelContent";

// --- Mocks ---

// Editor wraps AceEditor (react-ace) which requires native browser APIs
// not available in jsdom, so we provide a lightweight mock.
jest.mock("../../../editor/Editor", () => ({
  __esModule: true,
  default: ({ value, onChange, readOnly }: any) => (
    <textarea
      data-testid="json-editor"
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

// ElementsTab -> Builder requires the full ApiContext + fhirService config
// and QiCoreResourceProvider. Setting all of that up just to verify the
// "added" branch renders pulls in significantly more than what this suite
// covers, so we replace it with a marker component.
jest.mock("../LeftPanel/ElementsTab/ElementsTab", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="elements-tab-mock"
      data-can-edit={String(props.canEdit)}
      data-active-tab={props.activeTab}
    />
  ),
}));

const mockGetTestCasesByMeasureId = jest.fn();

jest.mock("../../../../api/useTestCaseServiceApi", () => ({
  __esModule: true,
  default: () => ({
    getTestCasesByMeasureId: mockGetTestCasesByMeasureId,
  }),
}));

// --- Helpers ---

const makeTestCase = (overrides: any = {}): any => ({
  id: "tc1",
  title: "Test Case Alpha",
  description: "Desc Alpha",
  series: "GroupA",
  name: "tc-alpha",
  createdAt: "",
  createdBy: "",
  lastModifiedAt: "",
  lastModifiedBy: "",
  executionStatus: "",
  groupPopulations: [],
  validResource: true,
  hapiOperationOutcome: null,
  validationStatus: "Valid",
  patientId: "p1",
  createdBeforeVersioning: false,
  ...overrides,
});

const mockMeasures: any[] = [
  {
    id: "m1",
    measureName: "Measure One",
    version: "1.0.000",
    lastModifiedAt: "2026-02-01T00:00:00Z",
    measureSet: { cmsId: "CMS111" },
  },
  {
    id: "m2",
    measureName: "Measure Two",
    version: "2.0.000",
    lastModifiedAt: "2026-01-01T00:00:00Z",
    measureSet: { cmsId: "CMS222" },
  },
];

const mockTestCases = [
  makeTestCase({
    id: "tc1",
    title: "Test Case Alpha",
    description: "Desc Alpha",
    series: "GroupA",
  }),
  makeTestCase({
    id: "tc2",
    title: "Test Case Beta",
    description: "Desc Beta",
    series: "GroupB",
  }),
  makeTestCase({
    id: "tc3",
    title: "Test Case Gamma",
    description: "Desc Gamma",
    series: "GroupA",
    validResource: false,
  }),
];

const defaultProps = {
  leftPanelActiveTab: "create",
  setLeftPanelActiveTab: jest.fn(),
  editorVal: '{"resourceType":"Bundle"}',
  setEditorVal: jest.fn(),
  compositeMeasures: mockMeasures,
  testCaseCanEdit: true,
  formikStu6Context: null,
  testCase: null,
  setValidationSchema: jest.fn(),
  setInitialFormikValuesStu6: jest.fn(),
};

describe("CompositeLeftPanelContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTestCasesByMeasureId.mockResolvedValue(mockTestCases);
  });

  const clickSelectTestCaseAndWait = async (buttonIndex: number) => {
    const selectBtns = screen.getAllByRole("button", {
      name: /Select Test Case/i,
    });
    await act(async () => {
      fireEvent.click(selectBtns[buttonIndex]);
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("composite-test-cases-panel")
      ).toBeInTheDocument();
    });
  };

  // --- Initial Measures Table View ---

  it("renders measures table with header and count when elements tab is active", () => {
    render(<CompositeLeftPanelContent {...defaultProps} />);

    expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument();
    expect(screen.getByText("Measure One")).toBeInTheDocument();
    expect(screen.getByText("Measure Two")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Select Which Measures to choose Test Case Profiles from:"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/0 of 2 Measures \(Components\) complete/)
    ).toBeInTheDocument();
  });

  it("does not show measures table when no measures are provided", () => {
    render(
      <CompositeLeftPanelContent {...defaultProps} compositeMeasures={[]} />
    );
    expect(screen.queryByTestId("measure-list-tbl")).not.toBeInTheDocument();
  });

  // --- JSON tab ---

  it("renders the JSON editor when json tab is active", () => {
    render(
      <CompositeLeftPanelContent {...defaultProps} leftPanelActiveTab="json" />
    );

    expect(screen.getByTestId("json-editor")).toBeInTheDocument();
    expect(screen.queryByTestId("measure-list-tbl")).not.toBeInTheDocument();
  });

  it("fetches and displays only valid test cases when Select Test Case is clicked", async () => {
    render(<CompositeLeftPanelContent {...defaultProps} />);

    await clickSelectTestCaseAndWait(0);

    expect(mockGetTestCasesByMeasureId).toHaveBeenCalledWith("m1");
    expect(screen.queryByTestId("measure-list-tbl")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(2);
    expect(screen.queryByText("Test Case Gamma")).not.toBeInTheDocument();
    expect(screen.getByText("Measure One")).toBeInTheDocument();
    expect(screen.getByText("(CMS ID: CMS111)")).toBeInTheDocument();
    expect(screen.getByText("2 Test Cases")).toBeInTheDocument();
  });

  // --- Back to Measures ---

  it("navigates back to measures table when 'Back to All Measures' is clicked", async () => {
    render(<CompositeLeftPanelContent {...defaultProps} />);

    await clickSelectTestCaseAndWait(0);
    fireEvent.click(screen.getByTestId("back-to-measures-btn"));

    expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument();
    expect(
      screen.queryByTestId("composite-test-cases-panel")
    ).not.toBeInTheDocument();
  });

  it("shows empty test cases panel when API call fails", async () => {
    mockGetTestCasesByMeasureId.mockReset();
    mockGetTestCasesByMeasureId.mockRejectedValue(new Error("Network error"));
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<CompositeLeftPanelContent {...defaultProps} />);

    const selectBtns = screen.getAllByRole("button", {
      name: /Select Test Case/i,
    });
    await act(async () => {
      fireEvent.click(selectBtns[0]);
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("composite-test-cases-panel")
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId("no-test-cases-message")).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it("supports search and filter within the test cases view", async () => {
    render(<CompositeLeftPanelContent {...defaultProps} />);

    await clickSelectTestCaseAndWait(0);

    const searchInput = screen.getByTestId("tc-search-input");
    const filterSelect = screen.getByTestId("tc-filter-by-select-input");

    // default filter searches all fields — match by series
    fireEvent.change(searchInput, { target: { value: "GroupB" } });
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(1);
    expect(screen.getByText("Test Case Beta")).toBeInTheDocument();

    // specific filter: Group only — "Alpha" is in title, not series
    fireEvent.change(filterSelect, { target: { value: "Group" } });
    fireEvent.change(searchInput, { target: { value: "GroupB" } });
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(1);

    // clear resets everything
    fireEvent.click(screen.getByTestId("tc-clear-search"));
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(2);
  });

  it("can navigate between different measures' test cases", async () => {
    render(<CompositeLeftPanelContent {...defaultProps} />);

    await clickSelectTestCaseAndWait(0);
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(2);
    expect(mockGetTestCasesByMeasureId).toHaveBeenCalledWith("m1");

    // Go back and select second measure
    fireEvent.click(screen.getByTestId("back-to-measures-btn"));
    expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument();

    mockGetTestCasesByMeasureId.mockResolvedValue([
      makeTestCase({ id: "tc-m2-1", title: "M2 TC One", series: "G1" }),
    ]);

    await clickSelectTestCaseAndWait(1);

    expect(mockGetTestCasesByMeasureId).toHaveBeenCalledWith("m2");
    expect(screen.getByText("Measure Two")).toBeInTheDocument();
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(1);
  });

  // --- "added" tab (ElementsTab branch) ---

  describe("added tab", () => {
    // Helper component that provides a real formik bag to satisfy FormikProvider.
    const AddedTabHarness = () => {
      const formik = useFormik({
        initialValues: { foo: "" },
        onSubmit: () => undefined,
      });
      return (
        <CompositeLeftPanelContent
          {...defaultProps}
          leftPanelActiveTab="added"
          formikStu6Context={formik}
          testCase={{ id: "tc1" } as any}
        />
      );
    };

    it("renders ElementsTab inside the added panel and forwards key props", () => {
      render(<AddedTabHarness />);

      expect(screen.getByTestId("added-panel")).toBeInTheDocument();
      const elementsTab = screen.getByTestId("elements-tab-mock");
      expect(elementsTab).toBeInTheDocument();
      // canEdit is currently locked to false (MAT-9905)
      expect(elementsTab).toHaveAttribute("data-can-edit", "false");
      expect(elementsTab).toHaveAttribute("data-active-tab", "added");

      // Other panels should not render
      expect(screen.queryByTestId("create-panel")).not.toBeInTheDocument();
      expect(screen.queryByTestId("json-editor")).not.toBeInTheDocument();
    });
  });

  // --- HowItWorks integration on the no-measure-selected view ---

  describe("HowItWorks on measures view", () => {
    it("renders HowItWorks closed (link visible) by default", () => {
      render(<CompositeLeftPanelContent {...defaultProps} />);
      expect(screen.getByTestId("how-it-works-link")).toBeInTheDocument();
      expect(
        screen.queryByTestId("how-it-works-content")
      ).not.toBeInTheDocument();
    });

    it("opens the HowItWorks panel when the link is clicked", async () => {
      render(<CompositeLeftPanelContent {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId("how-it-works-link"));
      });
      expect(screen.getByTestId("how-it-works-content")).toBeInTheDocument();
    });

    it("closes the HowItWorks panel when the close button is clicked", async () => {
      render(<CompositeLeftPanelContent {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId("how-it-works-link"));
      });
      expect(screen.getByTestId("how-it-works-content")).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByTestId("how-it-works-close"));
      });
      expect(
        screen.queryByTestId("how-it-works-content")
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("how-it-works-link")).toBeInTheDocument();
    });
  });
});
