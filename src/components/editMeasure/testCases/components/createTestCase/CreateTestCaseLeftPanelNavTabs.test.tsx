import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CreateTestCaseLeftPanelNavTabs from "./CreateTestCaseLeftPanelNavTabs";
import userEvent from "@testing-library/user-event";

const { getByText, getByRole } = screen;

describe("Create Test Case nav tabs", () => {
  it("Follows discard behavior when dirty attempting to navigate to JSON", async () => {
    const mocksetLeftPanelActiveTab = jest.fn();
    render(
      <CreateTestCaseLeftPanelNavTabs
        leftPanelActiveTab="available"
        setLeftPanelActiveTab={mocksetLeftPanelActiveTab}
        isBuilderEnabled={true}
        dirty={true}
        setCalculationDialogOpen={jest.fn()}
        canEdit={true}
        addedCount={0}
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

  it("shows calculator icon", async () => {
    const mocksetLeftPanelActiveTab = jest.fn();
    const mocksetCalculationDialogOpen = jest.fn();
    render(
      <CreateTestCaseLeftPanelNavTabs
        leftPanelActiveTab="available"
        setLeftPanelActiveTab={mocksetLeftPanelActiveTab}
        isBuilderEnabled={true}
        dirty={true}
        setCalculationDialogOpen={mocksetCalculationDialogOpen}
        canEdit={true}
        addedCount={0}
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

  it("hides Available tab when canEdit is false", async () => {
    const mocksetLeftPanelActiveTab = jest.fn();
    render(
      <CreateTestCaseLeftPanelNavTabs
        leftPanelActiveTab="added"
        setLeftPanelActiveTab={mocksetLeftPanelActiveTab}
        isBuilderEnabled={true}
        dirty={false}
        setCalculationDialogOpen={jest.fn()}
        canEdit={false}
        addedCount={5}
      />
    );
    expect(screen.queryByTestId("available-tab")).not.toBeInTheDocument();
    expect(screen.getByTestId("added-tab")).toBeInTheDocument();
    expect(screen.getByText("Added (5)")).toBeInTheDocument();
    expect(screen.getByTestId("json-tab")).toBeInTheDocument();
  });

  it("shows all tabs when canEdit is true", async () => {
    const mocksetLeftPanelActiveTab = jest.fn();
    render(
      <CreateTestCaseLeftPanelNavTabs
        leftPanelActiveTab="available"
        setLeftPanelActiveTab={mocksetLeftPanelActiveTab}
        isBuilderEnabled={true}
        dirty={false}
        setCalculationDialogOpen={jest.fn()}
        canEdit={true}
        addedCount={3}
      />
    );
    expect(screen.getByTestId("available-tab")).toBeInTheDocument();
    expect(screen.getByTestId("added-tab")).toBeInTheDocument();
    expect(screen.getByText("Added (3)")).toBeInTheDocument();
    expect(screen.getByTestId("json-tab")).toBeInTheDocument();
  });
});
