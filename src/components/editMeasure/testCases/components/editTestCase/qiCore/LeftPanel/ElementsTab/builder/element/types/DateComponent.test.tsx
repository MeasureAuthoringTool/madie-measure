import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DateComponent from "./DateComponent";
import userEvent from "@testing-library/user-event";
import {
  YEAR_FORMAT,
  YEAR_MONTH_FORMAT,
  YEAR_MONTH_DAY_FORMAT,
  getCurrentFormat,
} from "./DateTimeComponent";

const { getByTestId } = screen;
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
  test("Should render DateComponent with default label", () => {
    const handleChange = jest.fn();
    render(
      <DateComponent
        value={`2024-09-26`}
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
      />
    );

    const dateField = screen.getByTestId("YYYY-MM-DD-field-Date");
    expect(dateField).toBeInTheDocument();
  });

  test("Should render invalid date", () => {
    const handleChange = jest.fn();
    const setTouched = jest.fn();
    render(
      <DateComponent
        value={`2024-09-26222234`}
        label="birthday"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        setTouched={setTouched}
        structureDefinition={null}
      />
    );
    const dateFieldInput = screen.getByRole("textbox", { name: "Date Field" });
    expect(dateFieldInput).toBeInTheDocument();
    const formatSelectorField = getByTestId(
      "date-format-selector-input-field-birthday"
    );
    expect(formatSelectorField).toBeInTheDocument();
    expect(formatSelectorField.value).toBe("Invalid Format");
    expect(dateFieldInput.value).toBe("");
    expect(setTouched).toHaveBeenCalled();
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

  test("Should handleFormat and and date from empty", async () => {
    const handleChange = jest.fn();
    render(
      <DateComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={null}
        onChange={handleChange}
      />
    );

    const formatSelectorField = getByTestId(
      "date-format-selector-input-field-birthday"
    );
    expect(formatSelectorField).toBeInTheDocument();
    fireEvent.change(formatSelectorField, {
      target: { value: YEAR_FORMAT },
    });
    const dateField = screen.getByTestId(`${YEAR_FORMAT}-field-birthday`);
    expect(dateField).toBeInTheDocument();

    fireEvent.change(formatSelectorField, {
      target: { value: YEAR_MONTH_FORMAT },
    });

    const yearMonthField = screen.getByTestId(
      `${YEAR_MONTH_FORMAT}-field-birthday`
    );
    expect(yearMonthField).toBeInTheDocument();
    fireEvent.change(formatSelectorField, {
      target: { value: YEAR_MONTH_DAY_FORMAT },
    });

    const yearMonthDayFORMAT = screen.getByTestId(
      `${YEAR_MONTH_DAY_FORMAT}-field-birthday`
    );
    expect(yearMonthDayFORMAT).toBeInTheDocument();
  });

  test("Should handle year", async () => {
    const handleChange = jest.fn();
    render(
      <DateComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={null}
        onChange={handleChange}
      />
    );

    const formatSelectorField = getByTestId(
      "date-format-selector-input-field-birthday"
    );
    expect(formatSelectorField).toBeInTheDocument();
    fireEvent.change(formatSelectorField, {
      target: { value: YEAR_FORMAT },
    });
    const dateField = screen.getByTestId(`${YEAR_FORMAT}-field-birthday`);
    expect(dateField).toBeInTheDocument();
    const dateFieldInput = screen.getByTestId(
      `${YEAR_FORMAT}-field-birthday-input`
    );
    userEvent.type(dateFieldInput, "2022");
    expect(dateFieldInput.value).toBe("2022");
    expect(handleChange).toBeCalledWith("2022");
  });

  test("Should handle YEARMONTH", async () => {
    const handleChange = jest.fn();
    render(
      <DateComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={null}
        onChange={handleChange}
      />
    );

    const formatSelectorField = getByTestId(
      "date-format-selector-input-field-birthday"
    );
    expect(formatSelectorField).toBeInTheDocument();
    fireEvent.change(formatSelectorField, {
      target: { value: YEAR_MONTH_FORMAT },
    });
    const dateField = screen.getByTestId(`${YEAR_MONTH_FORMAT}-field-birthday`);
    expect(dateField).toBeInTheDocument();
    const dateFieldInput = screen.getByTestId(
      `${YEAR_MONTH_FORMAT}-field-birthday-input`
    );
    userEvent.type(dateFieldInput, "January-2025");
    expect(dateFieldInput.value).toBe("01-2025");
    expect(handleChange).toBeCalledWith("2025-01");
  });

  test("Should handle YEARMONTHDAY", async () => {
    const handleChange = jest.fn();
    render(
      <DateComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={null}
        onChange={handleChange}
      />
    );

    const formatSelectorField = getByTestId(
      "date-format-selector-input-field-birthday"
    );
    expect(formatSelectorField).toBeInTheDocument();
    fireEvent.change(formatSelectorField, {
      target: { value: YEAR_MONTH_DAY_FORMAT },
    });
    const dateField = screen.getByTestId(
      `${YEAR_MONTH_DAY_FORMAT}-field-birthday`
    );
    expect(dateField).toBeInTheDocument();
    const dateFieldInput = screen.getByTestId(
      `${YEAR_MONTH_DAY_FORMAT}-field-birthday-input`
    );
    userEvent.type(dateFieldInput, "01/01/2025");
    expect(dateFieldInput.value).toBe("01/01/2025");
    expect(handleChange).toBeCalledWith("2025-01-01");
  });

  test(`"Should render ${YEAR_FORMAT}"`, () => {
    const handleChange = jest.fn();
    render(
      <DateComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={"1992"}
        onChange={handleChange}
      />
    );
    const dateField = screen.getByTestId(`${YEAR_FORMAT}-field-birthday`);
    expect(dateField).toBeInTheDocument();
    const dateFieldInput = screen.getByTestId(
      `${YEAR_FORMAT}-field-birthday-input`
    );
    userEvent.type(dateFieldInput, "1992");
    expect(handleChange).toBeCalledWith("1992");
  });

  test(`"Should render ${YEAR_MONTH_FORMAT}"`, () => {
    const handleChange = jest.fn();
    render(
      <DateComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={"1992-01"}
        onChange={handleChange}
      />
    );
    const dateField = screen.getByTestId(`${YEAR_MONTH_FORMAT}-field-birthday`);
    expect(dateField).toBeInTheDocument();
    const dateFieldInput = screen.getByTestId(
      `${YEAR_MONTH_FORMAT}-field-birthday-input`
    );
    userEvent.type(dateFieldInput, "January 1992");
    expect(handleChange).toBeCalledWith("1992-01");
  });

  test(`"Should render ${YEAR_MONTH_DAY_FORMAT}"`, () => {
    const handleChange = jest.fn();
    render(
      <DateComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={"2019-01-01"}
        onChange={handleChange}
      />
    );
    const dateField = screen.getByTestId(
      `${YEAR_MONTH_DAY_FORMAT}-field-birthday`
    );
    expect(dateField).toBeInTheDocument();
    const dateFieldInput = screen.getByTestId(
      `${YEAR_MONTH_DAY_FORMAT}-field-birthday-input`
    );
    userEvent.type(dateFieldInput, "01-01-1992");
    expect(handleChange).toBeCalledWith("1992-01-01");
  });

  test("Should automatically update dateString when format decreases in complexity.", () => {
    const handleChange = jest.fn();
    render(
      <DateComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value="1992-01-01"
        onChange={handleChange}
        addTitle={"Birthday"}
        showAddAttributeButton={true}
      />
    );
    expect(screen.getByText("Add Birthday")).toBeInTheDocument();

    const formatSelectorField = getByTestId(
      "date-format-selector-input-field-birthday"
    );
    expect(formatSelectorField).toBeInTheDocument();
    fireEvent.change(formatSelectorField, {
      target: { value: YEAR_MONTH_FORMAT },
    });
    expect(handleChange).toBeCalledWith("1992-01");
    fireEvent.change(formatSelectorField, {
      target: { value: YEAR_FORMAT },
    });
    expect(handleChange).toBeCalledWith("1992");
  });
  it("Should get invalid format correctly", () => {
    expect(getCurrentFormat("123123")).toBe("Invalid Format");
  });
});
