import * as React from "react";
import { render, screen } from "@testing-library/react";
import ActionCenter from "./ActionCenter";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import userEvent from "@testing-library/user-event";

const mockActions = [
  { name: "Add Item", icon: <AddIcon />, onClick: jest.fn() },
  { name: "Delete Item", icon: <DeleteIcon />, onClick: jest.fn() },
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
      expect(action.onClick).toHaveBeenCalledWith(mockTarget);
    });
  });
});
