import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import CompositeMeasuresTable from "./CompositeMeasuresTable";

describe("CompositeMeasuresTable", () => {
  const mockMeasures: any[] = [
    {
      id: "m1",
      measureName: "Zeta Measure",
      version: "1.0.000",
      lastModifiedAt: "2026-02-01T00:00:00Z",
      measureSet: { cmsId: "123" },
    },
    {
      id: "m2",
      measureName: "Alpha Measure",
      version: "2.0.000",
      lastModifiedAt: "2026-01-01T00:00:00Z",
      measureSet: { cmsId: "456" },
    },
  ];
  const onSelectTestCase = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when measures is empty", () => {
    const { container } = render(<CompositeMeasuresTable measures={[]} />);
    expect(screen.queryByTestId("measure-list-tbl")).not.toBeInTheDocument();
    // also ensure nothing meaningful rendered
    expect(container).toBeEmptyDOMElement();
  });

  it("renders table with all columns, rows, and action buttons", () => {
    render(
      <CompositeMeasuresTable
        measures={mockMeasures}
        onSelectTestCase={onSelectTestCase}
      />
    );

    expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Measure/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Version/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CMS ID/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Updated/i })
    ).toBeInTheDocument();

    const rows = screen.getAllByTestId("row-item");
    expect(rows).toHaveLength(2);

    expect(screen.getByText("Zeta Measure")).toBeInTheDocument();
    expect(screen.getByText("Alpha Measure")).toBeInTheDocument();
    expect(screen.getByText("1.0.000")).toBeInTheDocument();
    expect(screen.getByText("2.0.000")).toBeInTheDocument();
    expect(screen.getByText("0123")).toBeInTheDocument();
    expect(screen.getByText("0456")).toBeInTheDocument();

    const actionButtons = screen.getAllByRole("button", {
      name: /Select Test Case/i,
    });
    expect(actionButtons).toHaveLength(2);
    expect(screen.getAllByTestId("ChevronRightIcon").length).toBe(2);
  });

  it("calls onSelectTestCase with the correct measure when action button is clicked", () => {
    render(
      <CompositeMeasuresTable
        measures={mockMeasures}
        onSelectTestCase={onSelectTestCase}
      />
    );

    fireEvent.click(screen.getByTestId("select-test-case-btn-m1"));
    expect(onSelectTestCase).toHaveBeenCalledWith(
      expect.objectContaining({ id: "m1", measureName: "Zeta Measure" })
    );
  });

  it("sorts columns on header click and shows sort icons on hover", () => {
    render(<CompositeMeasuresTable measures={mockMeasures} />);

    const measureHeaderBtn = screen.getByRole("button", { name: /Measure/i });
    const th = measureHeaderBtn.closest("th")!;

    // hover shows unfold icon when unsorted
    fireEvent.mouseEnter(th);
    expect(screen.getByTestId("UnfoldMoreIcon")).toBeInTheDocument();
    fireEvent.mouseLeave(th);
    expect(screen.queryByTestId("UnfoldMoreIcon")).not.toBeInTheDocument();

    // click cycles: ascending → descending → clear
    expect(measureHeaderBtn).toHaveAttribute("title", "Sort ascending");

    fireEvent.click(th);
    expect(measureHeaderBtn).toHaveAttribute("title", "Sort descending");
    expect(screen.getByTestId("KeyboardArrowUpIcon")).toBeInTheDocument();

    fireEvent.click(th);
    expect(measureHeaderBtn).toHaveAttribute("title", "Clear sort");
    expect(screen.getByTestId("KeyboardArrowDownIcon")).toBeInTheDocument();

    fireEvent.click(th);
    expect(measureHeaderBtn).toHaveAttribute("title", "Sort ascending");
    expect(screen.queryByTestId("KeyboardArrowUpIcon")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("KeyboardArrowDownIcon")
    ).not.toBeInTheDocument();

    // hover again shows unfold
    fireEvent.mouseEnter(th);
    expect(screen.getByTestId("UnfoldMoreIcon")).toBeInTheDocument();
  });
});
