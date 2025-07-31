import * as React from "react";
import { render, screen } from "@testing-library/react";
import Base64BinaryComponent from "./Base64BinaryComponent";
import userEvent from "@testing-library/user-event";

describe("Base64BinaryComponent", () => {
  it("Should render Base64BinaryComponent", async () => {
    const handleChange = jest.fn();

    render(
      <Base64BinaryComponent
        value={null}
        label="Base64BinaryComponent"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
      />
    );

    expect(screen.getByText("Base64BinaryComponent")).toBeInTheDocument();
    expect(
      screen.getByTestId("field-input-Base64BinaryComponent")
    ).toBeInTheDocument();
  });

  it("Should validate input", async () => {
    const handleChange = jest.fn();

    render(
      <Base64BinaryComponent
        value={null}
        label="Base64BinaryComponent"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
      />
    );

    const base64BinaryInput = screen.getByTestId(
      "field-input-Base64BinaryComponent"
    ) as HTMLInputElement;

    // valid base64BinaryInput
    userEvent.type(base64BinaryInput, "abcd");
    expect(base64BinaryInput.value).toBe("abcd");
    expect(
      screen.getByTestId("field-input-helper-text-Base64BinaryComponent")
    ).toBeEmptyDOMElement();

    // invalid base64BinaryInput
    userEvent.clear(base64BinaryInput);
    userEvent.type(base64BinaryInput, "invalid base64BinaryInput.");
    expect(base64BinaryInput).toHaveValue("invalid base64BinaryInput.");
    expect(
      screen.getByTestId("field-input-helper-text-Base64BinaryComponent")
    ).toHaveTextContent("Please enter a valid Base64Binary");
  });

  test("Should render an add button", () => {
    const handleChange = jest.fn();
    render(
      <Base64BinaryComponent
        value={null}
        label="Base64BinaryComponent"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        addTitle="Binary"
        showAddAttributeButton={true}
      />
    );
    expect(screen.getByText("Add Binary")).toBeInTheDocument();
  });
});
