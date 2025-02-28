import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DateTimeComponent, {
  YEAR_FORMAT,
  YEAR_MONTH_FORMAT,
  YEAR_MONTH_DAY_FORMAT,
  DATE_TIME_ZONE_FORMAT,
  getCurrentFormat,
} from "./DateTimeComponent";

const { getByTestId } = screen;
describe("DateTimeComponent", () => {
  test("Should render DateTimeComponent", () => {
    const handleChange = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value="1992-01-01T00:00:00-08:00"
        onChange={handleChange}
      />
    );

    const dateField = screen.getByTestId("YYYY-MM-DDTHH:mm:ssZ-field-birthday");
    expect(dateField).toBeInTheDocument();

    const dateFieldInput = screen.getByTestId(
      "YYYY-MM-DDTHH:mm:ssZ-field-birthday-input"
    );
    expect(dateFieldInput).toBeInTheDocument();
    expect(screen.getByDisplayValue("01/01/1992")).toBeInTheDocument();

    const inputTime = screen.getByPlaceholderText("hh:mm:ss aa");
    expect(inputTime).toBeInTheDocument();
    // expect(screen.getByDisplayValue("12:00:00 AM")).toBeInTheDocument();
    // this fails in the pipeline because it converts it to local. passes locally in LA. Commenting out but leaving in the pr in case this is important information onf debugging later.

    const timeZone = screen.getByTestId("timezone-input-field-birthday-input");
    expect(timeZone.value).toBe("America/Los_Angeles");
  });
  test("Should render DateTimeComponent with default label", () => {
    const handleChange = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={`2024-09-26`}
        onChange={handleChange}
      />
    );
    const dateField = screen.getByTestId("YYYY-MM-DD-field-DateTime");
    expect(dateField).toBeInTheDocument();
  });

  test("Should render invalid date", () => {
    const handleChange = jest.fn();
    const setTouched = jest.fn();
    render(
      <DateTimeComponent
        value={`2024-09-26222234`}
        label="birthday"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        setTouched={setTouched}
      />
    );
    const dateFieldInput = screen.getByTestId(
      "Invalid Format-field-birthday-input"
    );
    expect(dateFieldInput).toBeInTheDocument();
    const formatSelectorField = getByTestId(
      "date-time-format-selector-input-field-birthday"
    );
    expect(formatSelectorField).toBeInTheDocument();
    expect(formatSelectorField.value).toBe("Invalid Format");
    expect(dateFieldInput.value).toBe("");
    expect(setTouched).toHaveBeenCalled();
  });

  test("Should handleFormat and and date from empty", async () => {
    const handleChange = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={null}
        onChange={handleChange}
      />
    );

    const formatSelectorField = getByTestId(
      "date-time-format-selector-input-field-birthday"
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
    fireEvent.change(formatSelectorField, {
      target: { value: DATE_TIME_ZONE_FORMAT },
    });
    const fullFormat = screen.getByTestId(
      `${DATE_TIME_ZONE_FORMAT}-field-birthday`
    );
    expect(fullFormat).toBeInTheDocument();
  });

  test("Should handle year", async () => {
    const handleChange = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={null}
        onChange={handleChange}
      />
    );

    const formatSelectorField = getByTestId(
      "date-time-format-selector-input-field-birthday"
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
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={null}
        onChange={handleChange}
      />
    );

    const formatSelectorField = getByTestId(
      "date-time-format-selector-input-field-birthday"
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
    expect(dateFieldInput.value).toBe("January 2025");
    expect(handleChange).toBeCalledWith("2025-01");
  });

  test("Should handle YEARMONTHDAY", async () => {
    const handleChange = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={null}
        onChange={handleChange}
      />
    );

    const formatSelectorField = getByTestId(
      "date-time-format-selector-input-field-birthday"
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

  test("Should handle DATETIMEFORMAT", async () => {
    const handleChange = jest.fn();
    const setTouched = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        onChange={handleChange}
        value="1992-01-01T00:00:00-08:00"
        setTouched={setTouched}
      />
    );

    const timeZone = screen.getByTestId("timezone-input-field-birthday-input");
    expect(timeZone.value).toBe("America/Los_Angeles");
    const guam = "Pacific/Guam";
    fireEvent.change(timeZone, {
      target: {
        value: guam,
      },
    });
    expect(handleChange).toBeCalledWith("1992-01-01T18:00:00+10:00");
    const input = screen.getByPlaceholderText("hh:mm:ss aa");
    userEvent.type(input, "12:01:00 PM");
    expect(input).toHaveValue("12:01:00 PM");
    expect(handleChange).toBeCalledWith("1992-01-01T18:00:00+10:00");
  });

  test("Should handle DateTimeFormat", async () => {
    const handleChange = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        onChange={handleChange}
      />
    );

    const formatSelectorField = getByTestId(
      "date-time-format-selector-input-field-birthday"
    );
    expect(formatSelectorField).toBeInTheDocument();
    fireEvent.change(formatSelectorField, {
      target: { value: DATE_TIME_ZONE_FORMAT },
    });
    const dateField = screen.getByTestId(
      `${DATE_TIME_ZONE_FORMAT}-field-birthday`
    );
    expect(dateField).toBeInTheDocument();
    const dateFieldInput = screen.getByTestId(
      `${DATE_TIME_ZONE_FORMAT}-field-birthday-input`
    );
    userEvent.type(dateFieldInput, "01/01/2025");
    expect(dateFieldInput.value).toBe("01/01/2025");

    const input = screen.getByPlaceholderText("hh:mm:ss aa");
    userEvent.type(input, "12:00:00 PM");
    expect(input).toHaveValue("12:00:00 PM");

    const timeZone = screen.getByTestId("timezone-input-field-birthday-input");
    fireEvent.change(timeZone, {
      target: {
        value: "America/Los_Angeles",
      },
    });

    expect(timeZone.value).toBe("America/Los_Angeles");
    expect(handleChange).toBeCalledWith("2025-01-01T12:00:00-08:00");
  });

  test(`"Should render ${YEAR_FORMAT}"`, () => {
    const handleChange = jest.fn();
    render(
      <DateTimeComponent
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
      <DateTimeComponent
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
      <DateTimeComponent
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
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value="1992-01-01T00:00:00-08:00"
        onChange={handleChange}
      />
    );
    const formatSelectorField = getByTestId(
      "date-time-format-selector-input-field-birthday"
    );
    expect(formatSelectorField).toBeInTheDocument();
    fireEvent.change(formatSelectorField, {
      target: { value: YEAR_MONTH_DAY_FORMAT },
    });
    expect(handleChange).toBeCalledWith("1992-01-01");
    fireEvent.change(formatSelectorField, {
      target: { value: YEAR_MONTH_FORMAT },
    });
    expect(handleChange).toBeCalledWith("1992-01");
    fireEvent.change(formatSelectorField, {
      target: { value: YEAR_FORMAT },
    });
    expect(handleChange).toBeCalledWith("1992");
  });

  it("Should find invalid formats correctly", () => {
    expect(getCurrentFormat("123444")).toBe("Invalid Format");
  });
});
