import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import EditCompositeTestCase from "./index";

const mockFetchMeasuresByIds = jest.fn();

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: () => ({
    fetchMeasuresByIds: (...args: any[]) => mockFetchMeasuresByIds(...args),
  }),
}));

jest.mock("allotment", () => {
  const React = require("react");
  const Allotment = React.forwardRef(({ children }: any, ref: any) => (
    <div data-testid="allotment" ref={ref}>
      {children}
    </div>
  ));
  (Allotment as any).Pane = ({ children }: any) => (
    <div data-testid="allotment-pane">{children}</div>
  );
  return { Allotment };
});

const measureWithComponents = {
  groups: [
    {
      components: [{ measureId: "m1" }, { measureId: "m2" }],
    },
  ],
};

describe("EditCompositeTestCase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetchMeasuresByIds and passes results to left panel", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([{ id: "m1" }, { id: "m2" }]);

    render(
      <EditCompositeTestCase
        allotmentRef={{ current: null }}
        editorVal={{}}
        setEditorVal={jest.fn()}
        testCaseCanEdit
        seriesState={{ series: [] }}
        isModified={() => false}
        setDiscardDialogOpen={jest.fn()}
        measure={measureWithComponents}
      />
    );

    await waitFor(() =>
      expect(mockFetchMeasuresByIds).toHaveBeenCalledWith(["m1", "m2"])
    );
    expect(screen.getByTestId("create-panel")).toBeInTheDocument();
  });

  it("disables discard/save when unmodified and enables when modified", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([]);

    const setDiscardDialogOpen = jest.fn();
    const { rerender } = render(
      <EditCompositeTestCase
        allotmentRef={{ current: null }}
        editorVal={{}}
        setEditorVal={jest.fn()}
        testCaseCanEdit
        seriesState={{ series: [] }}
        isModified={() => false}
        setDiscardDialogOpen={setDiscardDialogOpen}
        measure={measureWithComponents}
      />
    );

    await waitFor(() => expect(mockFetchMeasuresByIds).toHaveBeenCalled());

    expect(screen.getByTestId("edit-test-case-discard-button")).toBeDisabled();

    expect(screen.getByTestId("edit-test-case-save-button")).toBeDisabled();

    rerender(
      <EditCompositeTestCase
        allotmentRef={{ current: null }}
        editorVal={{}}
        setEditorVal={jest.fn()}
        testCaseCanEdit
        seriesState={{ series: [] }}
        isModified={() => true}
        setDiscardDialogOpen={setDiscardDialogOpen}
        measure={measureWithComponents}
      />
    );

    fireEvent.click(screen.getByTestId("edit-test-case-discard-button"));

    expect(setDiscardDialogOpen).toHaveBeenCalledWith(true);
  });

  it("handles empty results safely", async () => {
    mockFetchMeasuresByIds.mockResolvedValueOnce([]);

    render(
      <EditCompositeTestCase
        allotmentRef={{ current: null }}
        editorVal={{}}
        setEditorVal={jest.fn()}
        testCaseCanEdit
        seriesState={{ series: [] }}
        isModified={() => false}
        setDiscardDialogOpen={jest.fn()}
        measure={measureWithComponents}
      />
    );

    await waitFor(() => expect(mockFetchMeasuresByIds).toHaveBeenCalled());

    expect(screen.getByTestId("create-panel")).toBeInTheDocument();
  });

  it("logs an error when fetchMeasuresForComponents fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockFetchMeasuresByIds.mockRejectedValueOnce(new Error("fetch failed"));

    render(
      <EditCompositeTestCase
        allotmentRef={{ current: null }}
        editorVal={{}}
        setEditorVal={jest.fn()}
        testCaseCanEdit
        seriesState={{ series: [] }}
        isModified={() => false}
        setDiscardDialogOpen={jest.fn()}
        measure={{
          groups: [
            {
              components: [{ measureId: "m1" }],
            },
          ],
        }}
      />
    );

    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith(
        "error retrieving components",
        expect.any(Error)
      )
    );

    consoleSpy.mockRestore();
  });
});
