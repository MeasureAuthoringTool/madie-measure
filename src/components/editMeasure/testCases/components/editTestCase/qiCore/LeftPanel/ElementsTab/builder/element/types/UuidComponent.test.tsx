import * as React from "react";
import { render, screen } from "@testing-library/react";
import UuidComponent from "./UuidComponent";
import userEvent from "@testing-library/user-event";

describe("UuidComponent", () => {
  it("Should render uuid and perform validations", async () => {
    const handleChange = jest.fn();
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    render(
      <UuidComponent
        value={null}
        label="uuid"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
        addTitle={"UUID"}
        showAddAttributeButton={true}
      />
    );
    expect(screen.getByText("Add UUID")).toBeInTheDocument();
    const uuidInput = screen.getByTestId(
      "field-input-uuid"
    ) as HTMLInputElement;
    // valid uuid
    userEvent.type(uuidInput, uuid);
    expect(uuidInput.value).toBe(uuid);
    expect(
      screen.getByTestId("field-input-helper-text-uuid")
    ).toBeEmptyDOMElement();

    // invalidate uuid format
    userEvent.clear(uuidInput);
    userEvent.type(uuidInput, "Incorrect uuid");
    expect(uuidInput).toHaveValue("Incorrect uuid");
    expect(
      screen.getByTestId("field-input-helper-text-uuid")
    ).toHaveTextContent("Please enter a valid uuid");
  });
});
