import { jest } from "@jest/globals";
import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ActionCenter from "./ActionCenter";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import userEvent from "@testing-library/user-event";

const mockActions = [
  { name: "Add", icon: <AddIcon />, onClick: jest.fn() },
  { name: "Delete", icon: <DeleteIcon />, onClick: jest.fn() },
];

const mockTarget = { id: "test-target" };
const testId = "test-component";

describe("ActionCenter", () => {
  it("renders the action center icon and displays icons if available", () => {
    render(
      <ActionCenter actions={mockActions} testId={testId} target={mockTarget} />
    );
    mockActions.forEach((action) => {
      expect(
        screen.queryByTestId(
          `action-center-${testId}_${action.name.replace(/\s/g, "")}`
        )
      ).toBeNull();
    });

    const button = screen.getByTestId(`action-center-button-${testId}`);
    userEvent.click(button);
    mockActions.forEach((action) => {
      const actionButton = screen.getByTestId(
        `action-center-${testId}_${action.name.replace(/\s/g, "")}`
      );
      expect(actionButton).toBeInTheDocument();
      expect(actionButton).toHaveAttribute("aria-label", action.name);
    });
  });

  it("calls the correct onClick handler with the target and closes the menu when an action is clicked", () => {
    render(
      <ActionCenter actions={mockActions} testId={testId} target={mockTarget} />
    );
    const button = screen.getByTestId(`action-center-button-${testId}`);
    userEvent.click(button);

    mockActions.forEach((action) => {
      const actionButton = screen.getByTestId(
        `action-center-${testId}_${action.name.replace(/\s/g, "")}`
      );
      userEvent.click(actionButton);
      if (action.name !== "Delete") {
        expect(action.onClick).toHaveBeenCalledWith(mockTarget);
      }
    });
  });

  it("MadieDeleteDialog opens when delect action is clicked", async () => {
    render(
      <ActionCenter actions={mockActions} testId={testId} target={mockTarget} />
    );
    const button = screen.getByTestId(`action-center-button-${testId}`);
    userEvent.click(button);

    const deleteBtn = screen.getByTestId("action-center-test-component_Delete");
    expect(deleteBtn).toBeInTheDocument();
    userEvent.click(deleteBtn);

    const deleteDialog = screen.getByTestId("delete-dialog");
    expect(deleteDialog).toBeInTheDocument();
    expect(screen.getByText("Delete Element")).toBeInTheDocument();

    const closeBtn = screen.getByTestId("close-button");
    expect(closeBtn).toBeInTheDocument();
    expect(
      screen.getByTestId("delete-dialog-cancel-button")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("delete-dialog-continue-button")
    ).toBeInTheDocument();

    userEvent.click(closeBtn);
    await waitFor(() => {
      expect(deleteDialog).not.toBeInTheDocument();
      expect(mockActions[1].onClick).not.toHaveBeenCalledWith(mockTarget);
    });
  });

  it("Clicks Cancel on MadieDeleteDialog cancels delete action", async () => {
    render(
      <ActionCenter actions={mockActions} testId={testId} target={mockTarget} />
    );
    const button = screen.getByTestId(`action-center-button-${testId}`);
    userEvent.click(button);

    const deleteBtn = screen.getByTestId("action-center-test-component_Delete");
    expect(deleteBtn).toBeInTheDocument();
    userEvent.click(deleteBtn);

    const deleteDialog = screen.getByTestId("delete-dialog");
    expect(deleteDialog).toBeInTheDocument();
    expect(screen.getByText("Delete Element")).toBeInTheDocument();

    expect(screen.getByTestId("close-button")).toBeInTheDocument();
    const cancelBtn = screen.getByTestId("delete-dialog-cancel-button");
    expect(cancelBtn).toBeInTheDocument();
    expect(
      screen.getByTestId("delete-dialog-continue-button")
    ).toBeInTheDocument();

    userEvent.click(cancelBtn);
    await waitFor(() => {
      expect(deleteDialog).not.toBeInTheDocument();
      expect(mockActions[1].onClick).not.toHaveBeenCalledWith(mockTarget);
    });
  });

  it("Clicks Continue on MadieDeleteDialog continues delete action", async () => {
    render(
      <ActionCenter actions={mockActions} testId={testId} target={mockTarget} />
    );
    const button = screen.getByTestId(`action-center-button-${testId}`);
    userEvent.click(button);

    const deleteBtn = screen.getByTestId("action-center-test-component_Delete");
    expect(deleteBtn).toBeInTheDocument();
    userEvent.click(deleteBtn);

    const deleteDialog = screen.getByTestId("delete-dialog");
    expect(deleteDialog).toBeInTheDocument();
    expect(screen.getByText("Delete Element")).toBeInTheDocument();

    expect(screen.getByTestId("close-button")).toBeInTheDocument();

    expect(
      screen.getByTestId("delete-dialog-cancel-button")
    ).toBeInTheDocument();
    const continueBtn = screen.getByTestId("delete-dialog-continue-button");
    expect(continueBtn).toBeInTheDocument();

    userEvent.click(continueBtn);
    await waitFor(() => {
      expect(deleteDialog).not.toBeInTheDocument();
      expect(mockActions[1].onClick).toHaveBeenCalledWith(mockTarget);
    });
  });
});
