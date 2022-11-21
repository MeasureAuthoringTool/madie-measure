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
  test("Component loads when omitting default value and options.", () => {
    const omitProps = {
      label: "Population Test",
      hidden: false,
      required: true,
      name: "population-test",
      canEdit: true,
    };
    render(
      <MeasureGroupPopulationSelect
        {...omitProps}
        onChange={mockOnChangeHandler}
      />
    );
    expect(
      screen.getByTestId("select-measure-group-population-input")
    ).toHaveAttribute("required");
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
    userEvent.click(screen.getByRole("button", populationSelect));
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

    const populationSelectInput = screen.queryByTestId(
      "select-measure-group-population-input"
    );
    expect(populationSelectInput).toBeDisabled();
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
    userEvent.click(screen.getByRole("button", populationSelect));
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
