import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import DataElementActions from "./DataElementActions";
import userEvent from "@testing-library/user-event";

const mockOnDelete = jest.fn();
const mockOnView = jest.fn();
const mockOnClone = jest.fn();

describe("DatElementActions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should display only View action button for a non owner", () => {
    render(
      <DataElementActions
        elementId={"exampleId"}
        canView={true}
        onDelete={mockOnDelete}
        onView={mockOnView}
        canEdit={false}
        onClone={mockOnClone}
      />
    );

    const viewButton = screen.getByRole("button", { name: "View" });
    expect(viewButton).toBeInTheDocument();
    userEvent.click(viewButton);
    expect(mockOnView).toHaveBeenCalledTimes(1);
  });

  it("Should display View action button along with popover for the owner", async () => {
    render(
      <DataElementActions
        elementId={"exampleId"}
        canView={true}
        onDelete={mockOnDelete}
        onView={mockOnView}
        canEdit={true}
        onClone={mockOnClone}
      />
    );

    const viewButton = screen.getByRole("button", {
      name: `action-center-exampleId`,
    });
    expect(viewButton).toBeInTheDocument();
    userEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId(`action-center-exampleId`)).toBeInTheDocument();
    });

    const editButton = screen.getByTestId("edit-element-exampleId");
    userEvent.click(editButton);
    expect(mockOnView).toHaveBeenCalledTimes(1);
  });

  it("Should display the clone option to the user and calls onClone when clicked", async () => {
    render(
      <DataElementActions
        elementId={"exampleId"}
        canView={true}
        onDelete={mockOnDelete}
        onView={mockOnView}
        canEdit={true}
        onClone={mockOnClone}
      />
    );

    const viewButton = screen.getByRole("button", {
      name: `action-center-exampleId`,
    });
    expect(viewButton).toBeInTheDocument();
    userEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId(`action-center-exampleId`)).toBeInTheDocument();
    });

    const cloneButton = screen.getByTestId("clone-element-exampleId");

    userEvent.click(cloneButton);
    expect(mockOnClone).toHaveBeenCalledTimes(1);
  });

  it("Should display the delete button if the user is owner and deletes a dataElement when clicked", async () => {
    render(
      <DataElementActions
        elementId={"exampleId"}
        canView={true}
        onDelete={mockOnDelete}
        onView={mockOnView}
        canEdit={true}
        onClone={mockOnClone}
      />
    );

    const viewButton = screen.getByRole("button", {
      name: `action-center-exampleId`,
    });
    expect(viewButton).toBeInTheDocument();
    userEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId(`action-center-exampleId`)).toBeInTheDocument();
    });

    const deleteButton = screen.getByTestId("delete-element-exampleId");

    userEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });
});
