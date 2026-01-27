import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BooleanComponent from "./BooleanComponent";

describe("BooleanComponent Component", () => {
  test("renders BooleanComponent", () => {
    render(
      <BooleanComponent
        value={true}
        canEdit={true}
        fieldRequired={false}
        label="MyBoolean"
      />
    );

    expect(screen.getByTestId("boolean-field-MyBoolean")).toBeInTheDocument();

    expect(
      screen.getByTestId("boolean-input-field-MyBoolean")
    ).toBeInTheDocument();
  });

  test("changes value from false to true", () => {
    const handleChange = jest.fn();

    render(
      <BooleanComponent
        canEdit={true}
        value={false}
        fieldRequired={false}
        onChange={handleChange}
        label="BodyStructure.active"
      />
    );

    const select = screen.getByTestId(
      "boolean-input-field-BodyStructure.active"
    ) as HTMLInputElement;

    // false should render as "false"
    expect(select.value).toBe("false");

    fireEvent.change(select, { target: { value: "true" } });

    expect(handleChange).toHaveBeenCalled();
  });

  test("renders add button", () => {
    render(
      <BooleanComponent
        value={true}
        canEdit={true}
        fieldRequired={false}
        label="MyBoolean"
        addTitle="Active"
        showAddAttributeButton={true}
      />
    );

    expect(screen.getByText("Add Active")).toBeInTheDocument();
  });
});
