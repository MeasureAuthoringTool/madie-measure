import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CreateTestCaseLeftPanelNavTabs from "./CreateTestCaseLeftPanelNavTabs";
import userEvent from "@testing-library/user-event";
// @ts-ignore
import { useFeatureFlags } from "@madie/madie-util";

const { getByText, getByRole } = screen;

jest.mock("@madie/madie-util", () => {
  return {
    useFeatureFlags: jest.fn(() => {
      return {
        Calculator: true,
      };
    }),
  };
});
describe("Create Test Case nav tabs", () => {
  it("Follows discard behavior when dirty attempting to navigate to JSON", async () => {
    const mocksetLeftPanelActiveTab = jest.fn();
    render(
      <CreateTestCaseLeftPanelNavTabs
        leftPanelActiveTab="elements"
        setLeftPanelActiveTab={mocksetLeftPanelActiveTab}
        isQICore6={true}
        dirty={true}
        setCalculationDialogOpen={jest.fn()}
      />
    );
    //open
    userEvent.click(screen.getByTestId("json-tab"));
    const discardDialog = await getByRole("dialog", {
      name: "Discard Changes?",
    });
    expect(discardDialog).toBeInTheDocument();
    // close
    const closeButton = screen.getByRole("button", { name: /close/i });
    userEvent.click(closeButton);
    await waitFor(() => {
      expect(closeButton).not.toBeInTheDocument();
    });
    userEvent.click(getByText("JSON"));
    await waitFor(() => {
      expect(getByText("Discard Changes?")).toBeInTheDocument();
    });
    // on continue
    userEvent.click(getByText("Yes, Discard All Changes"));
    await waitFor(() => {
      expect(closeButton).not.toBeInTheDocument();
    });
  });

  it("Does show calculator icon when feature flag is on", async () => {
    const mocksetLeftPanelActiveTab = jest.fn();
    const mocksetCalculationDialogOpen = jest.fn();
    render(
      <CreateTestCaseLeftPanelNavTabs
        leftPanelActiveTab="elements"
        setLeftPanelActiveTab={mocksetLeftPanelActiveTab}
        isQICore6={true}
        dirty={true}
        setCalculationDialogOpen={mocksetCalculationDialogOpen}
      />
    );
    expect(
      screen.queryByTestId("editor-calculator-button")
    ).toBeInTheDocument();

    const calculatorButton = screen.getByTestId("editor-calculator-button");
    userEvent.click(calculatorButton);

    expect(mocksetCalculationDialogOpen).toHaveBeenCalledTimes(1);
    expect(mocksetCalculationDialogOpen).toHaveBeenCalledWith(true);
  });

  it("Does not show calculator icon when feature flag is off", async () => {
    const mocksetLeftPanelActiveTab = jest.fn();
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => {
      return {
        Calculator: false,
      };
    });
    render(
      <CreateTestCaseLeftPanelNavTabs
        leftPanelActiveTab="elements"
        setLeftPanelActiveTab={mocksetLeftPanelActiveTab}
        isQICore6={true}
        dirty={true}
        setCalculationDialogOpen={jest.fn()}
      />
    );
    expect(
      screen.queryByTestId("editor-calculator-button")
    ).not.toBeInTheDocument();
  });
});
