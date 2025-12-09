import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import HrComparisonPanel from "./HrComparisonPanel";
import { Measure } from "@madie/madie-models";

const mockMeasure: Measure = {
  id: "TestMeasureId",
  measureName: "Test Measure",
  measureSetId: "MeasureSetId1",
} as Measure;

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

  it("renders human readable content when fetchHumanReadable succeeds", async () => {
    render(<HrComparisonPanel measure={mockMeasure} side="old" />);

    const content = await screen.findByText(
      `HR content for ${mockMeasure.id}`,
      { exact: false }
    );

    expect(content).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchHumanReadable).toHaveBeenCalledWith(
      mockMeasure.id
    );
  });

  it("displays error message if fetchHumanReadable fails", async () => {
    const errorMessage = "Network error";

    mockMeasureServiceApi.fetchHumanReadable = jest
      .fn()
      .mockRejectedValue(new Error(errorMessage));

    render(<HrComparisonPanel measure={mockMeasure} side="old" />);

    await waitFor(() =>
      expect(
        screen.getByText(/The human readable file is not available/i)
      ).toBeInTheDocument()
    );

    expect(mockMeasureServiceApi.fetchHumanReadable).toHaveBeenCalledWith(
      mockMeasure.id
    );
  });
});
