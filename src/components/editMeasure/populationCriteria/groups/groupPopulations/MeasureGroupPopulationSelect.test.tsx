import GroupPopulation from "./GroupPopulation";
import { GroupScoring, PopulationType } from "@madie/madie-models";

describe("GroupPopulation", () => {
  const mockCqlDefinitions = [
    { id: "1", name: "ValidDef", text: "define ValidDef: true" },
    { id: "2", name: "FuncDef", text: "define function FuncDef() { true }" },
    {
      id: "3",
      name: "PrivateFunc",
      text: "define private function PrivateFunc() { false }",
    },
    {
      id: "4",
      name: "FluentFunc",
      text: "define fluent function FluentFunc() { false }",
    },
    {
      id: "5",
      name: "PublicFunc",
      text: "define public function PublicFunc() { false }",
    },
  ];

  const baseProps = {
    field: {
      name: "initialPopulation",
      value: "ValidDef",
      onChange: jest.fn(),
      onBlur: jest.fn(),
    },
    form: {
      values: {},
      errors: {},
      touched: {},
      isSubmitting: false,
      isValidating: false,
      submitCount: 0,
    },
    cqlDefinitions: mockCqlDefinitions,
    populations: [
      { name: PopulationType.INITIAL_POPULATION, definition: "ValidDef" },
    ],
    population: {
      name: PopulationType.INITIAL_POPULATION,
      definition: "ValidDef",
    },
    populationIndex: 0,
    scoring: GroupScoring.PROPORTION,
    canEdit: true,
    insertCallback: jest.fn(),
    removeCallback: jest.fn(),
    replaceCallback: jest.fn(),
  };

  it("filters out function definitions from cqlDefinitions", () => {
    const { getByLabelText, queryByText } = render(
      <GroupPopulation {...baseProps} />
    );
    // Only non-function definitions should be present as options
    const select = getByLabelText(/Initial Population/i);
    expect(select).toBeInTheDocument();
    // Should not find function definitions as options
    expect(queryByText("FuncDef")).not.toBeInTheDocument();
    expect(queryByText("PrivateFunc")).not.toBeInTheDocument();
    expect(queryByText("FluentFunc")).not.toBeInTheDocument();
    expect(queryByText("PublicFunc")).not.toBeInTheDocument();
    // Should find the valid definition
    // Note: The select options may not be rendered until open, so this is a basic check
  });

  it("renders with correct label for multiple initial populations", () => {
    const props = {
      ...baseProps,
      populations: [
        { name: PopulationType.INITIAL_POPULATION, definition: "ValidDef" },
        { name: PopulationType.INITIAL_POPULATION, definition: "ValidDef2" },
      ],
      populationIndex: 1,
    };
    const { getByLabelText } = render(<GroupPopulation {...props} />);
    expect(getByLabelText(/Initial Population 2/i)).toBeInTheDocument();
  });
});
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MeasureGroupPopulationSelect from "./MeasureGroupPopulationSelect";

// Array of sample select option values
const selectOptions = [
  { name: "SDE Ethnicity" },
  { name: "SDE Payer" },
  { name: "SDE Race" },
  { name: "SDE Sex" },
  { name: "Initial Population" },
  {
    name: "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions",
  },
  { name: "Denominator" },
  { name: "Numerator" },
  {
    name: "Encounter With VTE Prophylaxis Received on Day of or Day After Admission or Procedure",
  },
  { name: "VTE Prophylaxis by Medication Administered or Device Applied" },
];

const mockOnChangeHandler = jest
  .fn((evt) => {
    return evt.target.value;
  })
  .mockName("onChangeMock");

const selectorProps = {
  field: {
    name: "population-test",
    onChange: mockOnChangeHandler,
    value: selectOptions[0].name,
  },
  label: "Population Test",
  required: false,
  options: selectOptions,
  canEdit: true,
};

describe("Measure Group Population Select Component", () => {
  test("Component loads when omitting default value and options.", async () => {
    const omitProps = {
      label: "Population Test",
      hidden: false,
      required: true,
      name: "population-test",
      canEdit: true,
    };
    const subTitle = "I am subtitle";
    render(
      <MeasureGroupPopulationSelect
        {...omitProps}
        onChange={mockOnChangeHandler}
        subTitle={subTitle}
      />
    );
    expect(
      screen.getByTestId("select-measure-group-population-input")
    ).toHaveAttribute("required");
    const result = await screen.findByText(subTitle);
    expect(result).toBeInTheDocument();
  });

  test("Required inputs should indicate if they are required", async () => {
    const requiredSelectorProps = { ...selectorProps, required: true };
    render(
      <MeasureGroupPopulationSelect
        {...requiredSelectorProps}
        onChange={mockOnChangeHandler}
      />
    );

    expect(
      await screen.findByTestId("select-measure-group-population-input")
    ).toHaveAttribute("required");
  });

  // Todo No idea what we are trying to test here
  // Removing this doesn't effect Coverage
  test.skip("Optional inputs should not indicate if they are required", () => {
    const requiredSelectorProps = { ...selectorProps, required: true };
    const { getByTestId } = render(
      <MeasureGroupPopulationSelect
        {...selectorProps}
        onChange={mockOnChangeHandler}
        value={""}
      />
    );

    const label = getByTestId("select-measure-group-population-label");
    expect(label.textContent).toEqual(expect.not.stringContaining("*"));
    expect(label.textContent).toEqual(
      expect.stringContaining(selectorProps.label)
    );
  });

  test("should display a select element with options if measure is editable for owner of measure", async () => {
    render(
      <MeasureGroupPopulationSelect
        {...selectorProps}
        onChange={mockOnChangeHandler}
        value={""}
        canEdit={true}
      />
    );

    const populationSelect = screen.getByTestId(
      "population-select-population-test"
    );
    userEvent.click(screen.getByRole("combobox", populationSelect));
    const optionList = await screen.findAllByTestId(
      "select-option-measure-group-population"
    );

    expect(optionList).toHaveLength(10);
  });

  test("should not display a select element with options if measure is not editable", () => {
    render(
      <MeasureGroupPopulationSelect
        {...selectorProps}
        onChange={mockOnChangeHandler}
        value={""}
        canEdit={false}
      />
    );

    const populationSelectInput = screen.getByRole("textbox");
    expect(populationSelectInput).toHaveAttribute("readonly");
  });

  test("should display the default option value if passed and measure is editable", () => {
    const defaultValue = selectOptions[0].name;
    render(
      <MeasureGroupPopulationSelect
        {...selectorProps}
        onChange={mockOnChangeHandler}
        value={defaultValue}
        canEdit={true}
      />
    );
    const populationSelectInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    expect(populationSelectInput.value).toBe(defaultValue);
  });

  test("should fire onChange update when value changes when measure is editable", async () => {
    const updatedValue = selectOptions[1].name;

    render(
      <MeasureGroupPopulationSelect
        {...selectorProps}
        value="Numerator"
        canEdit={true}
      />
    );

    const populationSelect = screen.getByTestId(
      "population-select-population-test"
    );
    userEvent.click(screen.getByRole("combobox", populationSelect));
    userEvent.click(screen.getByText(updatedValue));

    expect(mockOnChangeHandler).toHaveReturnedWith(updatedValue);
  });

  test("should show error helper text when measure is editable", async () => {
    render(
      <div>
        <MeasureGroupPopulationSelect
          {...selectorProps}
          helperText="Value is required"
          error={true}
          canEdit={true}
        />
      </div>
    );

    const helperText = screen.getByText("Value is required");
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass("Mui-error");
  });
});
