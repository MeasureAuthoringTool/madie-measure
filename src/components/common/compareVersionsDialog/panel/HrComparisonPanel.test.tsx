import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import HrComparisonPanel from "./HrComparisonPanel";
import { Measure } from "@madie/madie-models";

const mockMeasures: Measure[] = [
  {
    id: "1",
    measureName: "Older Measure",
    version: "1.0.001",
    lastModifiedAt: "2025-11-20T10:00:00Z",
    measureSet: { cmsId: "100" },
    measureMetaData: { draft: false },
  } as any,
  {
    id: "2",
    measureName: "Newer Measure (Draft)",
    version: "1.1.001",
    lastModifiedAt: "2025-11-21T12:00:00Z",
    measureSet: { cmsId: "100" },
    measureMetaData: { draft: true },
  } as any,
];

const mockMeasureServiceApi = {
  fetchHumanReadable: jest.fn(
    async (id: string) => `<div>HR content for ${id}</div>`
  ),
};

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
}));

describe("HrComparisonPanel component", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("renders the old measure header row correctly", () => {
    render(<HrComparisonPanel measure={mockMeasures[0]} side="old" />);

    expect(screen.getByTestId("comparison-panel-old")).toBeInTheDocument();
    expect(screen.getByTestId("version-text-old")).toHaveTextContent(
      `Version ${mockMeasures[0].version}`
    );
    expect(screen.queryByTestId("draft-chip-old")).not.toBeInTheDocument();
    expect(screen.getByTestId("last-updated-old")).toHaveTextContent(
      "Last updated on 11/20/2025"
    );
  });

  it("renders the new measure (draft) header row correctly", () => {
    render(<HrComparisonPanel measure={mockMeasures[1]} side="new" />);

    expect(screen.getByTestId("comparison-panel-new")).toBeInTheDocument();
    expect(screen.getByTestId("version-text-new")).toHaveTextContent(
      `Version ${mockMeasures[1].version}`
    );
    expect(screen.getByTestId("draft-chip-new")).toBeInTheDocument();
    expect(screen.getByTestId("last-updated-new")).toHaveTextContent(
      "Last updated on 11/21/2025"
    );
  });

  it("renders human readable content when fetchHumanReadable succeeds", async () => {
    render(<HrComparisonPanel measure={mockMeasures[0]} side="old" />);

    const content = await screen.findByText(
      `HR content for ${mockMeasures[0].id}`,
      { exact: false }
    );

    expect(content).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchHumanReadable).toHaveBeenCalledWith(
      mockMeasures[0].id
    );
  });

  it("displays error message if fetchHumanReadable fails", async () => {
    const errorMessage = "Network error";

    mockMeasureServiceApi.fetchHumanReadable = jest
      .fn()
      .mockRejectedValue(new Error(errorMessage));

    render(<HrComparisonPanel measure={mockMeasures[0]} side="old" />);

    await waitFor(() =>
      expect(
        screen.getByText(/The human readable file is not available/i)
      ).toBeInTheDocument()
    );

    expect(mockMeasureServiceApi.fetchHumanReadable).toHaveBeenCalledWith(
      mockMeasures[0].id
    );
  });
});
