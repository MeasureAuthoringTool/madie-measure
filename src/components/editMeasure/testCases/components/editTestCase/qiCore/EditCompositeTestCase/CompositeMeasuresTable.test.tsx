import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import CompositeMeasuresTable from "./CompositeMeasuresTable";

jest.mock("twin.macro", () => {
  const twProxy = new Proxy(() => null, {
    get: () => () => "th",
    apply: () => "th",
  });
  return {
    __esModule: true,
    default: twProxy,
  };
});

jest.mock("styled-components/macro", () => ({}));

jest.mock("@madie/madie-design-system/dist/react", () => ({
  __esModule: true,
  TruncateText: ({ text, dataTestId }: any) => (
    <span data-testid={dataTestId}>{text}</span>
  ),
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));
jest.mock(
  "../../../testCaseLanding/common/TestCaseTable/TestCaseTable",
  () => ({
    __esModule: true,
    convertDate: (value: any) => ({
      date: `MOCK_DATE(${String(value).slice(0, 10)})`,
    }),
  })
);

// MUI Icons: render test ids so we can assert presence
jest.mock("@mui/icons-material/UnfoldMore", () => ({
  __esModule: true,
  default: () => <span data-testid="icon-unfold-more" />,
}));
jest.mock("@mui/icons-material/KeyboardArrowUp", () => ({
  __esModule: true,
  default: () => <span data-testid="icon-arrow-up" />,
}));
jest.mock("@mui/icons-material/KeyboardArrowDown", () => ({
  __esModule: true,
  default: () => <span data-testid="icon-arrow-down" />,
}));
jest.mock("@mui/icons-material/ChevronRight", () => ({
  __esModule: true,
  default: () => <span data-testid="icon-chevron-right" />,
}));

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

  it("returns null when measures is empty", () => {
    const { container } = render(<CompositeMeasuresTable measures={[]} />);
    expect(screen.queryByTestId("measure-list-tbl")).not.toBeInTheDocument();
    // also ensure nothing meaningful rendered
    expect(container).toBeEmptyDOMElement();
  });

  it("renders table, rows, cells, updated dates, and action button", () => {
    render(<CompositeMeasuresTable measures={mockMeasures} />);

    const table = screen.getByTestId("measure-list-tbl");
    expect(table).toBeInTheDocument();

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

    expect(screen.getByTestId("measure-name-m1")).toHaveTextContent(
      "Zeta Measure"
    );
    expect(screen.getByTestId("measure-name-m2")).toHaveTextContent(
      "Alpha Measure"
    );

    expect(screen.getByTestId("measure-version-m1")).toHaveTextContent(
      "1.0.000"
    );
    expect(screen.getByTestId("measure-version-m2")).toHaveTextContent(
      "2.0.000"
    );

    expect(screen.getByTestId("measure-cmsId-m1")).toHaveTextContent("123");
    expect(screen.getByTestId("measure-cmsId-m2")).toHaveTextContent("456");

    expect(screen.getByText("MOCK_DATE(2026-02-01)")).toBeInTheDocument();
    expect(screen.getByText("MOCK_DATE(2026-01-01)")).toBeInTheDocument();

    const actionButtons = screen.getAllByRole("button", {
      name: /Select Test Case/i,
    });
    expect(actionButtons.length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("icon-chevron-right").length).toBeGreaterThan(
      0
    );
  });

  it("shows UnfoldMoreIcon on header hover when not currently sorted", () => {
    render(<CompositeMeasuresTable measures={mockMeasures} />);

    const measureHeaderBtn = screen.getByRole("button", { name: /Measure/i });

    const th = measureHeaderBtn.closest("th");
    expect(th).toBeTruthy();

    fireEvent.mouseEnter(th!);

    expect(screen.getByTestId("icon-unfold-more")).toBeInTheDocument();

    fireEvent.mouseLeave(th!);
    expect(screen.queryByTestId("icon-unfold-more")).not.toBeInTheDocument();
  });

  it("toggles sorting on header click and shows up/down icons", () => {
    render(<CompositeMeasuresTable measures={mockMeasures} />);

    const measureHeaderBtn = screen.getByRole("button", { name: /Measure/i });
    const th = measureHeaderBtn.closest("th")!;
    expect(screen.queryByTestId("icon-arrow-up")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-arrow-down")).not.toBeInTheDocument();

    fireEvent.click(th);
    expect(screen.getByTestId("icon-arrow-up")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-arrow-down")).not.toBeInTheDocument();

    fireEvent.click(th);
    expect(screen.getByTestId("icon-arrow-down")).toBeInTheDocument();

    fireEvent.click(th);
    expect(screen.queryByTestId("icon-arrow-up")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-arrow-down")).not.toBeInTheDocument();

    fireEvent.mouseEnter(th);
    expect(screen.getByTestId("icon-unfold-more")).toBeInTheDocument();
  });

  it("renders correct sort title attribute for next sorting order (smoke coverage)", () => {
    render(<CompositeMeasuresTable measures={mockMeasures} />);
    const measureHeaderBtn = screen.getByRole("button", { name: /Measure/i });

    expect(measureHeaderBtn).toHaveAttribute("title", "Sort ascending");

    fireEvent.click(measureHeaderBtn.closest("th")!);
    expect(measureHeaderBtn).toHaveAttribute("title", "Sort descending");

    fireEvent.click(measureHeaderBtn.closest("th")!);
    expect(measureHeaderBtn).toHaveAttribute("title", "Clear sort");
  });
});
