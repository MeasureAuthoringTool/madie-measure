import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CqlDiffViewer from "./CqlDiffViewer";
import { Measure } from "@madie/madie-models";

const mockOldMeasure = {
  id: "1",
  measureName: "Older Measure",
} as Measure;

const mockNewMeasure = {
  id: "2",
  measureName: "Newer Measure (Draft)",
} as Measure;

const mockCqlDiffResponse = {
  comparisons: [
    {
      oldText: "define OldLogic: true",
      newText: "define NewLogic: false",
    },
  ],
};

const mockMeasureServiceApi = {
  getCqlDiff: jest.fn(),
};

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
}));

jest.mock("react-diff-viewer-continued", () => {
  return jest.fn(({ oldValue, newValue }) => (
    <div data-testid="react-diff-viewer">
      <pre data-testid="old-text">{oldValue}</pre>
      <pre data-testid="new-text">{newValue}</pre>
    </div>
  ));
});

describe("CqlDiffViewer component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls getCqlDiff when both measure ids are provided", async () => {
    mockMeasureServiceApi.getCqlDiff.mockResolvedValue(mockCqlDiffResponse);

    render(
      <CqlDiffViewer oldMeasure={mockOldMeasure} newMeasure={mockNewMeasure} />
    );

    await waitFor(() =>
      expect(mockMeasureServiceApi.getCqlDiff).toHaveBeenCalledWith(
        mockOldMeasure.id,
        mockNewMeasure.id
      )
    );
  });

  it("renders the diff viewer with old and new CQL text", async () => {
    mockMeasureServiceApi.getCqlDiff.mockResolvedValue(mockCqlDiffResponse);

    render(
      <CqlDiffViewer oldMeasure={mockOldMeasure} newMeasure={mockNewMeasure} />
    );

    expect(await screen.findByTestId("react-diff-viewer")).toBeInTheDocument();

    expect(screen.getByTestId("old-text")).toHaveTextContent(
      mockCqlDiffResponse.comparisons[0].oldText
    );
    expect(screen.getByTestId("new-text")).toHaveTextContent(
      mockCqlDiffResponse.comparisons[0].newText
    );
  });

  it("displays error message when getCqlDiff fails", async () => {
    mockMeasureServiceApi.getCqlDiff.mockRejectedValue(
      new Error("Network error")
    );

    render(
      <CqlDiffViewer oldMeasure={mockOldMeasure} newMeasure={mockNewMeasure} />
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          /Could not get CQL diff for these two measures instances/i
        )
      ).toBeInTheDocument()
    );
  });

  it("does not call getCqlDiff if newMeasure is missing", () => {
    render(
      <CqlDiffViewer oldMeasure={mockOldMeasure} newMeasure={null as any} />
    );
    expect(mockMeasureServiceApi.getCqlDiff).not.toHaveBeenCalled();
  });

  it("does not call getCqlDiff if oldMeasure is missing", () => {
    render(
      <CqlDiffViewer oldMeasure={null as any} newMeasure={mockNewMeasure} />
    );
    expect(mockMeasureServiceApi.getCqlDiff).not.toHaveBeenCalled();
  });
});
