import * as React from "react";
import { render, screen } from "@testing-library/react";
import TimeComponent from "./TimeComponent";
import userEvent from "@testing-library/user-event";

describe("TimeComponent", () => {
  test("Should render TimeComponent", () => {
    const handleChange = jest.fn();
    render(
      <TimeComponent
        canEdit={true}
        structureDefinition={null}
        fieldRequired={false}
        onChange={handleChange}
        value={`01:23:45`}
      />
    );

    const inputTime = screen.getByPlaceholderText("hh:mm:ss aa");
    expect(inputTime).toBeInTheDocument();
  });

  test("Should handle change, AddElementButton, and DeleteButton functionality", () => {
    const handleChange = jest.fn();
    const handleAddElement = jest.fn();
    const handleDeleteElement = jest.fn();
    render(
      <TimeComponent
        canEdit={true}
        structureDefinition={null}
        fieldRequired={false}
        onChange={handleChange}
        value={`01:23:45`}
        addTitle={"Time"}
        showAddAttributeButton={true}
        handleAddElement={handleAddElement}
        showDeleteButton={true}
        handleDeleteElement={handleDeleteElement}
        label="Time"
      />
    );

    // Test AddElementButton is rendered
    expect(screen.getByText("Add Time")).toBeInTheDocument();

    // Test DeleteButton is rendered
    const deleteButton = screen.getByTestId("delete-button-Time");
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveAttribute("aria-label", "delete Time");

    // Test time input change
    const input = screen.getByPlaceholderText("hh:mm:ss aa");
    userEvent.type(input, "082359AM");
    expect(input).toHaveValue("08:23:59 AM");
    expect(handleChange).toHaveBeenCalledWith("08:23:59");

    // Test AddElementButton click
    const addButton = screen.getByText("Add Time");
    userEvent.click(addButton);
    expect(handleAddElement).toHaveBeenCalledTimes(1);

    // Test DeleteButton click
    userEvent.click(deleteButton);
    expect(handleDeleteElement).toHaveBeenCalledTimes(1);
  });

  test("AddElementButton is not rendered when showAddAttributeButton is false", () => {
    const handleChange = jest.fn();
    render(
      <TimeComponent
        canEdit={true}
        structureDefinition={null}
        fieldRequired={false}
        onChange={handleChange}
        value={`01:23:45`}
        addTitle={"Time"}
        showAddAttributeButton={false}
      />
    );

    expect(screen.queryByText("Add Time")).not.toBeInTheDocument();
  });

  test("Delete and Add buttons are not rendered when canEdit is false", () => {
    const handleChange = jest.fn();
    const handleAddElement = jest.fn();
    const handleDeleteElement = jest.fn();
    render(
      <TimeComponent
        canEdit={false}
        structureDefinition={null}
        fieldRequired={false}
        onChange={handleChange}
        value={`01:23:45`}
        addTitle={"Time"}
        showAddAttributeButton={true}
        handleAddElement={handleAddElement}
        showDeleteButton={true}
        handleDeleteElement={handleDeleteElement}
        label="Time"
      />
    );

    // Both buttons should not be rendered when canEdit is false
    expect(screen.queryByText("Add Time")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-button-Time")).not.toBeInTheDocument();
  });
});
