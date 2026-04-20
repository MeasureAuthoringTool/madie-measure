import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import EditCompositeTestCase from "./index";

const mockSearchMeasuresByCriteria = jest.fn();

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: () => ({
    searchMeasuresByCriteria: (...args: any[]) =>
      mockSearchMeasuresByCriteria(...args),
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

jest.mock("./CompositeLeftPanelContent", () => {
  return function MockLeftPanel(props: any) {
    return (
      <div data-testid="left-panel">
        <div data-testid="left-active-tab">{props.leftPanelActiveTab}</div>
        <div data-testid="composite-measures-count">
          {(props.compositeMeasures || []).length}
        </div>
      </div>
    );
  };
});

jest.mock("./CompositeRightPanelContent", () => {
  return function MockRightPanel(props: any) {
    return (
      <div data-testid="right-panel">
        <div data-testid="right-active-tab">{props.rightPanelActiveTab}</div>
      </div>
    );
  };
});

jest.mock("@madie/madie-design-system/dist/react", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

describe("EditCompositeTestCase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls searchMeasuresByCriteria on mount and passes returned measures to the left panel", async () => {
    mockSearchMeasuresByCriteria.mockResolvedValueOnce({
      content: [{ id: "m1" }, { id: "m2" }],
    });

    render(
      <EditCompositeTestCase
        allotmentRef={{ current: null }}
        editorVal={{}}
        setEditorVal={jest.fn()}
        testCaseCanEdit={true}
        seriesState={{ series: [] }}
        isModified={() => false}
        setDiscardDialogOpen={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasuresByCriteria).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByTestId("composite-measures-count")).toHaveTextContent(
        "2"
      );
    });

    expect(screen.getByTestId("left-active-tab")).toHaveTextContent("elements");
    expect(screen.getByTestId("right-active-tab")).toHaveTextContent("actual");
  });

  it("disables discard/save when isModified() is false; enables and triggers discard when true", async () => {
    mockSearchMeasuresByCriteria.mockResolvedValueOnce({ content: [] });

    const setDiscardDialogOpen = jest.fn();
    const { rerender } = render(
      <EditCompositeTestCase
        allotmentRef={{ current: null }}
        editorVal={{}}
        setEditorVal={jest.fn()}
        testCaseCanEdit={true}
        seriesState={{ series: [] }}
        isModified={() => false}
        setDiscardDialogOpen={setDiscardDialogOpen}
      />
    );

    await waitFor(() =>
      expect(mockSearchMeasuresByCriteria).toHaveBeenCalled()
    );

    expect(screen.getByTestId("edit-test-case-discard-button")).toBeDisabled();
    expect(screen.getByTestId("edit-test-case-save-button")).toBeDisabled();

    rerender(
      <EditCompositeTestCase
        allotmentRef={{ current: null }}
        editorVal={{}}
        setEditorVal={jest.fn()}
        testCaseCanEdit={true}
        seriesState={{ series: [] }}
        isModified={() => true}
        setDiscardDialogOpen={setDiscardDialogOpen}
      />
    );

    expect(screen.getByTestId("edit-test-case-discard-button")).toBeEnabled();
    expect(screen.getByTestId("edit-test-case-save-button")).toBeEnabled();

    fireEvent.click(screen.getByTestId("edit-test-case-discard-button"));
    expect(setDiscardDialogOpen).toHaveBeenCalledWith(true);
  });

  it("handles empty/undefined content by passing an empty array to left panel", async () => {
    mockSearchMeasuresByCriteria.mockResolvedValueOnce({});

    render(
      <EditCompositeTestCase
        allotmentRef={{ current: null }}
        editorVal={{}}
        setEditorVal={jest.fn()}
        testCaseCanEdit={true}
        seriesState={{ series: [] }}
        isModified={() => false}
        setDiscardDialogOpen={jest.fn()}
      />
    );

    await waitFor(() =>
      expect(mockSearchMeasuresByCriteria).toHaveBeenCalled()
    );

    await waitFor(() => {
      expect(screen.getByTestId("composite-measures-count")).toHaveTextContent(
        "0"
      );
    });
  });
});
