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

const selectorProps = {
  label: "Population Test",
  hidden: false,
  required: false,
  name: "population-test",
  options: selectOptions,
};

const mockOnChangeHandler = jest
  .fn((evt) => {
    return evt.target.value;
  })
  .mockName("onChangeMock");

describe("Measure Group Population Select Component", () => {
  test("Component loads when omitting default value and options.", () => {
    const omitProps = {
      label: "Population Test",
      hidden: false,
      required: false,
      name: "population-test",
    };
    const testProps = { ...omitProps, required: true };
    const { getByTestId } = render(
      <MeasureGroupPopulationSelect
        {...testProps}
        onChange={mockOnChangeHandler}
      />
    );
    const label = getByTestId("select-measure-group-population-label");
    expect(label.textContent).toEqual(expect.stringContaining("*"));
  });

  test("Required inputs should indicate if they are required", () => {
    const requiredSelectorProps = { ...selectorProps, required: true };
    const { getByTestId } = render(
      <MeasureGroupPopulationSelect
        {...requiredSelectorProps}
        onChange={mockOnChangeHandler}
        value=""
      />
    );

    const label = getByTestId("select-measure-group-population-label");
    expect(label.textContent).toEqual(expect.stringContaining("*"));
    expect(label.textContent).toEqual(
      expect.stringContaining(selectorProps.label)
    );
  });

  test("Optional inputs should not indicate if they are required", () => {
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

  test("Optional inputs should not indicate if they are required", () => {
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
  });

  test("Subtitle should render if provided", () => {
    const subTitle = "Field Subtitle";
    const { getByText } = render(
      <MeasureGroupPopulationSelect
        {...selectorProps}
        onChange={mockOnChangeHandler}
        subTitle={subTitle}
        value={""}
      />
    );

    expect(getByText(subTitle).textContent).toEqual(
      expect.stringContaining(subTitle)
    );
  });

  test("should display a select element with options if measure is editable for owner of measure", () => {
    const { getAllByTestId } = render(
      <div>
        <MeasureGroupPopulationSelect
          {...selectorProps}
          onChange={mockOnChangeHandler}
          value={""}
          canEdit={true}
        />
      </div>
    );

    const optionList = getAllByTestId("select-option-measure-group-population");

    expect(optionList).toHaveLength(11);
  });

  test("should not display a select element with options if measure is not editable", () => {
    render(
      <div>
        <MeasureGroupPopulationSelect
          {...selectorProps}
          onChange={mockOnChangeHandler}
          value={""}
          canEdit={false}
        />
      </div>
    );

    const optionList = screen.queryAllByText(
      "select-option-measure-group-population"
    );

    expect(optionList).toHaveLength(0);
  });

  test("should display the default option value if passed and measure is editable", () => {
    const defaultValue = selectOptions[0].name;
    const { getByText, getByTestId, getAllByTestId } = render(
      <div>
        <MeasureGroupPopulationSelect
          {...selectorProps}
          onChange={mockOnChangeHandler}
          value={defaultValue}
          canEdit={true}
        />
      </div>
    );

    let optionEl = screen.getByRole("option", {
      name: defaultValue,
    }) as HTMLOptionElement;
    expect(optionEl.selected).toBe(true);
  });

  test("should fire onChange update when value changes when measure is editable", async () => {
    const defaultValue = selectOptions[0].name;
    const updatedValue = selectOptions[1].name;

    const { getByRole, getByText, getByTestId, getAllByTestId } = render(
      <div>
        <MeasureGroupPopulationSelect
          {...selectorProps}
          onChange={mockOnChangeHandler}
          value={defaultValue}
          canEdit={true}
        />
      </div>
    );

    userEvent.selectOptions(getByTestId("select-measure-group-population"), [
      updatedValue,
    ]);
    expect(mockOnChangeHandler).toHaveReturnedWith(updatedValue);
  });

  test("should show error helper text when measure is editable", async () => {
    const defaultValue = selectOptions[0].name;

    render(
      <div>
        <MeasureGroupPopulationSelect
          {...selectorProps}
          onChange={mockOnChangeHandler}
          value={defaultValue}
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
