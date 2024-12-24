import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import UuidComponent from "./UuidComponent";
import userEvent from "@testing-library/user-event";

describe("UuidComponent", () => {
  it("Should render uuid and perform validations", async () => {
    const handleChange = jest.fn();
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    render(
      <UuidComponent
        value={uuid}
        label="uuid"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
      />
    );

    const stringField = screen.getByTestId("field-input-uuid");
    expect(stringField).toBeInTheDocument();
    const uuidInput = screen.getByTestId(
      "field-input-uuid"
    ) as HTMLInputElement;
    expect(uuidInput.value).toBe(uuid);
    // validate incorrect uuid format
    userEvent.type(uuidInput, "Incorrect uuid");
    await waitFor(() => {
      expect(
        screen.getByTestId("field-input-helper-text-uuid")
      ).toHaveTextContent("Please enter a valid uuid");
    });
  });
});
