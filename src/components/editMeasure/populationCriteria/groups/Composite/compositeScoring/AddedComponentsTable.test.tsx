import * as React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import AddedComponentsTable from "./AddedComponentsTable";

jest.mock(
  "../../../../testCases/components/testCaseLanding/common/TestCaseTable/TestCaseTable",
  () => ({
    convertDate: jest.fn(() => ({ date: "Jan 15, 2024" })),
  })
);

// ---- Test fixtures ----
const measuresFixture: any[] = [
  {
    id: "m1",
    measureName: "Alpha Measure",
    version: "1.0.0",
    measureSet: { cmsId: "111" },
    lastModifiedAt: "2024-01-15",
  },
  {
    id: "m2",
    measureName: "Beta Measure",
    version: "2.0.0",
    measureSet: { cmsId: "222" },
    lastModifiedAt: "2024-02-20",
  },
];

const mockDelete = jest.fn();

describe("AddedComponentsTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when components is empty", () => {
    render(
      <AddedComponentsTable components={[]} onDeleteComponent={mockDelete} />
    );

    // component returns null if components.length === 0
    expect(screen.queryByTestId("measure-list-tbl")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Selected Composite Measure Components/i)
    ).not.toBeInTheDocument();
  });

  it("renders rows/columns from the components prop", () => {
    render(
      <AddedComponentsTable
        components={measuresFixture}
        onDeleteComponent={mockDelete}
      />
    );

    // Table exists
    expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument();

    // Rows render
    expect(screen.getByText("Alpha Measure")).toBeInTheDocument();
    expect(screen.getByText("Beta Measure")).toBeInTheDocument();

    // Version column rendered via cell renderer
    expect(screen.getByText("1.0.0")).toBeInTheDocument();
    expect(screen.getByText("2.0.0")).toBeInTheDocument();

    // CMS ID column
    expect(screen.getByText("0111")).toBeInTheDocument();
    expect(screen.getByText("0222")).toBeInTheDocument();

    // Updated column uses mocked convertDate
    expect(screen.getAllByText("Jan 15, 2024").length).toBeGreaterThan(0);

    // Unique count — 2 distinct ids
    expect(
      screen.getByText("Selected Composite Measure Components (2)")
    ).toBeInTheDocument();
  });

  it("cycles sort header title on Measure column (asc → desc → clear → asc)", async () => {
    render(
      <AddedComponentsTable
        components={measuresFixture}
        onDeleteComponent={mockDelete}
      />
    );

    const measureHeaderBtn = screen.getByRole("button", { name: "Measure" });
    expect(measureHeaderBtn).toHaveAttribute("title", "Sort ascending");

    await userEvent.click(measureHeaderBtn);
    expect(measureHeaderBtn).toHaveAttribute("title", "Sort descending");

    await userEvent.click(measureHeaderBtn);
    expect(measureHeaderBtn).toHaveAttribute("title", "Clear sort");

    await userEvent.click(measureHeaderBtn);
    expect(measureHeaderBtn).toHaveAttribute("title", "Sort ascending");
  });

  it("shows the 'hover' branch on a sortable header (no assertion on icon accessibility)", async () => {
    render(
      <AddedComponentsTable
        components={measuresFixture}
        onDeleteComponent={mockDelete}
      />
    );

    const measureHeaderBtn = screen.getByRole("button", { name: "Measure" });
    const measureTH = measureHeaderBtn.closest("th");
    expect(measureTH).toBeInTheDocument();

    await userEvent.hover(measureTH!);
    await userEvent.unhover(measureTH!);
  });

  it("renders an actions cell with Delete tooltip for each row", async () => {
    render(
      <AddedComponentsTable
        components={measuresFixture}
        onDeleteComponent={mockDelete}
      />
    );

    const bodyRows = screen.getAllByTestId("row-item");
    expect(bodyRows.length).toBeGreaterThan(0);

    for (const row of bodyRows) {
      const deleteBtn = within(row).getByTestId(/^delete-component-/);
      await userEvent.hover(deleteBtn);

      await waitFor(() => {
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });

      await userEvent.unhover(deleteBtn);
    }
  });

  it("logs error when onDeleteComponent throws", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const throwingDelete = jest.fn(() => {
      throw new Error("boom deleting");
    });

    render(
      <AddedComponentsTable
        components={measuresFixture}
        onDeleteComponent={throwingDelete}
      />
    );

    const deleteButton = screen.getByTestId("delete-component-m1");
    await userEvent.click(deleteButton);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("rerenders correctly when components prop changes", () => {
    const { rerender } = render(
      <AddedComponentsTable
        components={[measuresFixture[0]]}
        onDeleteComponent={mockDelete}
      />
    );

    expect(screen.getByText("Alpha Measure")).toBeInTheDocument();
    expect(screen.queryByText("Beta Measure")).not.toBeInTheDocument();

    rerender(
      <AddedComponentsTable
        components={measuresFixture}
        onDeleteComponent={mockDelete}
      />
    );

    expect(screen.getByText("Alpha Measure")).toBeInTheDocument();
    expect(screen.getByText("Beta Measure")).toBeInTheDocument();
  });

  it("calls onDeleteComponent with the measure id when delete button is clicked", async () => {
    render(
      <AddedComponentsTable
        components={measuresFixture}
        onDeleteComponent={mockDelete}
      />
    );

    const deleteButton = screen.getByTestId("delete-component-m1");
    await userEvent.click(deleteButton);

    expect(mockDelete).toHaveBeenCalledWith("m1");
  });

  it("updates the component count in header after deletion", async () => {
    const { rerender } = render(
      <AddedComponentsTable
        components={measuresFixture}
        onDeleteComponent={mockDelete}
      />
    );

    // Initial count: 2 unique measures
    expect(
      screen.getByText("Selected Composite Measure Components (2)")
    ).toBeInTheDocument();

    const deleteButton = screen.getByTestId("delete-component-m1");
    await userEvent.click(deleteButton);

    expect(mockDelete).toHaveBeenCalledWith("m1");

    // Rerender with updated components (parent handles removal)
    rerender(
      <AddedComponentsTable
        components={[measuresFixture[1]]}
        onDeleteComponent={mockDelete}
      />
    );

    expect(
      screen.getByText("Selected Composite Measure Components (1)")
    ).toBeInTheDocument();
  });

  it("handles deletion when components have multiple entries for same id", async () => {
    // Two entries with the same id represent multiple groups for the same measure
    const componentsWithDuplicates = [
      { ...measuresFixture[0] },
      { ...measuresFixture[0], groups: [{ id: "g2", displayId: "Pop2" }] },
      { ...measuresFixture[1] },
    ];

    render(
      <AddedComponentsTable
        components={componentsWithDuplicates}
        onDeleteComponent={mockDelete}
      />
    );

    // Unique count by id: 2 (m1, m2)
    expect(
      screen.getByText("Selected Composite Measure Components (2)")
    ).toBeInTheDocument();

    // Two rows share "m1" because componentsWithDuplicates has two entries with the same id
    const deleteButtons = screen.getAllByTestId("delete-component-m1");
    await userEvent.click(deleteButtons[0]);

    expect(mockDelete).toHaveBeenCalledWith("m1");
  });

  it("displays expanded section with group data when component is expanded", async () => {
    const componentWithGroups = {
      ...measuresFixture[0],
      groups: [
        { id: "group1", displayId: "Population1" },
        { id: "group2", displayId: "Population2" },
        { id: "group3", displayId: "Population3" },
      ],
    };

    render(
      <AddedComponentsTable
        components={[componentWithGroups]}
        onDeleteComponent={jest.fn()}
      />
    );

    expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    const expandButtons = rows[1].querySelectorAll("span[role='button']");
    const expandButton = expandButtons[expandButtons.length - 1];

    await userEvent.click(expandButton);
    const expandedRow = await screen.findByTestId("expanded-group-row");

    expect(expandedRow).toBeInTheDocument();
    expect(
      within(expandedRow).getByText("Population Criteria")
    ).toBeInTheDocument();

    const tbody = expandedRow.querySelector("tbody");
    expect(tbody).toBeInTheDocument();

    const groupRows = tbody?.querySelectorAll("tr");
    expect(groupRows?.length).toBe(3);

    const tableContent = expandedRow.textContent;
    expect(tableContent).toContain("Population1");
    expect(tableContent).toContain("Population2");
    expect(tableContent).toContain("Population3");
  });

  it("handling when there no groups present", async () => {
    const componentNoGroups = { ...measuresFixture[0], groups: [] };

    render(
      <AddedComponentsTable
        components={[componentNoGroups]}
        onDeleteComponent={jest.fn()}
      />
    );

    expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    const expandButtons = rows[1].querySelectorAll("span[role='button']");
    const expandButton = expandButtons[expandButtons.length - 1];

    await userEvent.click(expandButton);
    const groupRows = screen.queryByTestId("expanded-group-row");
    expect(groupRows).toBeInTheDocument();
    expect(groupRows?.querySelector("tbody")?.children.length).toBe(0);
  });

  it("toggle expand icon based on expansion state", async () => {
    const componentWithGroups = {
      ...measuresFixture[0],
      groups: [{ id: "group1", displayId: "group1" }],
    };

    render(
      <AddedComponentsTable
        components={[componentWithGroups]}
        onDeleteComponent={mockDelete}
      />
    );

    expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument();

    let rows = screen.getAllByRole("row");
    let expandButtons = rows[1].querySelectorAll("span[role='button']");
    let expandButton = expandButtons[expandButtons.length - 1];
    expect(expandButton.querySelector("svg")).toBeInTheDocument();

    await userEvent.click(expandButton);
    await waitFor(() => {
      expect(screen.getByTestId("expanded-group-row")).toBeInTheDocument();
    });

    rows = screen.getAllByRole("row");
    expandButtons = rows[1].querySelectorAll("span[role='button']");
    expandButton = expandButtons[expandButtons.length - 1];

    await userEvent.click(expandButton);
    await waitFor(() => {
      expect(
        screen.queryByTestId("expanded-group-row")
      ).not.toBeInTheDocument();
    });
  });

  it("appends FHIR suffix to padded CMS ID for QI-Core measures", () => {
    const qiCoreAndQdmMix: any[] = [
      {
        id: "qicore-1",
        measureName: "QI-Core Measure",
        version: "1.0.0",
        model: "QI-Core v4.1.1",
        measureSet: { cmsId: 333 },
        lastModifiedAt: "2024-01-15",
      },
      {
        id: "qdm-1",
        measureName: "QDM Measure",
        version: "1.0.0",
        model: "QDM v5.6",
        measureSet: { cmsId: 444 },
        lastModifiedAt: "2024-01-15",
      },
    ];

    render(
      <AddedComponentsTable
        components={qiCoreAndQdmMix}
        onDeleteComponent={mockDelete}
      />
    );

    // QI-Core row: padded + "FHIR" suffix
    expect(screen.getByText("0333FHIR")).toBeInTheDocument();
    // QDM row: padded only, no FHIR suffix
    expect(screen.getByText("0444")).toBeInTheDocument();
    expect(screen.queryByText("0444FHIR")).not.toBeInTheDocument();
  });
});
