import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import HumanReadableDiffViewer from "./HumanReadableDiffViewer";
import { Measure } from "@madie/madie-models";

const mockOldMeasure = {
  id: "1",
  measureName: "Older Measure",
  version: "0.3.002",
  measureMetaData: {
    draft: true,
  },
} as Measure;

const mockNewMeasure = {
  id: "2",
  measureName: "Newer Measure (Draft)",
  version: "0.3.003",
  measureMetaData: {
    draft: true,
  },
} as Measure;

const mockHrDiffResponse = {
  oldHtml: "<div>Old Content</div>",
  newHtml: "<div>New Content</div>",
  differences: [
    {
      field: "Version Number",
      oldValue:
        "0.3.<span style='background-color:#FFB6C1;text-decoration:line-through;'>002<span style='background-color:#FFB6C1;text-decoration:line-through;'>",
      newValue:
        "0.3.<span style='background-color:#90EE90;'>003<span style='background-color:#90EE90;'>",
    },
    {
      field: "Use Context",
      oldValue:
        "org.hl7.fhir.r5.model.<span style='background-color:#FFB6C1;text-decoration:line-through;'>UsageContext@46654282<span style='background-color:#FFB6C1;text-decoration:line-through;'>",
      newValue:
        "org.hl7.fhir.r5.model.<span style='background-color:#90EE90;'>UsageContext@7d873d<span style='background-color:#90EE90;'>",
    },
    {
      field: "Version Specific Identifier",
      oldValue:
        "<span style='background-color:#FFB6C1;text-decoration:line-through;'>urn:uuid:50bd152a<span style='background-color:#FFB6C1;text-decoration:line-through;'>-<span style='background-color:#FFB6C1;text-decoration:line-through;'>d296<span style='background-color:#FFB6C1;text-decoration:line-through;'>-<span style='background-color:#FFB6C1;text-decoration:line-through;'>450f<span style='background-color:#FFB6C1;text-decoration:line-through;'>-<span style='background-color:#FFB6C1;text-decoration:line-through;'>83d5<span style='background-color:#FFB6C1;text-decoration:line-through;'>-<span style='background-color:#FFB6C1;text-decoration:line-through;'>a92c69b2f99c<span style='background-color:#FFB6C1;text-decoration:line-through;'>",
      newValue:
        "<span style='background-color:#90EE90;'>urn:uuid:df60a54f<span style='background-color:#90EE90;'>-<span style='background-color:#90EE90;'>5759<span style='background-color:#90EE90;'>-<span style='background-color:#90EE90;'>4e28<span style='background-color:#90EE90;'>-<span style='background-color:#90EE90;'>b7bd<span style='background-color:#90EE90;'>-<span style='background-color:#90EE90;'>5c6e3ff0ed90<span style='background-color:#90EE90;'>",
    },
  ],
};
const mockMeasureServiceApi = {
  getHumanReadableDiff: jest.fn(),
};

jest.mock("@madie/madie-util", () => ({
  useIsAdminTransferEnabled: () => false,
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
}));

jest.mock("react-diff-viewer-continued", () => {
  return jest.fn(({ oldValue, newValue }) => (
    <div data-testid="react-diff-viewer">
      <pre data-testid="old-html">{oldValue}</pre>
      <pre data-testid="new-html">{newValue}</pre>
    </div>
  ));
});

const setDifferences = jest.fn();

