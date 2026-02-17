import * as React from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ElementSelector, {
  getOptionLabel,
  getChoiceBaseLabel,
} from "./ElementSelector";
import { ElementDefinition } from "fhir/r4";

const mockOptions: ElementDefinition[] = [
  {
    id: "Patient.gender",
    path: "Patient.gender",
    min: 0,
    max: "1",
  },
  {
    id: "Patient.birthDate",
    path: "Patient.birthDate",
    min: 0,
    max: "1",
  },
  {
    id: "Patient.extension",
    path: "Patient.extension",
    sliceName: "race",
    min: 0,
    max: "1",
  },
  {
    id: "Patient.deceased[x]",
    path: "Patient.deceased[x]",
    min: 0,
    max: "1",
    type: [{ code: "boolean" }],
  },
  {
    id: "Patient.deceased[x]",
    path: "Patient.deceased[x]",
    min: 0,
    max: "1",
    type: [{ code: "dateTime" }],
  },
];

describe("ElementSelector", () => {
  const defaultProps = {
    basePath: "Patient",
    options: mockOptions,
    selectedElements: [],
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
      selectedElements: [mockOptions[0], mockOptions[3]],
    };

    render(<ElementSelector {...props} />);

    const input = screen.getByPlaceholderText("Attributes");
    userEvent.click(input);

    // Find the gender option by text and check if it's disabled
    const genderOption = screen.getAllByText("gender")[1].closest("li");
    expect(genderOption).toHaveAttribute("aria-disabled", "true");

    // Find the deceasedBoolean option from deceased[x] choice type and check if it's disabled
    const deceasedOption = screen
      .getAllByText("deceasedBoolean")[1]
      .closest("li");
    expect(deceasedOption).toHaveAttribute("aria-disabled", "true");
  });

  it("renders chips for selected values", () => {
    const props = {
      ...defaultProps,
      selectedElements: [mockOptions[0]],
    };

    render(<ElementSelector {...props} />);

    const chip = screen.getAllByText("gender")[0];
    expect(chip).toBeInTheDocument();
  });

  it("disables delete for chips that are in value prop", () => {
    const props = {
      ...defaultProps,
      selectedElements: [mockOptions[0]],
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
      selectedElements: mockOptions,
    };

    render(<ElementSelector {...props} />);

    // Grab all chip elements whose testid ends with "-chip"
    const chips = screen.getAllByTestId(/-chip$/i);
    expect(chips.length).toBe(2);
  });

  it("prevents backspace from deleting disabled chips", async () => {
    const props = {
      ...defaultProps,
      selectedElements: [mockOptions[0], mockOptions[1]], // has both gender and birthDate
    };

    render(<ElementSelector {...props} />);

    // Verify both chips are present initially
    expect(
      screen.getByTestId("disabled-element-selector-gender-chip")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("disabled-element-selector-birthDate-chip")
    ).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Attributes");
    userEvent.type(input, "{Backspace}");
    userEvent.type(input, "{Backspace}");
    userEvent.type(input, "{Backspace}");

    // Verify disabled chip still exists and hasn't been removed
    expect(
      screen.getByTestId("disabled-element-selector-gender-chip")
    ).toBeInTheDocument();
  });

  it("getOptionLabel returns the right label when ElementDefinition has slice name", () => {
    const label = getOptionLabel(mockOptions[2], "Patient");
    expect(label).toBe("extension:race");
  });

  it("should return label when sliceName is already included in label", () => {
    const basePath = "Observation";
    const option = {
      path: "Observation.extension:race",
      sliceName: "race",
      type: [{ code: "string" }],
    };

    expect(getOptionLabel(option, basePath)).toBe("extension:race");
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

  it("disables related choice types using FHIR datatype matching", () => {
    const choiceOptions: ElementDefinition[] = [
      {
        id: "Patient.deceased[x]",
        path: "Patient.deceased[x]",
        min: 0,
        max: "1",
        type: [{ code: "boolean" }],
      },
      {
        id: "Patient.deceased[x]",
        path: "Patient.deceased[x]",
        min: 0,
        max: "1",
        type: [{ code: "dateTime" }],
      },
      {
        id: "Patient.multipleBirth[x]",
        path: "Patient.multipleBirth[x]",
        min: 0,
        max: "1",
        type: [{ code: "boolean" }],
      },
      {
        id: "Patient.multipleBirth[x]",
        path: "Patient.multipleBirth[x]",
        min: 0,
        max: "1",
        type: [{ code: "integer" }],
      },
      {
        path: "Patient.unrelatedpath",
        min: 1,
        max: "1",
      },
    ];

    const props = {
      ...defaultProps,
      options: choiceOptions,
      selectedElements: [choiceOptions[0]],
    };

    render(<ElementSelector {...props} />);

    const input = screen.getByPlaceholderText("Attributes");
    userEvent.click(input);

    const deceasedDateTimeOption = screen.getByText("deceasedDateTime");
    expect(deceasedDateTimeOption.closest("li")).toHaveAttribute(
      "aria-disabled",
      "true"
    );

    const multipleBirthBooleanOption = screen.getByText("multipleBirthBoolean");
    expect(multipleBirthBooleanOption.closest("li")).not.toHaveAttribute(
      "aria-disabled",
      "true"
    );

    const unrelatedPathOption = screen.getByText("unrelatedpath");
    expect(unrelatedPathOption.closest("li")).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    cleanup();

    const propsWithMultipleBirth = {
      ...defaultProps,
      options: choiceOptions,
      selectedElements: [choiceOptions[2]],
    };

    render(<ElementSelector {...propsWithMultipleBirth} />);

    const inputMultipleBirth = screen.getByPlaceholderText("Attributes");
    userEvent.click(inputMultipleBirth);

    const multipleBirthIntegerOption = screen.getByText("multipleBirthInteger");
    expect(multipleBirthIntegerOption.closest("li")).toHaveAttribute(
      "aria-disabled",
      "true"
    );

    const deceasedBooleanOption = screen.getByText("deceasedBoolean");
    expect(deceasedBooleanOption.closest("li")).not.toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });

  it("correctly extracts choice base types from datatype ending elements", () => {
    const choiceOptions: ElementDefinition[] = [
      {
        id: "Patient.deceased[x]",
        path: "Patient.deceased[x]",
        min: 0,
        max: "1",
        type: [{ code: "boolean" }],
      },
      {
        id: "Patient.deceased[x]",
        path: "Patient.deceased[x]",
        min: 0,
        max: "1",
        type: [{ code: "dateTime" }],
      },
    ];

    const props = {
      ...defaultProps,
      options: choiceOptions,
      selectedElements: [choiceOptions[0]],
    };

    render(<ElementSelector {...props} />);
    userEvent.click(screen.getByPlaceholderText("Attributes"));

    // Get the first option i.e. deceasedBoolean which is selected choice
    const deceasedBoolean = screen
      .getAllByText("deceasedBoolean")[1]
      .closest("li");

    expect(deceasedBoolean).toHaveAttribute("aria-selected", "true");
    expect(deceasedBoolean).toHaveAttribute("aria-disabled", "true");

    // Get the label of the related (second) option i.e. deceasedDateTime
    const deceasedDateTime = screen.getByText("deceasedDateTime").closest("li");

    expect(deceasedDateTime).toHaveAttribute("aria-selected", "false");
    expect(deceasedDateTime).toHaveAttribute("aria-disabled", "true");
  });
});

describe("getChoiceBaseLabel", () => {
  const basePath = "Observation";

  it("should return label without [x] when label ends with [x]", () => {
    const option = { id: "Observation.value[x]" } as ElementDefinition;
    expect(getChoiceBaseLabel(option, basePath)).toBe("value");
  });

  it("should return null if label cannot be determined", () => {
    const option = { id: "Observation" } as ElementDefinition; // same as basePath
    expect(getChoiceBaseLabel(option, basePath)).toBeNull();
  });

  it("should handle unknown datatype by splitting camelCase", () => {
    const option = { id: "Observation.valueCustomType" } as ElementDefinition;
    expect(getChoiceBaseLabel(option, basePath)).toBe(null);
  });

  it("should return null if no camelCase boundary and no datatype match", () => {
    const option = { id: "Observation.valuecustomtype" } as ElementDefinition;
    expect(getChoiceBaseLabel(option, basePath)).toBeNull();
  });

  it("should handle label shorter than datatype (edge case)", () => {
    const option = { id: "Observation.Boolean" } as ElementDefinition; // label = 'Boolean'
    expect(getChoiceBaseLabel(option, basePath)).toBeNull();
  });
});
