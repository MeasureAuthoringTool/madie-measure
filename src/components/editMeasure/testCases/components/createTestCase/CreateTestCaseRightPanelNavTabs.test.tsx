import * as React from "react";
import { render, screen } from "@testing-library/react";
import CreateTestCaseRightPanelNavTabs from "./CreateTestCaseRightPanelNavTabs";
import userEvent from "@testing-library/user-event";

describe("CreateTestCaseRightPanelNavTabs", () => {
  const mockSetRightPanelActiveTab = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("For non-composite measures", () => {
    it("should render all four tabs (CQL, Highlighting, Expected/Actual, Details)", () => {
      render(
        <CreateTestCaseRightPanelNavTabs
          rightPanelActiveTab="measurecql"
          isCompositeMeasure={false}
          setRightPanelActiveTab={mockSetRightPanelActiveTab}
        />
      );

      expect(screen.getByTestId("measurecql-tab")).toBeInTheDocument();
      expect(screen.getByTestId("highlighting-tab")).toBeInTheDocument();
      expect(screen.getByTestId("expectoractual-tab")).toBeInTheDocument();
      expect(screen.getByTestId("details-tab")).toBeInTheDocument();
      expect(screen.getByTestId("expectoractual-tab")).toHaveTextContent(
        "Expected / Actual"
      );
    });

    it("should allow switching between tabs", () => {
      render(
        <CreateTestCaseRightPanelNavTabs
          rightPanelActiveTab="measurecql"
          isCompositeMeasure={false}
          setRightPanelActiveTab={mockSetRightPanelActiveTab}
        />
      );

      userEvent.click(screen.getByTestId("expectoractual-tab"));
      expect(mockSetRightPanelActiveTab).toHaveBeenCalledWith("expectoractual");
    });
  });

  describe("For composite measures", () => {
    it("should hide CQL and Highlighting tabs", () => {
      render(
        <CreateTestCaseRightPanelNavTabs
          rightPanelActiveTab="expectoractual"
          isCompositeMeasure={true}
          setRightPanelActiveTab={mockSetRightPanelActiveTab}
        />
      );

      expect(screen.queryByTestId("measurecql-tab")).not.toBeInTheDocument();
      expect(screen.queryByTestId("highlighting-tab")).not.toBeInTheDocument();
      expect(screen.getByTestId("actual-tab")).toBeInTheDocument();
      expect(screen.getByTestId("details-tab")).toBeInTheDocument();
      expect(screen.getByTestId("actual-tab")).toHaveTextContent("Actual");
    });

    it("should allow switching to Details tab", () => {
      render(
        <CreateTestCaseRightPanelNavTabs
          rightPanelActiveTab="expectoractual"
          isCompositeMeasure={true}
          setRightPanelActiveTab={mockSetRightPanelActiveTab}
        />
      );

      userEvent.click(screen.getByTestId("details-tab"));
      expect(mockSetRightPanelActiveTab).toHaveBeenCalledWith("details");
    });
  });
});
