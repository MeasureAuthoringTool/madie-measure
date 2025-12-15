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
  it("renders the action center icon and displays icons if available", async () => {
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

    const button = await screen.findByTestId(`action-center-button-${testId}`);
    await userEvent.click(button);
    for (const action of mockActions) {
      const actionButton = await screen.findByTestId(
        `action-center-${testId}_${action.name.replace(/\s/g, "")}`
      );
      expect(actionButton).toBeInTheDocument();
      expect(actionButton).toHaveAttribute("aria-label", action.name);
    }
  });

  it("calls the correct onClick handler with the target and closes the menu when an action is clicked", async () => {
    render(
      <ActionCenter actions={mockActions} testId={testId} target={mockTarget} />
    );
    const button = await screen.findByTestId(`action-center-button-${testId}`);
    await userEvent.click(button);

    for (const action of mockActions) {
      const actionButton = await screen.findByTestId(
        `action-center-${testId}_${action.name.replace(/\s/g, "")}`
      );
      await userEvent.click(actionButton);
      if (action.name !== "Delete") {
        expect(action.onClick).toHaveBeenCalledWith(mockTarget);
      }
    }
  });

  it("MadieDeleteDialog opens when delete action is clicked", async () => {
    render(
      <ActionCenter actions={mockActions} testId={testId} target={mockTarget} />
    );
    const button = await screen.findByTestId(`action-center-button-${testId}`);
    await userEvent.click(button);

    const deleteBtn = await screen.findByTestId(
      "action-center-test-component_Delete"
    );
    expect(deleteBtn).toBeInTheDocument();
    await userEvent.click(deleteBtn);

    const deleteDialog = await screen.findByTestId("delete-dialog");
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

    await userEvent.click(closeBtn);
    await waitFor(() => {
      expect(deleteDialog).not.toBeInTheDocument();
      expect(mockActions[1].onClick).not.toHaveBeenCalledWith(mockTarget);
    });
  });

  it("Clicks Cancel on MadieDeleteDialog cancels delete action", async () => {
    render(
      <ActionCenter actions={mockActions} testId={testId} target={mockTarget} />
    );
    const button = await screen.findByTestId(`action-center-button-${testId}`);
    await userEvent.click(button);

    const deleteBtn = await screen.findByTestId(
      "action-center-test-component_Delete"
    );
    expect(deleteBtn).toBeInTheDocument();
    await userEvent.click(deleteBtn);

    const deleteDialog = await screen.findByTestId("delete-dialog");
    expect(deleteDialog).toBeInTheDocument();
    expect(screen.getByText("Delete Element")).toBeInTheDocument();

    expect(screen.getByTestId("close-button")).toBeInTheDocument();
    const cancelBtn = screen.getByTestId("delete-dialog-cancel-button");
    expect(cancelBtn).toBeInTheDocument();
    expect(
      screen.getByTestId("delete-dialog-continue-button")
    ).toBeInTheDocument();

    await userEvent.click(cancelBtn);
    await waitFor(() => {
      expect(deleteDialog).not.toBeInTheDocument();
      expect(mockActions[1].onClick).not.toHaveBeenCalledWith(mockTarget);
    });
  });

  it("Clicks Continue on MadieDeleteDialog continues delete action", async () => {
    render(
      <ActionCenter actions={mockActions} testId={testId} target={mockTarget} />
    );
    const button = await screen.findByTestId(`action-center-button-${testId}`);
    await userEvent.click(button);

    const deleteBtn = await screen.findByTestId(
      "action-center-test-component_Delete"
    );
    expect(deleteBtn).toBeInTheDocument();
    await userEvent.click(deleteBtn);

    const deleteDialog = await screen.findByTestId("delete-dialog");
    expect(deleteDialog).toBeInTheDocument();
    expect(screen.getByText("Delete Element")).toBeInTheDocument();

    expect(screen.getByTestId("close-button")).toBeInTheDocument();

    expect(
      screen.getByTestId("delete-dialog-cancel-button")
    ).toBeInTheDocument();
    const continueBtn = screen.getByTestId("delete-dialog-continue-button");
    expect(continueBtn).toBeInTheDocument();

    await userEvent.click(continueBtn);
    await waitFor(() => {
      expect(deleteDialog).not.toBeInTheDocument();
      expect(mockActions[1].onClick).toHaveBeenCalledWith(mockTarget);
    });
  });

  it("renders disabled action correctly and prevents click", async () => {
    const disabledAction = {
      name: "Disabled Action",
      icon: <AddIcon />,
      onClick: jest.fn(),
      disabled: true,
      tooltip: "This is disabled",
    };
    const actions = [...mockActions, disabledAction];

    render(
      <ActionCenter actions={actions} testId={testId} target={mockTarget} />
    );

    const button = await screen.findByTestId(`action-center-button-${testId}`);
    await userEvent.click(button);

    const disabledBtn = await screen.findByTestId(
      "action-center-test-component_DisabledAction"
    );
    expect(disabledBtn).toBeInTheDocument();
    expect(disabledBtn).toHaveAttribute("aria-disabled", "true");

    // Verify tooltip is present (part of the component logic)
    // interacting with tooltip might be tricky, but we can check if it exists in the DOM if rendered always,
    // or we can skip strictly checking the tooltip via user interactions if it's handled by MUI Tooltip.
    // The component code: title: action.disabled && action.tooltip ? action.tooltip : action.name
    // So for disabled action, title should be "This is disabled".
    expect(disabledBtn).toHaveAttribute("aria-label", "This is disabled");

    await userEvent.click(disabledBtn);
    expect(disabledAction.onClick).not.toHaveBeenCalled();
  });
});
