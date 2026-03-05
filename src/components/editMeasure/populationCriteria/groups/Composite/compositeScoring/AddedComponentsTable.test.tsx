import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import AddedComponentsTable from "./AddedComponentsTable";
import { useMeasureServiceApi } from "@madie/madie-util";

jest.mock(
  "../../../../testCases/components/testCaseLanding/common/TestCaseTable/TestCaseTable",
  () => ({
    convertDate: jest.fn(() => ({ date: "Jan 15, 2024" })),
  })
);

// Service hook mock
jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(),
}));

// ---- Test fixtures ----
const measuresFixture = [
  {
    id: "m1",
    measureName: "Alpha Measure",
    version: "1.0.0",
    measureSet: { cmsId: "CMS111" },
    lastModifiedAt: "2024-01-15",
  },
  {
    id: "m2",
    measureName: "Beta Measure",
    version: "2.0.0",
    measureSet: { cmsId: "CMS222" },
    lastModifiedAt: "2024-02-20",
  },
];

const makeService = (overrides?: Partial<ReturnType<any>>) => {
  return {
    fetchMeasuresByIds: jest.fn().mockResolvedValue(measuresFixture),
    ...overrides,
  };
};

describe("AddedComponentsTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useMeasureServiceApi as jest.Mock).mockReturnValue(makeService());
  });

  it("renders nothing when components is empty", async () => {
    render(<AddedComponentsTable components={[]} />);

    // component returns null if components.length === 0
    expect(screen.queryByTestId("measure-list-tbl")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Selected Composite Measure Components/i)
    ).not.toBeInTheDocument();
  });

  it("fetches measures by ids and renders rows/columns", async () => {
    const service = makeService();
    (useMeasureServiceApi as jest.Mock).mockReturnValue(service);

    // include duplicates by measureId to exercise the unique count header
    const components = [
      { measureId: "m1", groupId: "g1" },
      { measureId: "m2", groupId: "g2" },
      { measureId: "m2", groupId: "g3" },
    ];

    render(<AddedComponentsTable components={components} />);

    // Fetch should be called once with distinct measure ids (component just maps ids)
    await waitFor(() =>
      expect(service.fetchMeasuresByIds).toHaveBeenCalledWith(["m1", "m2"])
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
    expect(screen.getByText("CMS111")).toBeInTheDocument();
    expect(screen.getByText("CMS222")).toBeInTheDocument();

    // Updated column uses mocked convertDate
    expect(screen.getAllByText("Jan 15, 2024").length).toBeGreaterThan(0);

    // Unique count in header should be 2 (m1, m2)
    expect(
      screen.getByText("Selected Composite Measure Components (2)")
    ).toBeInTheDocument();
  });

  it("cycles sort header title on Measure column (asc → desc → clear → asc)", async () => {
    const service = makeService();
    (useMeasureServiceApi as jest.Mock).mockReturnValue(service);

    render(
      <AddedComponentsTable
        components={[
          { measureId: "m1", groupId: "g1" },
          { measureId: "m2", groupId: "g2" },
        ]}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument()
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
    const service = makeService();
    (useMeasureServiceApi as jest.Mock).mockReturnValue(service);

    render(
      <AddedComponentsTable
        components={[
          { measureId: "m1", groupId: "g1" },
          { measureId: "m2", groupId: "g2" },
        ]}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument()
    );
    const measureHeaderBtn = screen.getByRole("button", { name: "Measure" });
    const measureTH = measureHeaderBtn.closest("th");
    expect(measureTH).toBeInTheDocument();

    await userEvent.hover(measureTH!);
    await userEvent.unhover(measureTH!);
  });

  it("renders an actions cell with Delete tooltip for each row", async () => {
    const service = makeService();
    (useMeasureServiceApi as jest.Mock).mockReturnValue(service);

    render(
      <AddedComponentsTable
        components={[
          { measureId: "m1", groupId: "g1" },
          { measureId: "m2", groupId: "g2" },
        ]}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument()
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

  it("logs error when fetchMeasuresByIds rejects", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    (useMeasureServiceApi as jest.Mock).mockReturnValue(
      makeService({
        fetchMeasuresByIds: jest
          .fn()
          .mockRejectedValue(new Error("boom fetching")),
      })
    );

    render(
      <AddedComponentsTable
        components={[
          { measureId: "m1", groupId: "g1" },
          { measureId: "m2", groupId: "g2" },
        ]}
      />
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it("refetches when components prop changes", async () => {
    const service = makeService();
    (useMeasureServiceApi as jest.Mock).mockReturnValue(service);

    const { rerender } = render(
      <AddedComponentsTable components={[{ measureId: "m1", groupId: "g1" }]} />
    );

    await waitFor(() =>
      expect(service.fetchMeasuresByIds).toHaveBeenCalledWith(["m1"])
    );

    service.fetchMeasuresByIds.mockClear();

    rerender(
      <AddedComponentsTable
        components={[
          { measureId: "m1", groupId: "g1" },
          { measureId: "m2", groupId: "gX" },
        ]}
      />
    );

    await waitFor(() =>
      expect(service.fetchMeasuresByIds).toHaveBeenCalledWith(["m1", "m2"])
    );

    expect(screen.getByText("Alpha Measure")).toBeInTheDocument();
    expect(screen.getByText("Beta Measure")).toBeInTheDocument();
  });

  it("calls onComponentsUpdate with filtered components when delete button is clicked", async () => {
    const service = makeService();
    (useMeasureServiceApi as jest.Mock).mockReturnValue(service);

    const components = [
      { measureId: "m1", groupId: "g1" },
      { measureId: "m2", groupId: "g2" },
    ];

    const mockOnComponentsUpdate = jest.fn();

    render(
      <AddedComponentsTable
        components={components}
        onComponentsUpdate={mockOnComponentsUpdate}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument()
    );

    const deleteButton = screen.getByTestId("delete-component-m1");
    await userEvent.click(deleteButton);

    expect(mockOnComponentsUpdate).toHaveBeenCalledWith([
      { measureId: "m2", groupId: "g2" },
    ]);
  });

  it("updates the component count in header after deletion", async () => {
    const service = makeService();
    (useMeasureServiceApi as jest.Mock).mockReturnValue(service);

    const components = [
      { measureId: "m1", groupId: "g1" },
      { measureId: "m2", groupId: "g2" },
      { measureId: "m2", groupId: "g3" },
    ];

    const mockOnComponentsUpdate = jest.fn();

    const { rerender } = render(
      <AddedComponentsTable
        components={components}
        onComponentsUpdate={mockOnComponentsUpdate}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument()
    );

    // Initial count should be 2 (unique m1, m2)
    expect(
      screen.getByText("Selected Composite Measure Components (2)")
    ).toBeInTheDocument();

    const deleteButton = screen.getByTestId("delete-component-m1");
    await userEvent.click(deleteButton);

    // Rerender with updated components
    rerender(
      <AddedComponentsTable
        components={[
          { measureId: "m2", groupId: "g2" },
          { measureId: "m2", groupId: "g3" },
        ]}
        onComponentsUpdate={mockOnComponentsUpdate}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("Selected Composite Measure Components (1)")
      ).toBeInTheDocument();
    });
  });

  it("handles deletion when components have multiple groups for same measureId", async () => {
    const service = makeService();
    (useMeasureServiceApi as jest.Mock).mockReturnValue(service);

    const components = [
      { measureId: "m1", groupId: "g1" },
      { measureId: "m1", groupId: "g2" },
      { measureId: "m2", groupId: "g3" },
    ];

    const mockOnComponentsUpdate = jest.fn();

    render(
      <AddedComponentsTable
        components={components}
        onComponentsUpdate={mockOnComponentsUpdate}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument()
    );

    // Should have 2 unique measures displayed
    expect(
      screen.getByText("Selected Composite Measure Components (2)")
    ).toBeInTheDocument();

    const deleteButton = screen.getByTestId("delete-component-m1");
    await userEvent.click(deleteButton);

    // All components with m1 should be removed
    expect(mockOnComponentsUpdate).toHaveBeenCalledWith([
      { measureId: "m2", groupId: "g3" },
    ]);
  });

  it("expands group section when expand icon is clicked", async () => {
    const service = makeService();
    (useMeasureServiceApi as jest.Mock).mockReturnValue(service);

    const components = [
      {
        measureId: "m1",
        groupId: "g1",
        groups: [
          { id: "group1", displayId: "group1", version: "1.0.0" },
          { id: "group2", displayId: "group2", version: "2.0.0" },
        ],
      },
    ];

    render(<AddedComponentsTable components={components} />);

    await waitFor(() =>
      expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument()
    );

    const rows = screen.getAllByRole("row");
    const expandButtons = rows[1].querySelectorAll("span[role='button']");
    const expandButton = expandButtons[expandButtons.length - 1];

    await userEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByTestId("expanded-group-row")).toBeInTheDocument();
    });
  });

  it("displays group sub-table with Population Criteria header when expanded", async () => {
    const service = makeService();
    (useMeasureServiceApi as jest.Mock).mockReturnValue(service);

    const components = [
      {
        measureId: "m1",
        groupId: "g1",
        groups: [
          { id: "group1", displayId: "group1", version: "1.0.0" },
          { id: "group2", displayId: "group2", version: "2.0.0" },
        ],
      },
    ];

    render(<AddedComponentsTable components={components} />);

    await waitFor(() =>
      expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument()
    );

    const rows = screen.getAllByRole("row");
    const expandButtons = rows[1].querySelectorAll("span[role='button']");
    const expandButton = expandButtons[expandButtons.length - 1];

    await userEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText("Population Criteria")).toBeInTheDocument();
    });
  });

  it("handles empty groups array gracefully", async () => {
    const service = makeService();
    (useMeasureServiceApi as jest.Mock).mockReturnValue(service);

    const components = [
      {
        measureId: "m1",
        groupId: "g1",
        groups: [],
      },
    ];

    render(<AddedComponentsTable components={components} />);

    await waitFor(() =>
      expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument()
    );

    const rows = screen.getAllByRole("row");
    const expandButtons = rows[1].querySelectorAll("span[role='button']");
    const expandButton = expandButtons[expandButtons.length - 1];

    await userEvent.click(expandButton);
    const groupRows = screen.queryByTestId("expanded-group-row");
    expect(groupRows).toBeInTheDocument();
    expect(groupRows?.querySelector("tbody")?.children.length).toBe(0);
  });

  it("handles components without groups property", async () => {
    const service = makeService();
    (useMeasureServiceApi as jest.Mock).mockReturnValue(service);

    const components = [
      {
        measureId: "m1",
        groupId: "g1",
      },
    ];

    render(<AddedComponentsTable components={components} />);

    await waitFor(() =>
      expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument()
    );

    const rows = screen.getAllByRole("row");
    const expandButtons = rows[1].querySelectorAll("span[role='button']");
    const expandButton = expandButtons[expandButtons.length - 1];

    await userEvent.click(expandButton);
    const groupRows = screen.queryByTestId("expanded-group-row");
    expect(groupRows).toBeInTheDocument();
    expect(groupRows?.querySelector("tbody")?.children.length).toBe(0);
  });

  it("toggle expand icon based on expansion state", async () => {
    const service = makeService();
    (useMeasureServiceApi as jest.Mock).mockReturnValue(service);

    const components = [
      {
        measureId: "m1",
        groupId: "g1",
        groups: [{ id: "group1", displayId: "group1", version: "1.0.0" }],
      },
    ];

    render(<AddedComponentsTable components={components} />);

    await waitFor(() =>
      expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument()
    );

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
});