describe("HumanReadableDiffViewer component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the human-readable diff viewer with old and new diff fields", async () => {
    mockMeasureServiceApi.getHumanReadableDiff.mockResolvedValue(
      mockHrDiffResponse
    );

    render(
      <HumanReadableDiffViewer
        oldMeasure={mockOldMeasure}
        newMeasure={mockNewMeasure}
        setDifferences={setDifferences}
      />
    );

    expect(
      await screen.findByTestId("human-readable-diff-viewer")
    ).toBeInTheDocument();
    expect(screen.getByTestId("draft-chip-0.3.002")).toBeInTheDocument();
    expect(screen.getByTestId("draft-chip-0.3.003")).toBeInTheDocument();

    // Wait for the table to render
    const rows = await screen.findAllByRole("row");
    // The first row is usually the header, so filter out header rows if needed
    const dataRows = rows.filter(
      (row) => row.parentElement?.tagName === "TBODY"
    );
    expect(dataRows).toHaveLength(3);

    // row 1 - first difference is Version Number
    expect(screen.getByTestId("row-0-Version Number")).toHaveTextContent(
      "Version Number"
    );
    expect(screen.getByTestId("row-0-oldValue")).toHaveTextContent("002");
    expect(screen.getByTestId("row-0-newValue")).toHaveTextContent("003");

    // Assert the visible text ("002" is the older version number which has red line-through style)
    expect(screen.getByText("002")).toBeInTheDocument();

    // Assert the style of the span containing "002"
    const span = screen.getByText("002").closest("span");
    expect(span).toHaveStyle("background-color: #FFB6C1");
    expect(span).toHaveStyle("text-decoration: line-through");

    //"002" is the newer version number which has green background color
    expect(screen.getByText("003")).toBeInTheDocument();
    const spanNew = screen.getByText("003").closest("span");
    expect(spanNew).toHaveStyle("background-color: #90EE90");

    // row 2 - second difference is Use Context
    expect(screen.getByTestId("row-1-Use Context")).toHaveTextContent(
      "Use Context"
    );
    expect(screen.getByTestId("row-1-oldValue")).toHaveTextContent(
      "UsageContext@46654282"
    );
    expect(screen.getByTestId("row-1-newValue")).toHaveTextContent(
      "UsageContext@7d873d"
    );

    // row 3 - third difference is Version Specific Identifier
    expect(
      screen.getByTestId("row-2-Version Specific Identifier")
    ).toHaveTextContent("Version Specific Identifier");
    expect(screen.getByTestId("row-2-oldValue")).toHaveTextContent(
      "urn:uuid:50bd152a"
    );
    expect(screen.getByTestId("row-2-newValue")).toHaveTextContent(
      "urn:uuid:df60a54f"
    );
  });

  it("renders no differences message when there are no differences", async () => {
    mockMeasureServiceApi.getHumanReadableDiff.mockResolvedValue({
      differences: [],
    });

    render(
      <HumanReadableDiffViewer
        oldMeasure={mockOldMeasure}
        newMeasure={mockNewMeasure}
        setDifferences={setDifferences}
      />
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          /There are no differences in the Human Readable files for these measures/i
        )
      ).toBeInTheDocument()
    );
  });

  it("does not call getHumanReadableDiff if oldMeasure is missing", () => {
    render(
      <HumanReadableDiffViewer
        oldMeasure={null as any}
        newMeasure={mockNewMeasure}
        setDifferences={setDifferences}
      />
    );
    expect(mockMeasureServiceApi.getHumanReadableDiff).not.toHaveBeenCalled();
  });

  it("does not call getHumanReadableDiff if newMeasure is missing", () => {
    render(
      <HumanReadableDiffViewer
        oldMeasure={mockOldMeasure}
        newMeasure={null as any}
        setDifferences={setDifferences}
      />
    );
    expect(mockMeasureServiceApi.getHumanReadableDiff).not.toHaveBeenCalled();
  });

  it("calls getHumanReadableDiff when both measure ids are provided", async () => {
    mockMeasureServiceApi.getHumanReadableDiff.mockResolvedValue(
      mockHrDiffResponse
    );

    render(
      <HumanReadableDiffViewer
        oldMeasure={mockOldMeasure}
        newMeasure={mockNewMeasure}
        setDifferences={setDifferences}
      />
    );

    await waitFor(() =>
      expect(mockMeasureServiceApi.getHumanReadableDiff).toHaveBeenCalledWith(
        mockOldMeasure.id,
        mockNewMeasure.id
      )
    );
  });

  it("displays error message when getHumanReadableDiff fails", async () => {
    mockMeasureServiceApi.getHumanReadableDiff.mockRejectedValue(
      new Error("Some error")
    );

    render(
      <HumanReadableDiffViewer
        oldMeasure={mockOldMeasure}
        newMeasure={mockNewMeasure}
        setDifferences={setDifferences}
      />
    );

    await waitFor(() =>
      expect(
        screen.getByText(/Unable to retrieve differences./i)
      ).toBeInTheDocument()
    );
  });
});
