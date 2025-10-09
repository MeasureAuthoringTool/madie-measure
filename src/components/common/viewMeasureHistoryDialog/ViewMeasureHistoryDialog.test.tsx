import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ViewMeasureHistoryDialog from "./ViewMeasureHistoryDialog";
import { Measure, MeasureHistoryActions } from "@madie/madie-models";
import { get } from "lodash";

// Mock dependencies]
const mockGetMeasureHistoryLogs = jest.fn();
const mockMeasureServiceApi = {
  getMeasureHistoryLogs: mockGetMeasureHistoryLogs,
};

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
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

  it("renders dialog with measure name", () => {
    mockMeasureServiceApi.getMeasureHistoryLogs = jest
      .fn()
      .mockResolvedValue(historyData);
    render(
      <ViewMeasureHistoryDialog
        measures={[measure]}
        open={true}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText("Test Measure")).toBeInTheDocument();
  });

  it("shows loading state when fetching history", async () => {
    mockMeasureServiceApi.getMeasureHistoryLogs = jest
      .fn()
      .mockResolvedValue(new Promise(() => {}));
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
    mockMeasureServiceApi.getMeasureHistoryLogs = jest
      .fn()
      .mockResolvedValue([]);
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
    mockMeasureServiceApi.getMeasureHistoryLogs = jest
      .fn()
      .mockResolvedValue(historyData);

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
    mockMeasureServiceApi.getMeasureHistoryLogs = jest
      .fn()
      .mockResolvedValue(manyHistory);

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
    mockMeasureServiceApi.getMeasureHistoryLogs = jest
      .fn()
      .mockResolvedValue(historyData);
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
