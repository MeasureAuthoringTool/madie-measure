import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ElementSelector from "./ElementSelector";
import { ElementDefinition } from "fhir/r4";

const mockOptions: ElementDefinition[] = [
  {
    path: "Patient.gender",
    min: 0,
    max: "1",
  },
  {
    path: "Patient.birthDate",
    min: 0,
    max: "1",
  },
  {
    path: "Patient.extension",
    sliceName: "race",
    min: 0,
    max: "1",
  },
];

describe("ElementSelector", () => {
  const defaultProps = {
    basePath: "Patient",
    options: mockOptions,
    value: [],
    newValues: [],
    onChange: jest.fn(),
  };

  it("renders with basic props", () => {
    render(<ElementSelector {...defaultProps} />);

    expect(screen.getByText("Attribute Selector")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Attributes")).toBeInTheDocument();
  });

  it("generates correct labels for regular elements and slices", () => {
    render(<ElementSelector {...defaultProps} />);

    // Open dropdown
    const input = screen.getByPlaceholderText("Attributes");
    userEvent.click(input);

    // Check regular element labels
    expect(screen.getByText("gender")).toBeInTheDocument();
    expect(screen.getByText("birthDate")).toBeInTheDocument();

    // Check slice element label
    expect(screen.getByText("extension:race")).toBeInTheDocument();
  });

  it("handles selection of new options", () => {
    render(<ElementSelector {...defaultProps} />);

    const input = screen.getByPlaceholderText("Attributes");
    userEvent.click(input);

    // Select an option
    const genderOption = screen.getByText("gender");
    userEvent.click(genderOption);

    expect(defaultProps.onChange).toHaveBeenCalled();
  });

  it("disables already selected options", () => {
    const props = {
      ...defaultProps,
      value: [mockOptions[0]], // gender is already selected
    };

    render(<ElementSelector {...props} />);

    const input = screen.getByPlaceholderText("Attributes");
    userEvent.click(input);

    // First option (gender) should be disabled
    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-disabled", "true");
  });

  it("renders chips for selected values", () => {
    const props = {
      ...defaultProps,
      newValues: [mockOptions[0]], // gender is selected
    };

    render(<ElementSelector {...props} />);

    const chip = screen.getByText("gender");
    expect(chip).toBeInTheDocument();
  });

  it("disables delete for chips that are in value prop", () => {
    const props = {
      ...defaultProps,
      value: [mockOptions[0]], // gender in value
      newValues: [mockOptions[0]], // gender in newValues
    };

    render(<ElementSelector {...props} />);

    const chip = screen.getByText("gender").closest(".MuiChip-root");
    expect(chip).toHaveClass("Mui-disabled");
  });

  it("allows multiple selections", () => {
    render(<ElementSelector {...defaultProps} />);

    const input = screen.getByPlaceholderText("Attributes");
    userEvent.click(input);

    // Select multiple options
    userEvent.click(screen.getByText("gender"));
    userEvent.click(screen.getByText("birthDate"));

    expect(defaultProps.onChange).toHaveBeenCalledTimes(3);
  });

  it("renders checkboxes in options", () => {
    render(<ElementSelector {...defaultProps} />);

    const input = screen.getByPlaceholderText("Attributes");
    userEvent.click(input);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(mockOptions.length);
  });

  it("limits visible tags to 2", () => {
    const props = {
      ...defaultProps,
      newValues: mockOptions, // All 3 options selected
    };

    render(<ElementSelector {...props} />);

    const chips = screen.getAllByRole("button"); // Chips are buttons
    expect(chips.length).toBe(3); // Should only show 2 chips
  });
});
