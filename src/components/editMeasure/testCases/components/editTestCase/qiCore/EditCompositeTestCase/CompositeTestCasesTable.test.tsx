import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import CompositeTestCasesTable from "./CompositeTestCasesTable";

// --- Helpers ---

const makeTestCase = (overrides: any = {}): any => ({
  id: "tc1",
  title: "Test Case Alpha",
  description: "Description Alpha",
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

const mockMeasure: any = {
  id: "m1",
  measureName: "My Composite Measure",
  measureSet: { cmsId: 123 },
};

const testCases = [
  makeTestCase({
    id: "tc1",
    title: "Test Case Alpha",
    description: "Description Alpha",
    series: "GroupA",
  }),
  makeTestCase({
    id: "tc2",
    title: "Test Case Beta",
    description: "Description Beta",
    series: "GroupB",
  }),
  makeTestCase({
    id: "tc3",
    title: "Test Case Gamma",
    description: "Description Gamma",
    series: "GroupA",
  }),
  makeTestCase({
    id: "tc-invalid",
    title: "Invalid TC",
    description: "Bad one",
    series: "GroupC",
    validResource: false,
  }),
];

const getValidTestCaseIds = (items: any[]) =>
  new Set(items.filter((tc) => tc.validResource).map((tc) => tc.id));

describe("CompositeTestCasesTable", () => {
  const defaultProps = {
    testCases,
    validTestCaseIds: getValidTestCaseIds(testCases),
    selectedMeasure: mockMeasure,
    hideInvalidTestCases: false,
    onHideInvalidTestCasesChange: jest.fn(),
    onBackToMeasures: jest.fn(),
    onViewTestCase: jest.fn(),
    onInsertTestCase: jest.fn(),
    onInsertProfilesFromTestCase: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders header, measure info, back button, search controls, hide toggle, and table columns", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);

    expect(
      screen.getByTestId("composite-test-cases-panel")
    ).toBeInTheDocument();
    expect(screen.getByTestId("back-to-measures-btn")).toBeInTheDocument();
    expect(
      screen.getByText(
        "2. Select which Test Case to insert into composite test case:"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("My Composite Measure")).toBeInTheDocument();
    expect(screen.getByText("(CMS ID: 0123)")).toBeInTheDocument();
    expect(screen.getByTestId("tc-filter-by-select")).toBeInTheDocument();
    expect(screen.getByTestId("tc-search")).toBeInTheDocument();
    expect(screen.getByTestId("tc-search-input")).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Hide invalid test cases" })
    ).not.toBeChecked();
    expect(
      screen.getByTestId("hide-invalid-test-cases-checkbox")
    ).toBeInTheDocument();
    expect(screen.getByText("Hide invalid test cases")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Group$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Title$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Description$/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/^Insert$/i)).toHaveLength(4);
  });

  it("does not show CMS ID when measureSet.cmsId is absent", () => {
    render(
      <CompositeTestCasesTable
        {...defaultProps}
        selectedMeasure={{ ...mockMeasure, measureSet: {} }}
      />
    );
    expect(screen.queryByText(/CMS ID/)).not.toBeInTheDocument();
  });

  it("displays all test cases by default (including invalid ones) and shows correct count", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);

    const rows = screen.getAllByTestId("tc-row-item");
    expect(rows).toHaveLength(4);
    expect(screen.getByText("4 Test Cases")).toBeInTheDocument();
    expect(screen.getByText("Invalid TC")).toBeInTheDocument();
    // verify cell content renders
    expect(screen.getAllByText("GroupA").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Test Case Alpha")).toBeInTheDocument();
    expect(screen.getByText("Description Alpha")).toBeInTheDocument();
  });

  it("displays invalid chip and tooltip for invalid test cases", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);

    const invalidChip = screen.getByTestId("tc-invalid-chip-tc-invalid");
    expect(invalidChip).toBeInTheDocument();
    expect(invalidChip).toHaveTextContent("Invalid");
  });

  it("disables insert button for invalid test cases", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);

    const validInsertBtn = screen.getByTestId("insert-test-case-btn-tc1");
    const invalidInsertBtn = screen.getByTestId(
      "insert-test-case-btn-tc-invalid"
    );

    expect(validInsertBtn).not.toBeDisabled();
    expect(invalidInsertBtn).toBeDisabled();
  });

  it("hides invalid test cases when toggle is checked", async () => {
    render(
      <CompositeTestCasesTable {...defaultProps} hideInvalidTestCases={true} />
    );

    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(3);
    expect(screen.queryByText("Invalid TC")).not.toBeInTheDocument();
    expect(screen.getByText("3 Test Cases")).toBeInTheDocument();
  });

  it("shows invalid test cases again when toggle is unchecked", () => {
    const { rerender } = render(
      <CompositeTestCasesTable {...defaultProps} hideInvalidTestCases={true} />
    );

    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(3);

    rerender(
      <CompositeTestCasesTable {...defaultProps} hideInvalidTestCases={false} />
    );

    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(4);
    expect(screen.getByText("Invalid TC")).toBeInTheDocument();
  });

  it("shows 'No valid test cases found.' message when toggle is on and all are invalid", () => {
    render(
      <CompositeTestCasesTable
        {...defaultProps}
        testCases={[makeTestCase({ id: "x", validResource: false })]}
        validTestCaseIds={new Set()}
        hideInvalidTestCases={true}
      />
    );

    expect(screen.getByTestId("no-test-cases-message")).toBeInTheDocument();
    expect(screen.getByText("No valid test cases found.")).toBeInTheDocument();
  });

  it("shows invalid test case when toggle is off and test case is invalid", () => {
    render(
      <CompositeTestCasesTable
        {...defaultProps}
        testCases={[
          makeTestCase({
            id: "x",
            title: "Invalid Test",
            validResource: false,
          }),
        ]}
      />
    );

    expect(screen.getByTestId("tc-row-item")).toBeInTheDocument();
    expect(screen.getByText("Invalid Test")).toBeInTheDocument();
    expect(screen.getByTestId("tc-invalid-chip-x")).toBeInTheDocument();
  });

  it("reports the new hide invalid test cases value when toggled", async () => {
    const onHideInvalidTestCasesChange = jest.fn();
    render(
      <CompositeTestCasesTable
        {...defaultProps}
        onHideInvalidTestCasesChange={onHideInvalidTestCasesChange}
      />
    );

    const toggle = screen.getByTestId("hide-invalid-test-cases-checkbox");
    await userEvent.click(toggle);

    expect(onHideInvalidTestCasesChange).toHaveBeenCalledWith(true);
  });

  it("resets to page 1 when hide invalid test cases toggle is clicked", async () => {
    const manyTcs = Array.from({ length: 15 }, (_, i) =>
      makeTestCase({
        id: `tc-${i}`,
        title: `TC ${i}`,
        series: `G${i}`,
        description: `Desc ${i}`,
      })
    );
    manyTcs.push(
      makeTestCase({
        id: "tc-invalid-2",
        title: "Invalid TC 2",
        series: "GroupD",
        description: "Bad two",
        validResource: false,
      })
    );

    render(
      <CompositeTestCasesTable
        {...defaultProps}
        testCases={manyTcs}
        validTestCaseIds={getValidTestCaseIds(manyTcs)}
      />
    );

    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(10);

    const toggle = screen.getByTestId("hide-invalid-test-cases-checkbox");
    await userEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getAllByTestId("tc-row-item")).toHaveLength(10);
    });
  });

  it("calls onBackToMeasures when back button is clicked", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);
    userEvent.click(screen.getByTestId("back-to-measures-btn"));
    expect(defaultProps.onBackToMeasures).toHaveBeenCalledTimes(1);
  });

  it("calls onViewTestCase with the correct test case", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);
    userEvent.click(screen.getByTestId("view-test-case-btn-tc2"));
    expect(defaultProps.onViewTestCase).toHaveBeenCalledWith(
      expect.objectContaining({ id: "tc2", title: "Test Case Beta" })
    );
  });

  it("calls onInsertProfilesFromTestCase with the correct test case", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);
    userEvent.click(screen.getByTestId("insert-test-case-btn-tc2"));
    expect(defaultProps.onInsertProfilesFromTestCase).toHaveBeenCalledWith(
      expect.objectContaining({ id: "tc2", title: "Test Case Beta" })
    );
  });

  it("renders title attributes for view and insert action buttons", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);

    expect(screen.getByTestId("view-test-case-btn-tc1")).toHaveAttribute(
      "title",
      "View test case"
    );
    expect(screen.getByTestId("insert-test-case-btn-tc1")).toHaveAttribute(
      "title",
      "Insert Profiles from Test Case"
    );
  });

  it("sets insert button title for tooltip text", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);
    expect(screen.getByTestId("insert-test-case-btn-tc1")).toHaveAttribute(
      "title",
      "Insert Profiles from Test Case"
    );
  });

  // --- Search & Filter ---

  it("searches across all fields when default filter (-) is selected", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);
    const searchInput = screen.getByTestId("tc-search-input");

    // match by title
    fireEvent.change(searchInput, { target: { value: "Alpha" } });
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(1);
    expect(screen.getByText("Test Case Alpha")).toBeInTheDocument();
    expect(screen.getByText("1 Test Cases")).toBeInTheDocument();

    // match by group (series)
    fireEvent.change(searchInput, { target: { value: "GroupB" } });
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(1);
    expect(screen.getByText("Test Case Beta")).toBeInTheDocument();

    // match by description
    fireEvent.change(searchInput, { target: { value: "Description Gamma" } });
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(1);
    expect(screen.getByText("Test Case Gamma")).toBeInTheDocument();

    // case-insensitive
    fireEvent.change(searchInput, { target: { value: "alpha" } });
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(1);

    // no match shows empty message
    fireEvent.change(searchInput, { target: { value: "ZZZZZ" } });
    expect(screen.getByTestId("no-test-cases-message")).toBeInTheDocument();

    // clearing search restores all valid rows
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(4);
  });

  it("filters only by the selected field when a specific filter is chosen", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);
    const filterSelect = screen.getByTestId("tc-filter-by-select-input");
    const searchInput = screen.getByTestId("tc-search-input");

    // Group filter: matches series, not title
    fireEvent.change(filterSelect, { target: { value: "Group" } });
    fireEvent.change(searchInput, { target: { value: "GroupA" } });
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(2);

    fireEvent.change(searchInput, { target: { value: "Alpha" } });
    expect(screen.getByTestId("no-test-cases-message")).toBeInTheDocument();

    // Title filter: matches title, not description
    fireEvent.change(filterSelect, { target: { value: "Title" } });
    fireEvent.change(searchInput, { target: { value: "Beta" } });
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(1);
    expect(screen.getByText("Test Case Beta")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "Description Alpha" } });
    expect(screen.getByTestId("no-test-cases-message")).toBeInTheDocument();

    // Description filter
    fireEvent.change(filterSelect, { target: { value: "Description" } });
    fireEvent.change(searchInput, { target: { value: "Gamma" } });
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(1);
    expect(screen.getByText("Test Case Gamma")).toBeInTheDocument();
  });

  it("clears search text and filter when clear button is clicked", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);
    const filterSelect = screen.getByTestId("tc-filter-by-select-input");
    const searchInput = screen.getByTestId("tc-search-input");

    fireEvent.change(filterSelect, { target: { value: "Title" } });
    fireEvent.change(searchInput, { target: { value: "Beta" } });
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(1);

    userEvent.click(screen.getByTestId("tc-clear-search"));
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(4);
    expect(searchInput).toHaveValue("");
  });

  // --- Sorting ---

  it("sorts columns when header is clicked", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);
    const titleHeader = screen.getByRole("button", { name: /^Title$/i });
    const th = titleHeader.closest("th")!;

    // ascending
    userEvent.click(th);
    expect(titleHeader).toHaveAttribute("title", "Sort descending");

    // descending
    userEvent.click(th);
    expect(titleHeader).toHaveAttribute("title", "Clear sort");

    // clear sort
    userEvent.click(th);
    expect(titleHeader).toHaveAttribute("title", "Sort ascending");
  });

  // --- Pagination ---

  it("paginates test cases when there are more than the limit", () => {
    const manyTcs = Array.from({ length: 15 }, (_, i) =>
      makeTestCase({
        id: `tc-${i}`,
        title: `TC ${i}`,
        series: `G${i}`,
        description: `Desc ${i}`,
      })
    );
    render(
      <CompositeTestCasesTable
        {...defaultProps}
        testCases={manyTcs}
        validTestCaseIds={getValidTestCaseIds(manyTcs)}
      />
    );

    // default limit is 10
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(10);
    expect(screen.getByText("15 Test Cases")).toBeInTheDocument();
  });

  // --- Search trigger (Enter key & icon click) ---

  it("triggers search on Enter keypress (resetting page to 1)", () => {
    const manyTcs = Array.from({ length: 15 }, (_, i) =>
      makeTestCase({
        id: `tc-${i}`,
        title: `TC ${i}`,
        series: `G${i}`,
        description: `Desc ${i}`,
      })
    );
    render(
      <CompositeTestCasesTable
        {...defaultProps}
        testCases={manyTcs}
        validTestCaseIds={getValidTestCaseIds(manyTcs)}
      />
    );
    const searchInput = screen.getByTestId("tc-search-input");
    // Pressing Enter should call handleSearch (covers the Enter branch)
    fireEvent.keyPress(searchInput, {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });
    // Pressing a non-Enter key should NOT throw and is a no-op for search
    fireEvent.keyPress(searchInput, { key: "a", code: "KeyA", charCode: 97 });
    expect(screen.getByText("15 Test Cases")).toBeInTheDocument();
  });

  it("triggers search when the search adornment icon is clicked", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);
    const searchInput = screen.getByTestId("tc-search-input");
    fireEvent.change(searchInput, { target: { value: "Alpha" } });
    userEvent.click(screen.getByTestId("tc-trigger-search"));
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(1);
  });

  // --- Header hover (sort indicator) ---

  it("shows the unfold (sort) icon on header hover when not sorted", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);
    const titleHeader = screen.getByRole("button", { name: /^Title$/i });
    const th = titleHeader.closest("th")!;
    fireEvent.mouseEnter(th);
    // UnfoldMoreIcon should appear in the hovered, unsorted header
    expect(th.querySelector('[data-testid="UnfoldMoreIcon"]')).toBeTruthy();
    fireEvent.mouseLeave(th);
    expect(th.querySelector('[data-testid="UnfoldMoreIcon"]')).toBeFalsy();
  });

  // --- Pagination interaction ---

  it("changes page when next/prev pagination buttons are clicked", async () => {
    const manyTcs = Array.from({ length: 15 }, (_, i) =>
      makeTestCase({
        id: `tc-${i}`,
        title: `TC ${i}`,
        series: `G${i}`,
        description: `Desc ${i}`,
      })
    );
    render(
      <CompositeTestCasesTable
        {...defaultProps}
        testCases={manyTcs}
        validTestCaseIds={getValidTestCaseIds(manyTcs)}
      />
    );

    // page 1: 10 rows shown
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(10);
    expect(screen.getByText("TC 0")).toBeInTheDocument();
    expect(screen.queryByText("TC 14")).not.toBeInTheDocument();

    const nextButton = await screen.findByLabelText("Go to next page");
    userEvent.click(nextButton);

    await waitFor(() => {
      // page 2: only 5 rows
      expect(screen.getAllByTestId("tc-row-item")).toHaveLength(5);
    });
    expect(screen.getByText("TC 14")).toBeInTheDocument();

    const prevButton = await screen.findByLabelText("Go to previous page");
    userEvent.click(prevButton);
    await waitFor(() => {
      expect(screen.getAllByTestId("tc-row-item")).toHaveLength(10);
    });
  });

  it("changes the page size when a numeric limit is selected", async () => {
    const manyTcs = Array.from({ length: 30 }, (_, i) =>
      makeTestCase({
        id: `tc-${i}`,
        title: `TC ${i}`,
        series: `G${i}`,
        description: `Desc ${i}`,
      })
    );
    render(
      <CompositeTestCasesTable
        {...defaultProps}
        testCases={manyTcs}
        validTestCaseIds={getValidTestCaseIds(manyTcs)}
      />
    );
    expect(screen.getAllByTestId("tc-row-item")).toHaveLength(10);

    // There are two comboboxes on the page (Filter By + page-limit). The
    // page-limit combobox is the last one rendered (inside Pagination).
    const comboboxes = await screen.findAllByRole("combobox", {
      expanded: false,
    });
    const limitCombobox = comboboxes[comboboxes.length - 1];
    userEvent.click(limitCombobox);
    // limitOptions are [10, 25, 50, "All"] — pick 25
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(4);
    userEvent.click(options[1]);

    await waitFor(() => {
      expect(screen.getAllByTestId("tc-row-item")).toHaveLength(25);
    });
  });

  it("shows all rows when 'All' is selected as the page size", async () => {
    const manyTcs = Array.from({ length: 30 }, (_, i) =>
      makeTestCase({
        id: `tc-${i}`,
        title: `TC ${i}`,
        series: `G${i}`,
        description: `Desc ${i}`,
      })
    );
    render(
      <CompositeTestCasesTable
        {...defaultProps}
        testCases={manyTcs}
        validTestCaseIds={getValidTestCaseIds(manyTcs)}
      />
    );

    const comboboxes = await screen.findAllByRole("combobox", {
      expanded: false,
    });
    const limitCombobox = comboboxes[comboboxes.length - 1];
    userEvent.click(limitCombobox);
    const options = await screen.findAllByRole("option");
    // last option == "All"
    userEvent.click(options[options.length - 1]);

    await waitFor(() => {
      expect(screen.getAllByTestId("tc-row-item")).toHaveLength(30);
    });
  });

  // --- HowItWorks integration (controlled state) ---

  it("renders HowItWorks closed (link visible, panel hidden) by default", () => {
    render(<CompositeTestCasesTable {...defaultProps} />);
    expect(screen.getByTestId("how-it-works-link")).toBeInTheDocument();
    expect(
      screen.queryByTestId("how-it-works-content")
    ).not.toBeInTheDocument();
  });

  it("opens HowItWorks panel when the link is clicked, and the back button stays visible", async () => {
    render(<CompositeTestCasesTable {...defaultProps} />);
    userEvent.click(screen.getByTestId("how-it-works-link"));
    expect(screen.getByTestId("how-it-works-content")).toBeInTheDocument();
    // Back button must still be present (it moves to its own row, not removed)
    expect(screen.getByTestId("back-to-measures-btn")).toBeInTheDocument();
  });

  it("closes HowItWorks panel when the close button is clicked", async () => {
    render(<CompositeTestCasesTable {...defaultProps} />);
    userEvent.click(screen.getByTestId("how-it-works-link"));
    expect(screen.getByTestId("how-it-works-content")).toBeInTheDocument();
    userEvent.click(screen.getByTestId("how-it-works-close"));
    expect(
      screen.queryByTestId("how-it-works-content")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("how-it-works-link")).toBeInTheDocument();
  });
});
