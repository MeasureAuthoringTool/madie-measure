import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DateComponent from "./DateComponent";

describe("DateComponent", () => {
  test("Should render DateComponent", () => {
    const handleChange = jest.fn();
    render(
      <DateComponent
        value={`2024-09-26`}
        label="birthday"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
      />
    );

    const dateField = screen.getByTestId("YYYY-MM-DD-field-birthday");
    expect(dateField).toBeInTheDocument();
    const dateFieldInput = screen.getByTestId(
      "YYYY-MM-DD-field-birthday-input"
    );
    expect(dateFieldInput).toBeInTheDocument();
    expect(dateFieldInput.value).toBe("09/26/2024");
  });

  test("Test DateComponent change of value", () => {
    const handleChange = jest.fn();
    const { rerender } = render(
      <DateComponent
        value={`2024-09-26`}
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        label="birthday"
        structureDefinition={null}
      />
    );

    const dateField = screen.getByTestId("YYYY-MM-DD-field-birthday");
    expect(dateField).toBeInTheDocument();
    const dateFieldInput = screen.getByTestId(
      "YYYY-MM-DD-field-birthday-input"
    );
    expect(dateFieldInput).toBeInTheDocument();
    expect(dateFieldInput.value).toBe("09/26/2024");

    fireEvent.change(dateFieldInput, {
      target: { value: "2024-09-27" },
    });
    rerender(
      <DateComponent
        value={`2024-09-27`}
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        label="BIRTHDATE"
        structureDefinition={null}
      />
    );
    expect(dateFieldInput.value).toBe("09/27/2024");
  });
});
