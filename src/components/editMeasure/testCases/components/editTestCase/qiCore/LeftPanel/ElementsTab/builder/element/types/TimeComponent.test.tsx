import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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

  test("Should handle change and AddElementButton functionality", () => {
    const handleChange = jest.fn();
    const handleAddElement = jest.fn();
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
      />
    );
    expect(screen.getByText("Add Time")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("hh:mm:ss aa");
    userEvent.type(input, "082359AM");
    expect(input).toHaveValue("08:23:59 AM");
    expect(handleChange).toHaveBeenCalledWith("08:23:59");

    // Test AddElementButton click
    const addButton = screen.getByText("Add Time");
    fireEvent.click(addButton);
    expect(handleAddElement).toHaveBeenCalled();
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

  test("AddElementButton is not rendered when addTitle is not provided", () => {
    const handleChange = jest.fn();
    render(
      <TimeComponent
        canEdit={true}
        structureDefinition={null}
        fieldRequired={false}
        onChange={handleChange}
        value={`01:23:45`}
        showAddAttributeButton={true}
      />
    );

    expect(screen.queryByText(/Add/)).not.toBeInTheDocument();
  });
});
