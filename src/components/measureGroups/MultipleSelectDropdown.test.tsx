import * as React from "react";
import { render, screen } from "@testing-library/react";
import MultipleSelectDropDown from "./MultipleSelectDropDown";
import userEvent from "@testing-library/user-event";

describe("MultipleSelectDropDown Component", () => {
  const selectOptions: string[] = ["Option 1", "Option 2"];
  test("Should provide auto complete selection", () => {
    render(
      <MultipleSelectDropDown
        formControl={null}
        id="measure-group-type"
        label="Type"
        required={false}
        disabled={false}
        error={true}
        options={selectOptions}
        multipleSelect={false}
        limitTags={2}
      />
    );

    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    expect(measureGroupTypeSelect).toBeInTheDocument();
    const measureGroupTypeSelectButton = screen.getByRole("button", {
      name: "Open",
    });

    userEvent.click(measureGroupTypeSelectButton);

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();

    userEvent.type(measureGroupTypeSelectButton, "Option 1");
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.queryByText("Option 2")).not.toBeInTheDocument();
  });
});
