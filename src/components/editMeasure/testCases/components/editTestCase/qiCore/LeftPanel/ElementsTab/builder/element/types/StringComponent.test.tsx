import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StringComponent from "./StringComponent";

describe("StringComponent", () => {
  test("Should render StringComponent", () => {
    const handleChange = jest.fn();
    render(
      <StringComponent
        value={`This is a string component`}
        label="String"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
      />
    );

    const stringFieldInput = screen.getByTestId(
      "string-field-input-String"
    ) as HTMLInputElement;
    expect(stringFieldInput).toBeInTheDocument();
    expect(stringFieldInput.value).toBe("This is a string component");
  });

  test("Test StringComponent change of value only allows string values", () => {
    const handleChange = jest.fn();
    const { rerender } = render(
      <StringComponent
        value={`This is a string component`}
        label="String"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
      />
    );

    const stringFieldInput = screen.getByTestId(
      "string-field-input-String"
    ) as HTMLInputElement;
    expect(stringFieldInput).not.toHaveAttribute("readOnly");
    expect(stringFieldInput).toBeInTheDocument();
    expect(stringFieldInput.value).toBe("This is a string component");

    fireEvent.change(stringFieldInput, {
      target: { value: "new string-12345,./<>?" },
    });
    rerender(
      <StringComponent
        value={`new string`}
        label="String"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
      />
    );
    expect(stringFieldInput.value).toBe("new string");
  });

  test("Test StringComponent should handle key press change", () => {
    const handleChange = jest.fn();
    const { rerender } = render(
      <StringComponent
        value={`This is a string component`}
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
      />
    );

    const stringFieldInput = screen.getByTestId(
      "string-field-input-VALUE"
    ) as HTMLInputElement;
    expect(stringFieldInput).toBeInTheDocument();
    expect(stringFieldInput.value).toBe("This is a string component");

    fireEvent.keyPress(stringFieldInput, { key: "-", charCode: 173 });
    expect(stringFieldInput.value).toBe("This is a string component");
    fireEvent.keyPress(stringFieldInput, { key: "a", charCode: 97 });
    expect(stringFieldInput.value).toBe("This is a string component");
  });
  test("StringComponent should be read only if root id", () => {
    const handleChange = jest.fn();
    const { rerender } = render(
      <StringComponent
        value={`This is a string component`}
        canEdit={true}
        label="AdverseEvent.id"
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
        addTitle={"String"}
        showAddAttributeButton={true}
      />
    );
    expect(screen.getByText("Add String")).toBeInTheDocument();

    const stringFieldInput = screen.getByTestId(
      "string-field-input-AdverseEvent.id"
    );
    expect(stringFieldInput).toBeInTheDocument();
    expect(stringFieldInput).toHaveAttribute("readOnly");
  });

  test("AddButton works", () => {
    const handleChange = jest.fn();
    const handleAddElement = jest.fn();
    render(
      <StringComponent
        value="This is a string component"
        canEdit={true}
        label="AdverseEvent.id"
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
        addTitle="String"
        showAddAttributeButton={true}
        handleAddElement={handleAddElement}
      />
    );
    expect(screen.getByText("Add String")).toBeInTheDocument();

    const stringFieldInput = screen.getByTestId(
      "string-field-input-AdverseEvent.id"
    );
    expect(stringFieldInput).toBeInTheDocument();
    expect(stringFieldInput).toHaveAttribute("readOnly");

    // Test AddElementButton click
    const addButton = screen.getByText("Add String");
    fireEvent.click(addButton);
    expect(handleAddElement).toHaveBeenCalled();
  });

  test("filters non-letter input when stringOnly is true", () => {
    const handleChange = jest.fn();
    render(
      <StringComponent
        value=""
        label="String"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
        stringOnly={true}
      />
    );
    const input = screen.getByTestId("string-field-input-String");
    //const preventDefault = jest.fn();
    const preventDefaultSpy = jest.spyOn(
      window.Event.prototype,
      "preventDefault"
    );
    fireEvent.keyPress(input, { key: "1", charCode: 49, preventDefaultSpy });
    expect(preventDefaultSpy).toHaveBeenCalled();
    preventDefaultSpy.mockRestore();
  });

  test("does not filter letter input when stringOnly is true", () => {
    const handleChange = jest.fn();
    render(
      <StringComponent
        value=""
        label="String"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
        stringOnly={true}
      />
    );
    const input = screen.getByTestId("string-field-input-String");
    //const preventDefault = jest.fn();
    const preventDefaultSpy = jest.spyOn(
      window.Event.prototype,
      "preventDefault"
    );
    fireEvent.keyPress(input, { key: "a", charCode: 97, preventDefaultSpy });
    expect(preventDefaultSpy).not.toHaveBeenCalled();
    preventDefaultSpy.mockRestore();
  });

  test("renders delete button only when showDeleteButton and canEdit are true", () => {
    const handleDeleteElement = jest.fn();
    render(
      <StringComponent
        value="test"
        label="UniqueLabel"
        canEdit={true}
        fieldRequired={false}
        onChange={jest.fn()}
        structureDefinition={null}
        showDeleteButton={true}
        handleDeleteElement={handleDeleteElement}
      />
    );
    const deleteButton = screen.getByTestId("delete-button-UniqueLabel");
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);
    expect(handleDeleteElement).toHaveBeenCalled();
  });
});
