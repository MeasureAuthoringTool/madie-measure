import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ViewMeasureHistoryDialog, {
  MeasureHistoryActions,
} from "./ViewMeasureHistoryDialog";
import { Measure } from "@madie/madie-models";

// Mock dependencies
const mockGetMeasureHistoryLogs = jest.fn();
jest.mock("../../../api/useMeasureServiceApi", () => () => ({
  getMeasureHistoryLogs: mockGetMeasureHistoryLogs,
}));
jest.mock("@madie/madie-design-system/dist/react", () => ({
  MadieDialog: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  Pagination: (props: any) => (
    <div data-testid="pagination">
      <button
        data-testid="next-page"
        onClick={(e) => props.handlePageChange(e, props.page + 1)}
        disabled={props.hideNextButton}
      >
        Next
      </button>
      <button
        data-testid="prev-page"
        onClick={(e) => props.handlePageChange(e, props.page - 1)}
        disabled={props.hidePrevButton}
      >
        Prev
      </button>
      <select
        data-testid="limit-select"
        value={props.limit}
        onChange={props.handleLimitChange}
      >
        {props.limitOptions.map((opt: number) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  ),
  TruncateText: ({ text, ...props }: any) => <span {...props}>{text}</span>,
}));

const measure = {
  id: "measure-1",
  measureName: "Test Measure",
} as Measure;

const historyData: MeasureHistoryActions[] = [
  {
    performedAt: "2024-06-01T12:00:00Z",
    actionType: "CREATE",
    performedBy: "user1",
    additionalActionMessage: "Created measure",
  },
  {
    performedAt: "2024-06-02T13:00:00Z",
    actionType: "UPDATE",
    performedBy: "user2",
    additionalActionMessage: "Updated measure",
  },
];

describe("ViewMeasureHistoryDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders measure header with name, version, and draft chip", () => {
    mockGetMeasureHistoryLogs.mockResolvedValue(historyData);

    const draftMeasure = {
      ...measure,
      version: "1.0.000",
      measureMetaData: { draft: true },
    } as Measure;

    render(
      <ViewMeasureHistoryDialog
        measures={[draftMeasure]}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByTestId("measure-history-measure-name")
    ).toHaveTextContent("Test Measure");
    expect(screen.getByTestId("measure-history-version")).toHaveTextContent(
      "(Version 1.0.000)"
    );
    expect(
      screen.getByTestId("measure-history-draft-chip")
    ).toBeInTheDocument();
  });

  it("renders empty measure name if missing", () => {
    mockGetMeasureHistoryLogs.mockResolvedValue(historyData);
    const noNameMeasure = { id: "measure-2" } as Measure;

    render(
      <ViewMeasureHistoryDialog
        measures={[noNameMeasure]}
        open={true}
        onClose={jest.fn()}
      />
    );
    expect(
      screen.getByTestId("measure-history-measure-name")
    ).toHaveTextContent("");
  });

  it("does not render version span if version is missing", () => {
    mockGetMeasureHistoryLogs.mockResolvedValue(historyData);
    const noVersionMeasure = {
      ...measure,
      version: undefined,
    } as unknown as Measure;

    render(
      <ViewMeasureHistoryDialog
        measures={[noVersionMeasure]}
        open={true}
        onClose={jest.fn()}
      />
    );
    expect(
      screen.queryByTestId("measure-history-version")
    ).not.toBeInTheDocument();
  });

  it("does not render draft chip if draft is false or missing", () => {
    mockGetMeasureHistoryLogs.mockResolvedValue(historyData);
    const notDraftMeasure = {
      ...measure,
      measureMetaData: { draft: false },
    } as Measure;
    render(
      <ViewMeasureHistoryDialog
        measures={[notDraftMeasure]}
        open={true}
        onClose={jest.fn()}
      />
    );
    expect(
      screen.queryByTestId("measure-history-draft-chip")
    ).not.toBeInTheDocument();
  });

  it("shows loading state when fetching history", async () => {
    mockGetMeasureHistoryLogs.mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <ViewMeasureHistoryDialog
        measures={[measure]}
        open={true}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows 'No history found.' when no data", async () => {
    mockGetMeasureHistoryLogs.mockResolvedValue([]);
    render(
      <ViewMeasureHistoryDialog
        measures={[measure]}
        open={true}
        onClose={jest.fn()}
      />
    );
    await waitFor(() =>
      expect(screen.getByText("No history found.")).toBeInTheDocument()
    );
  });

  it("renders history rows when data is returned", async () => {
    mockGetMeasureHistoryLogs.mockResolvedValue(historyData);
    render(
      <ViewMeasureHistoryDialog
        measures={[measure]}
        open={true}
        onClose={jest.fn()}
      />
    );
    await waitFor(() =>
      expect(screen.getAllByTestId("row-item").length).toBe(2)
    );
    expect(screen.getByText("CREATE")).toBeInTheDocument();
    expect(screen.getByText("UPDATE")).toBeInTheDocument();
    expect(screen.getByText("user1")).toBeInTheDocument();
    expect(screen.getByText("user2")).toBeInTheDocument();
    expect(screen.getByText("Created measure")).toBeInTheDocument();
    expect(screen.getByText("Updated measure")).toBeInTheDocument();
  });

  it("handles pagination and limit change", async () => {
    const manyHistory = Array.from({ length: 12 }, (_, i) => ({
      performedAt: `2024-06-0${i + 1}T12:00:00Z`,
      actionType: `ACTION${i + 1}`,
      performedBy: `user${i + 1}`,
      additionalMessage: `msg${i + 1}`,
    }));
    mockGetMeasureHistoryLogs.mockResolvedValue(manyHistory);
    render(
      <ViewMeasureHistoryDialog
        measures={[measure]}
        open={true}
        onClose={jest.fn()}
      />
    );
    await waitFor(() =>
      expect(screen.getAllByTestId("row-item").length).toBe(10)
    );
    // Change limit
    fireEvent.change(screen.getByTestId("limit-select"), {
      target: { value: "10" },
    });
    await waitFor(() =>
      expect(screen.getAllByTestId("row-item").length).toBe(10)
    );
    // Next page
    fireEvent.click(screen.getByTestId("next-page"));
    await waitFor(() =>
      expect(screen.getAllByTestId("row-item").length).toBe(2)
    );
    // Prev page
    fireEvent.click(screen.getByTestId("prev-page"));
    await waitFor(() =>
      expect(screen.getAllByTestId("row-item").length).toBe(10)
    );
  });

  it("resets historyData and page when dialog closes", async () => {
    mockGetMeasureHistoryLogs.mockResolvedValue(historyData);
    const { rerender } = render(
      <ViewMeasureHistoryDialog
        measures={[measure]}
        open={true}
        onClose={jest.fn()}
      />
    );
    await waitFor(() =>
      expect(screen.getAllByTestId("row-item").length).toBe(2)
    );
    rerender(
      <ViewMeasureHistoryDialog
        measures={[measure]}
        open={false}
        onClose={jest.fn()}
      />
    );
    expect(screen.queryByTestId("row-item")).not.toBeInTheDocument();
  });

  it("does not fetch history if measures length is not 1", () => {
    render(
      <ViewMeasureHistoryDialog measures={[]} open={true} onClose={jest.fn()} />
    );
    expect(mockGetMeasureHistoryLogs).not.toHaveBeenCalled();
  });
});
