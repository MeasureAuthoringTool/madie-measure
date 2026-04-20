import * as React from "react";
import { render, screen } from "@testing-library/react";
import MultipleSelectDropDown from "./MultipleSelectDropDown";
import userEvent from "@testing-library/user-event";

describe("MultipleSelectDropDown Component", () => {
  const selectOptions: string[] = ["Option 1", "Option 2"];
  const props = {
    formControl: null,
    id: "measure-group-type",
    label: "Type",
    options: selectOptions,
    onClose: jest.fn(),
    value: [],
  };
  it("Should provide auto complete selection", () => {
    render(<MultipleSelectDropDown {...props} />);

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

  it("Should render readonly state", () => {
    render(
      <MultipleSelectDropDown {...props} readOnly={true} value={["Option 2"]} />
    );

    const developers = screen.getByRole("textbox", {
      name: "Type",
    }) as HTMLInputElement;

    expect(developers).toHaveProperty("readOnly", true);
    expect(developers).toHaveTextContent("Option 2");
  });

  it("Should render - for readonly state if value is absent", () => {
    render(<MultipleSelectDropDown {...props} readOnly={true} />);
    const developers = screen.getByRole("textbox", {
      name: "Type",
    }) as HTMLInputElement;

    expect(developers).toHaveProperty("readOnly", true);
    expect(developers).toHaveValue("-");
  });
});
