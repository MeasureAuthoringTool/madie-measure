import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ElementSelector, { getOptionLabel } from "./ElementSelector";
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

    const input = screen.getByPlaceholderText("Attributes");
    userEvent.click(input);

    expect(screen.getByText("gender")).toBeInTheDocument();
    expect(screen.getByText("birthDate")).toBeInTheDocument();
    expect(screen.getByText("extension:race")).toBeInTheDocument();
  });

  it("handles selection of new options", () => {
    render(<ElementSelector {...defaultProps} />);

    const input = screen.getByPlaceholderText("Attributes");
    userEvent.click(input);

    const genderOption = screen.getByText("gender");
    userEvent.click(genderOption);

    expect(defaultProps.onChange).toHaveBeenCalled();
  });

  it("disables already selected options", () => {
    const props = {
      ...defaultProps,
      value: [mockOptions[0]],
    };

    render(<ElementSelector {...props} />);

    const input = screen.getByPlaceholderText("Attributes");
    userEvent.click(input);

    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-disabled", "true");
  });

  it("renders chips for selected values", () => {
    const props = {
      ...defaultProps,
      newValues: [mockOptions[0]],
    };

    render(<ElementSelector {...props} />);

    const chip = screen.getAllByText("gender")[0];
    expect(chip).toBeInTheDocument();
  });

  it("disables delete for chips that are in value prop", () => {
    const props = {
      ...defaultProps,
      value: [mockOptions[0]],
      newValues: [mockOptions[0]],
    };

    render(<ElementSelector {...props} />);

    const chip = screen.getAllByText("gender")[0].closest(".MuiChip-root");
    expect(chip).toHaveClass("Mui-disabled");
  });

  it("allows multiple selections", () => {
    render(<ElementSelector {...defaultProps} />);

    const input = screen.getByPlaceholderText("Attributes");
    userEvent.click(input);

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

  it("limits visible tags to 3", () => {
    const props = {
      ...defaultProps,
      newValues: mockOptions,
    };

    render(<ElementSelector {...props} />);

    const chips = screen.getAllByRole("button");
    expect(chips.length).toBe(3);
  });

  it("prevents backspace from deleting disabled chips", async () => {
    const props = {
      ...defaultProps,
      value: [mockOptions[0]], // gender is disabled
      newValues: [mockOptions[0], mockOptions[1]], // has both gender and birthDate
    };

    render(<ElementSelector {...props} />);

    // Verify both chips are present initially
    expect(
      screen.getByTestId("disabled-element-selector-gender-chip")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("element-selector-birthDate-chip")
    ).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Attributes");
    await userEvent.type(input, "{Backspace}");
    await userEvent.type(input, "{Backspace}");
    await userEvent.type(input, "{Backspace}");

    // Verify disabled chip still exists and hasn't been removed
    expect(
      screen.getByTestId("disabled-element-selector-gender-chip")
    ).toBeInTheDocument();
  });

  it("getOptionLabel returns the right label when ElementDefinition has slice name", () => {
    const label = getOptionLabel(mockOptions[2], "Patient");
    expect(label).toBe("extension:race");
  });

  it("getOptionLabel returns the right label when path has [x]", () => {
    const eleDefinition = {
      path: "Patient.multipleBirth[x]",
      base: {
        path: "Patient.multipleBirth[x]",
        min: 0,
        max: "1",
      },
      type: [
        {
          code: "integer",
        },
      ],
    };
    const label = getOptionLabel(eleDefinition, "Patient");
    expect(label).toBe("multipleBirthInteger");
  });
});
