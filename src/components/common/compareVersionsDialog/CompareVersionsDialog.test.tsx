import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CompareVersionsDialog, {
  getNewestMeasureInstance,
} from "./CompareVersionsDialog";
import { Measure } from "@madie/madie-models";

const mockMeasureServiceApi = {
  fetchHumanReadable: jest.fn(
    async (id: string) => `<div>HR content for ${id}</div>`
  ),
};

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
}));

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const mockOnClose = jest.fn();

const mockMeasures: Measure[] = [
  {
    id: "1",
    measureName: "Older Measure",
    version: "1.0.001",
    measureSet: { cmsId: "100" },
    measureMetaData: { draft: false },
  } as any,
  {
    id: "2",
    measureName: "Newer Measure (Draft)",
    version: "1.1.001",
    measureSet: { cmsId: "100" },
    measureMetaData: { draft: true },
  } as any,
];

describe("CompareVersionsDialog component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when open", () => {
    render(
      <CompareVersionsDialog
        measures={mockMeasures}
        open={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId("compare-versions-dialog")).toBeInTheDocument();
    expect(screen.getByText("Compare Measure Versions")).toBeInTheDocument();
  });

  it("does not render when open = false", () => {
    render(
      <CompareVersionsDialog
        measures={mockMeasures}
        open={false}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.queryByTestId("compare-versions-dialog")
    ).not.toBeInTheDocument();
  });

  it("does not render if measures is null", () => {
    render(
      <CompareVersionsDialog
        measures={null}
        open={true}
        onClose={mockOnClose}
      />
    );
    expect(
      screen.queryByTestId("compare-versions-dialog")
    ).not.toBeInTheDocument();
  });

  it("does not render if measures is undefined", () => {
    render(
      <CompareVersionsDialog
        measures={undefined}
        open={true}
        onClose={mockOnClose}
      />
    );
    expect(
      screen.queryByTestId("compare-versions-dialog")
    ).not.toBeInTheDocument();
  });

  it("does not render if measures length is not 2", () => {
    render(
      <CompareVersionsDialog measures={[]} open={true} onClose={mockOnClose} />
    );
    expect(
      screen.queryByTestId("compare-versions-dialog")
    ).not.toBeInTheDocument();

    const singleMeasure = [{ id: "1", measureName: "A" } as any];
    render(
      <CompareVersionsDialog
        measures={singleMeasure}
        open={true}
        onClose={mockOnClose}
      />
    );
    expect(
      screen.queryByTestId("compare-versions-dialog")
    ).not.toBeInTheDocument();
  });

  it("displays newest measure correctly", () => {
    render(
      <CompareVersionsDialog
        measures={mockMeasures}
        open={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId("measure-name")).toHaveTextContent(
      "Newer Measure (Draft)"
    );
    expect(screen.getByTestId("measure-cmsid")).toHaveTextContent(
      "(CMS ID: 100)"
    );
  });

  it("shows '-' when cmsId is null", () => {
    const measures = [
      { ...mockMeasures[0], measureSet: { cmsId: null } },
      { ...mockMeasures[1], measureSet: { cmsId: null } },
    ];

    render(
      <CompareVersionsDialog
        measures={measures}
        open={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId("measure-cmsid")).toHaveTextContent(
      "(CMS ID: -)"
    );
  });

  it("renders and switches tabs", () => {
    render(
      <CompareVersionsDialog
        measures={mockMeasures}
        open={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId("tab-content-cql")).toBeInTheDocument();

    const hrTab = screen.getByTestId("human-readable-tab");
    fireEvent.click(hrTab);

    expect(
      screen.getByTestId("tab-content-human-readable")
    ).toBeInTheDocument();
  });

  it("calls onClose when Close button is clicked", () => {
    render(
      <CompareVersionsDialog
        measures={mockMeasures}
        open={true}
        onClose={mockOnClose}
      />
    );

    const closeBtn = screen.getByTestId("compare-versions-close-button");
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("renders CqlComparisonPanel for old and new measures in CQL tab", () => {
    render(
      <CompareVersionsDialog
        measures={mockMeasures}
        open={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId("tab-content-cql")).toBeInTheDocument();

    expect(screen.getByTestId("panel-content-old")).toBeInTheDocument();
    expect(screen.getByTestId("comparison-panel-new")).toBeInTheDocument();
  });
});

describe("getNewestMeasureInstance", () => {
  const baseMeasure = (id: string, draft: boolean, version?: string): Measure =>
    ({
      id,
      measureName: `Measure ${id}`,
      version: version || "1.0.001",
      measureSet: { cmsId: id },
      measureMetaData: { draft },
    } as any);

  it("returns measureA if only measureA is draft", () => {
    const measures = [baseMeasure("1", true), baseMeasure("2", false)];
    expect(getNewestMeasureInstance(measures)).toBe(measures[0]);
  });

  it("returns measureB if only measureB is draft", () => {
    const measures = [baseMeasure("1", false), baseMeasure("2", true)];
    expect(getNewestMeasureInstance(measures)).toBe(measures[1]);
  });

  it("returns measure with higher version if both are non-draft", () => {
    const measures = [
      baseMeasure("1", false, "1.0.001"),
      baseMeasure("2", false, "1.1.001"),
    ];
    expect(getNewestMeasureInstance(measures)).toBe(measures[1]);

    const measures2 = [
      baseMeasure("1", false, "2.0.002"),
      baseMeasure("2", false, "1.9.999"),
    ];
    expect(getNewestMeasureInstance(measures2)).toBe(measures2[0]);
  });

  it("returns first measure if both versions are equal", () => {
    const measures = [
      baseMeasure("1", false, "1.0.001"),
      baseMeasure("2", false, "1.0.001"),
    ];
    expect(getNewestMeasureInstance(measures)).toBe(measures[0]);
  });

  it("returns the measure with higher major version", () => {
    const measures = [
      baseMeasure("1", false, "1.0.001"),
      baseMeasure("2", false, "2.0.001"),
    ];
    expect(getNewestMeasureInstance(measures)).toBe(measures[1]);
  });

  it("returns the measure with higher minor version when major is equal", () => {
    const measures = [
      baseMeasure("1", false, "1.1.001"),
      baseMeasure("2", false, "1.2.001"),
    ];
    expect(getNewestMeasureInstance(measures)).toBe(measures[1]);
  });

  it("returns the measure with higher patch version when major and minor are equal", () => {
    const measures = [
      baseMeasure("1", false, "1.0.001"),
      baseMeasure("2", false, "1.0.002"),
    ];
    expect(getNewestMeasureInstance(measures)).toBe(measures[1]);
  });

  it("renders the Differences section in Human Readable tab", () => {
    render(
      <CompareVersionsDialog
        measures={mockMeasures}
        open={true}
        onClose={mockOnClose}
      />
    );

    const hrTab = screen.getByTestId("human-readable-tab");
    fireEvent.click(hrTab);

    expect(screen.getByTestId("differences-section")).toBeInTheDocument();
    expect(screen.getByText("Differences")).toBeInTheDocument();
  });
});
