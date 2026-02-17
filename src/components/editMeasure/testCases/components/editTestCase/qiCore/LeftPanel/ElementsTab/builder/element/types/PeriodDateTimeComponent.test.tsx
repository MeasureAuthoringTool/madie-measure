import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PeriodDateTimeComponent, {
  YEAR_FORMAT,
  YEAR_MONTH_FORMAT,
  YEAR_MONTH_DAY_FORMAT,
  DATE_TIME_ZONE_FORMAT,
  getCurrentFormat,
} from "./PeriodDateTimeComponent";
import dayjs from "dayjs";

describe("PeriodDateTimeComponent", () => {
  test("renders with default label and both date fields", () => {
    const handleChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{ start: "2024-09-26", end: "2024-10-01" }}
        onChange={handleChange}
      />
    );
    expect(screen.getByTestId("Period-label")).toBeInTheDocument();
    expect(screen.getByText("Period")).toBeInTheDocument();
    expect(
      screen.getByTestId("start-YYYY-MM-DD-field-Period")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("end-YYYY-MM-DD-field-Period")
    ).toBeInTheDocument();
  });

  test("switches and renders all date formats from empty value", () => {
    const handleChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        label="period"
        fieldRequired={false}
        value={{}}
        onChange={handleChange}
      />
    );

    const selector = screen.getByTestId(
      "date-time-format-selector-input-field-period"
    );

    for (const format of [
      YEAR_FORMAT,
      YEAR_MONTH_FORMAT,
      YEAR_MONTH_DAY_FORMAT,
      DATE_TIME_ZONE_FORMAT,
    ]) {
      fireEvent.change(selector, { target: { value: format } });
      expect(
        screen.getByTestId(`start-${format}-field-period`)
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`end-${format}-field-period`)
      ).toBeInTheDocument();
    }
  });

  test("handles input in YEAR format for start and end", async () => {
    const handleChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        label="period"
        fieldRequired={false}
        value={{}}
        onChange={handleChange}
      />
    );

    fireEvent.change(
      screen.getByTestId("date-time-format-selector-input-field-period"),
      {
        target: { value: YEAR_FORMAT },
      }
    );

    const startInput = screen.getByTestId(
      `start-${YEAR_FORMAT}-field-period-input`
    );
    const endInput = screen.getByTestId(
      `end-${YEAR_FORMAT}-field-period-input`
    );

    userEvent.type(startInput, "2022");
    userEvent.type(endInput, "2023");
    expect(handleChange).toHaveBeenCalledWith({ start: "2022" });
    expect(handleChange).toHaveBeenCalledWith({ start: "2022", end: "2023" });
  });

  test("handles input in DATE_TIME_ZONE_FORMAT for start and end date and time", async () => {
    const handleChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        label="period"
        fieldRequired={false}
        value={{}}
        onChange={handleChange}
      />
    );

    fireEvent.change(
      screen.getByTestId("date-time-format-selector-input-field-period"),
      {
        target: { value: DATE_TIME_ZONE_FORMAT },
      }
    );

    const startInput = screen.getByTestId(
      `start-${DATE_TIME_ZONE_FORMAT}-field-period-input`
    );
    const endInput = screen.getByTestId(
      `end-${DATE_TIME_ZONE_FORMAT}-field-period-input`
    );
    fireEvent.change(startInput, { target: { value: "2024-09-26" } });
    fireEvent.change(endInput, { target: { value: "2024-09-27" } });

    const startTime = screen.getByTestId("start-time");
    const endTime = screen.getByTestId("end-time");
    expect(startTime).toBeInTheDocument();
    expect(endTime).toBeInTheDocument();
    const startTimeDiv = screen.getByTestId(
      "start-YYYY-MM-DDTHH:mm:ssZ-field-period"
    );
    const endTimeDiv = screen.getByTestId(
      "end-YYYY-MM-DDTHH:mm:ssZ-field-period"
    );
    const startTimeInput = startTimeDiv.querySelector(
      "input"
    ) as HTMLInputElement;
    const endTimeInput = endTimeDiv.querySelector("input") as HTMLInputElement;
    fireEvent.change(startTimeInput, { target: { value: "12:30:45" } });
    fireEvent.change(endTimeInput, { target: { value: "14:15:00" } });

    fireEvent.change(startTimeInput, { target: { value: "12:45:45" } });

    expect(handleChange).toHaveBeenCalled();
  });

  it("Handles valid pasted date and updates start date", () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{ end: "2024-10-01" }}
        onChange={onChange}
        label="DateTime"
      />
    );

    const pasteTarget = screen.getByTestId("start-YYYY-MM-DD-field-DateTime");
    fireEvent.paste(pasteTarget, {
      clipboardData: {
        getData: () => "2023-10-15T12:00:00Z",
      },
    });

    const expectedDate = dayjs.utc("2023-10-15").hour(0).minute(0).second(0);
    expect(onChange).toHaveBeenCalledWith({
      start: expectedDate.format("YYYY-MM-DD"),
      end: "2024-10-01",
    });
  });

  it("Handles valid pasted date and updates end date", () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{ start: "2023-10-15" }}
        onChange={onChange}
        label="DateTime"
      />
    );

    const pasteTarget = screen.getByTestId("end-YYYY-MM-DD-field-DateTime");
    fireEvent.paste(pasteTarget, {
      clipboardData: {
        getData: () => "2024-10-01T12:00:00Z",
      },
    });

    const expectedDate = dayjs.utc("2024-10-01").hour(0).minute(0).second(0);
    expect(onChange).toHaveBeenCalledWith({
      start: "2023-10-15",
      end: expectedDate.format("YYYY-MM-DD"),
    });
  });

  it("Does not trigger onChange when invalid start date is pasted", () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{ end: "2024-10-01" }}
        onChange={onChange}
        label="DateTime"
      />
    );

    const pasteTarget = screen.getByTestId("start-YYYY-MM-DD-field-DateTime");
    fireEvent.paste(pasteTarget, {
      clipboardData: {
        getData: () => "invalid-date",
      },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("Does not trigger onChange when invalid end date is pasted", () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{ end: "2024-10-01" }}
        onChange={onChange}
        label="DateTime"
      />
    );

    const pasteTarget = screen.getByTestId("end-YYYY-MM-DD-field-DateTime");
    fireEvent.paste(pasteTarget, {
      clipboardData: {
        getData: () => "invalid-date",
      },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not trigger onChange when user types an invalid start date and blurs", async () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{ end: "2024-10-01" }}
        onChange={onChange}
        label="DateTime"
      />
    );

    const startInputWrapper = screen.getByTestId(
      "start-YYYY-MM-DD-field-DateTime"
    );
    const startInput = startInputWrapper.querySelector("input");
    fireEvent.change(startInput, { target: { value: "invalid-date" } });
    fireEvent.blur(startInput);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onChange with undefined when start date is cleared and no end date exists", async () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{ start: "2024-10-01" }}
        onChange={onChange}
        label="DateTime"
      />
    );

    const startInputWrapper = screen.getByTestId(
      "start-YYYY-MM-DD-field-DateTime"
    );
    const startInput = startInputWrapper.querySelector("input");
    fireEvent.change(startInput, { target: { value: "" } });

    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it("calls onChange with undefined when end date is cleared with invalid input and no start date exists", async () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{ end: "2024-10-01" }}
        onChange={onChange}
        label="DateTime"
      />
    );

    const endInputWrapper = screen.getByTestId("end-YYYY-MM-DD-field-DateTime");
    const endInput = endInputWrapper.querySelector("input");
    fireEvent.change(endInput, { target: { value: "invalid-date" } });
    fireEvent.blur(endInput);
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("calls onChange with undefined when end date is cleared with invalid input and no start exists", async () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{ end: "2024-10-01" }}
        onChange={onChange}
        label="DateTime"
      />
    );

    const endInputWrapper = screen.getByTestId("end-YYYY-MM-DD-field-DateTime");
    const endInput = endInputWrapper.querySelector("input");
    fireEvent.change(endInput, { target: { value: "invalid-date" } });
    fireEvent.blur(endInput);
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it("test handleTimeChange", async () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{
          start: "2024-09-26T12:00:00+00:00",
          end: "2024-09-27T14:00:00+00:00",
        }}
        onChange={onChange}
        label="DateTime"
      />
    );

    const startInput = screen.getByDisplayValue("12:00:00 PM");
    expect(startInput.value).toBe("12:00:00 PM");
    fireEvent.change(startInput, { target: { value: "01:30:00 PM" } });
    expect(startInput.value).toBe("01:30:00 PM");

    expect(onChange).toHaveBeenCalledWith({
      start: "2024-09-26T13:30:00+00:00",
      end: "2024-09-27T14:00:00+00:00",
    });

    const endInput = screen.getByDisplayValue("02:00:00 PM");
    expect(endInput.value).toBe("02:00:00 PM");
    fireEvent.change(endInput, { target: { value: "03:00:00 PM" } });
    expect(endInput.value).toBe("03:00:00 PM");

    expect(onChange).toHaveBeenCalledWith({
      start: "2024-09-26T13:30:00+00:00",
      end: "2024-09-27T15:00:00+00:00",
    });
  });

  it("test start date onChange with DATE_TIME_ZONE_FORMAT", async () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{
          start: "2017-09-26T12:00:00+00:00",
          end: "2017-09-27T14:00:00+00:00",
        }}
        onChange={onChange}
        label="Period"
      />
    );

    const startInput = screen.getByDisplayValue("09-26-2017");
    fireEvent.change(startInput, { target: { value: "09-26-2024" } });
    expect(onChange).toHaveBeenCalledWith({
      start: "2024-09-26T12:00:00+00:00",
      end: "2017-09-27T14:00:00+00:00",
    });

    const endInput = screen.getByDisplayValue("09-27-2017");
    fireEvent.change(endInput, { target: { value: "09-27-2024" } });
    expect(onChange).toHaveBeenCalledWith({
      start: "2024-09-26T12:00:00+00:00",
      end: "2024-09-27T14:00:00+00:00",
    });
  });
});

describe("PeriodDateTimeComponent useEffect", () => {
  test("sets format based on start date when user has not selected format", async () => {
    render(
      <PeriodDateTimeComponent
        canEdit
        value={{ start: "2024-09-26" }}
        onChange={jest.fn()}
        fieldRequired={false}
      />
    );

    const startInput = await screen.findByTestId(
      "start-YYYY-MM-DD-field-Period"
    );
    expect(startInput).toBeInTheDocument();
  });

  test("sets format based on end date when start is undefined", async () => {
    render(
      <PeriodDateTimeComponent
        canEdit
        value={{ end: "2024-12-31" }}
        onChange={jest.fn()}
        fieldRequired={false}
      />
    );

    const endInput = await screen.findByTestId("end-YYYY-MM-DD-field-Period");
    expect(endInput).toBeInTheDocument();
  });

  test("handles invalid start and end dates", async () => {
    render(
      <PeriodDateTimeComponent
        canEdit
        value={{ start: "invalid", end: "also-invalid" }}
        onChange={jest.fn()}
        fieldRequired={false}
      />
    );

    const startInput = await screen.findByTestId("start-year-field-Period");
    const endInput = await screen.findByTestId("end-year-field-Period");

    expect(startInput).toBeInTheDocument();
    expect(endInput).toBeInTheDocument();
  });

  test("sets startTime and endTime in useEffect for DATE_TIME_ZONE_FORMAT", async () => {
    render(
      <PeriodDateTimeComponent
        canEdit
        label="period"
        value={{
          start: "2024-09-26T12:00:00+00:00",
          end: "2024-09-27T14:00:00+00:00",
        }}
        onChange={jest.fn()}
        fieldRequired={false}
      />
    );

    const formatSelector = await screen.findByTestId(
      "date-time-format-selector-input-field-period"
    );
    expect((formatSelector as HTMLSelectElement).value).toBe(
      "YYYY-MM-DDTHH:mm:ssZ"
    );

    // Grab the TimeField inputs by placeholder
    const timeInputs = screen.getAllByPlaceholderText("hh:mm:ss aa");
    const startTimeInput = timeInputs[0];
    const endTimeInput = timeInputs[1];

    // Assert the merged times are correctly displayed
    expect(startTimeInput).toBeInTheDocument();
    expect(endTimeInput).toBeInTheDocument();
    expect((startTimeInput as HTMLInputElement).value).toBe("12:00:00 PM");
    expect((endTimeInput as HTMLInputElement).value).toBe("02:00:00 PM");
  });

  test("does not override format when user has manually selected a format", async () => {
    const { rerender } = render(
      <PeriodDateTimeComponent
        canEdit
        value={{ start: "2024-09-26" }}
        onChange={jest.fn()}
        fieldRequired={false}
      />
    );

    const selector = await screen.findByTestId(
      "date-time-format-selector-input-field-Period"
    );

    // Simulate user manually selecting "YYYY"
    fireEvent.change(selector, { target: { value: "YYYY" } });

    // Rerender with new value to simulate prop change
    rerender(
      <PeriodDateTimeComponent
        canEdit
        value={{ start: "2025-01-01" }}
        onChange={jest.fn()}
        fieldRequired={false}
      />
    );

    expect((selector as HTMLSelectElement).value).toBe("YYYY");
  });

  test("resets userSelectedFormat to false after effect runs", async () => {
    render(
      <PeriodDateTimeComponent
        canEdit
        value={{ start: "2024-09-26" }}
        onChange={jest.fn()}
        fieldRequired={false}
      />
    );

    const selector = await screen.findByTestId(
      "date-time-format-selector-input-field-Period"
    );
    expect((selector as HTMLSelectElement).value).toBe("YYYY-MM-DD");
  });

  test("renders in read-only mode when canEdit is false", async () => {
    render(
      <PeriodDateTimeComponent
        canEdit={false}
        fieldRequired={false}
        value={{
          start: "2024-09-26T12:00:00+00:00",
          end: "2024-09-27T14:00:00+00:00",
        }}
        onChange={jest.fn()}
      />
    );

    // Verify that the date format selector is read-only
    const formatSelector = await screen.findByTestId(
      `date-time-format-selector-field-Period`
    );
    expect(formatSelector).toHaveAttribute("readonly");

    // Verify that the start and end date fields are read-only
    const startDateField = await screen.findByTestId(
      "start-YYYY-MM-DDTHH:mm:ssZ-field-Period"
    );
    const endDateField = await screen.findByTestId(
      "end-YYYY-MM-DDTHH:mm:ssZ-field-Period"
    );
    expect(startDateField).toHaveAttribute("readonly");
    expect(endDateField).toHaveAttribute("readonly");

    // Verify that time fields are also read-only
    const startTimeInput = await screen.findByTestId("start-time-field-Period");
    const endTimeInput = await screen.findByTestId("end-time-field-Period");
    expect(startTimeInput).toHaveAttribute("readonly");
    expect(endTimeInput).toHaveAttribute("readonly");
  });
});

describe("getCurrentFormat", () => {
  test("returns correct format for YEAR", () => {
    expect(getCurrentFormat("2024")).toBe(YEAR_FORMAT);
  });

  test("returns correct format for YEAR_MONTH", () => {
    expect(getCurrentFormat("2024-09")).toBe(YEAR_MONTH_FORMAT);
  });

  test("returns correct format for YEAR_MONTH_DAY", () => {
    expect(getCurrentFormat("2024-09-26")).toBe(YEAR_MONTH_DAY_FORMAT);
  });

  test("returns correct format for DATE_TIME_ZONE", () => {
    expect(getCurrentFormat("2024-09-26T12:00:00Z")).toBe(
      DATE_TIME_ZONE_FORMAT
    );
  });

  test("returns Invalid Format for unrecognized format", () => {
    expect(getCurrentFormat("invalid-date")).toBe("Invalid Format");
  });
});

describe("PeriodDateTimeComponent - Conditional JSON Output", () => {
  test("only includes start in JSON when only start is pasted", () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{}}
        onChange={onChange}
        label="DateTime"
      />
    );

    const pasteTarget = screen.getByTestId("start-YYYY-MM-DD-field-DateTime");
    fireEvent.paste(pasteTarget, {
      clipboardData: { getData: () => "2026-02-04T00:00:00Z" },
    });

    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-02-04" });
  });

  test("only includes end in JSON when only end is pasted", () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{}}
        onChange={onChange}
        label="DateTime"
      />
    );

    const pasteTarget = screen.getByTestId("end-YYYY-MM-DD-field-DateTime");
    fireEvent.paste(pasteTarget, {
      clipboardData: { getData: () => "2026-02-20T00:00:00Z" },
    });

    expect(onChange).toHaveBeenLastCalledWith({ end: "2026-02-20" });
  });

  test("includes both start and end when both are filled", () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{ start: "2026-02-04" }}
        onChange={onChange}
        label="DateTime"
      />
    );

    const pasteTarget = screen.getByTestId("end-YYYY-MM-DD-field-DateTime");
    fireEvent.paste(pasteTarget, {
      clipboardData: { getData: () => "2026-02-20T00:00:00Z" },
    });

    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-02-04",
      end: "2026-02-20",
    });
  });

  test("removes start from JSON when start is cleared while end exists", () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{ start: "2026-02-04", end: "2026-02-20" }}
        onChange={onChange}
        label="DateTime"
      />
    );

    const startInputWrapper = screen.getByTestId(
      "start-YYYY-MM-DD-field-DateTime"
    );
    const startInput = startInputWrapper.querySelector(
      "input"
    ) as HTMLInputElement;
    fireEvent.change(startInput, { target: { value: "" } });

    expect(onChange).toHaveBeenLastCalledWith({ end: "2026-02-20" });
  });

  test("removes end from JSON when end is cleared while start exists", () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{ start: "2026-02-04", end: "2026-02-20" }}
        onChange={onChange}
        label="DateTime"
      />
    );

    const endInputWrapper = screen.getByTestId("end-YYYY-MM-DD-field-DateTime");
    const endInput = endInputWrapper.querySelector("input") as HTMLInputElement;
    fireEvent.change(endInput, { target: { value: "" } });

    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-02-04" });
  });

  test("returns undefined when both dates are cleared", () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{ start: "2026-02-04", end: "2026-02-20" }}
        onChange={onChange}
        label="DateTime"
      />
    );

    const startInputWrapper = screen.getByTestId(
      "start-YYYY-MM-DD-field-DateTime"
    );
    const startInput = startInputWrapper.querySelector(
      "input"
    ) as HTMLInputElement;
    const endInputWrapper = screen.getByTestId("end-YYYY-MM-DD-field-DateTime");
    const endInput = endInputWrapper.querySelector("input") as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: "" } });
    fireEvent.change(endInput, { target: { value: "" } });

    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  test("returns undefined when format is changed", () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{}}
        onChange={onChange}
        label="period"
      />
    );

    const selector = screen.getByTestId(
      "date-time-format-selector-input-field-period"
    );
    fireEvent.change(selector, { target: { value: YEAR_FORMAT } });

    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  test("format change clears existing dates and calls onChange with undefined", () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{ start: "2026-02-04", end: "2026-02-20" }}
        onChange={onChange}
        label="DateTime"
      />
    );

    const selector = screen.getByTestId(
      "date-time-format-selector-input-field-DateTime"
    );
    fireEvent.change(selector, { target: { value: YEAR_FORMAT } });

    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });
});

describe("PeriodDateTimeComponent - Merge date and time", () => {
  test("merges start time into existing start date via updatePeriod", async () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{
          start: "2024-09-26T00:00:00+00:00",
          end: "2024-09-27T14:00:00+00:00",
        }}
        onChange={onChange}
        label="period"
      />
    );

    const timeInputs = screen.getAllByPlaceholderText("hh:mm:ss aa");
    const startTimeInput = timeInputs[0];
    fireEvent.change(startTimeInput, { target: { value: "08:30:00 AM" } });

    expect(onChange).toHaveBeenLastCalledWith({
      start: expect.stringContaining("2024-09-26T08:30:00"),
      end: expect.stringContaining("2024-09-27T14:00:00"),
    });
  });

  test("merges end time into existing end date via updatePeriod", async () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{
          start: "2024-09-26T12:00:00+00:00",
          end: "2024-09-27T00:00:00+00:00",
        }}
        onChange={onChange}
        label="period"
      />
    );

    const timeInputs = screen.getAllByPlaceholderText("hh:mm:ss aa");
    const endTimeInput = timeInputs[1];
    fireEvent.change(endTimeInput, { target: { value: "03:45:00 PM" } });

    expect(onChange).toHaveBeenLastCalledWith({
      start: expect.stringContaining("2024-09-26T12:00:00"),
      end: expect.stringContaining("2024-09-27T15:45:00"),
    });
  });

  test("merges start date with existing start time via updatePeriod", async () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{
          start: "2024-09-26T10:30:00+00:00",
        }}
        onChange={onChange}
        label="period"
      />
    );

    const startDateWrapper = screen.getByTestId(
      `start-${DATE_TIME_ZONE_FORMAT}-field-period`
    );
    const startDateInput = startDateWrapper.querySelector(
      "input"
    ) as HTMLInputElement;
    fireEvent.change(startDateInput, { target: { value: "12-01-2024" } });

    expect(onChange).toHaveBeenLastCalledWith({
      start: expect.stringContaining("2024-12-01T10:30:00"),
    });
  });

  test("merges end date with existing end time via updatePeriod", async () => {
    const onChange = jest.fn();
    render(
      <PeriodDateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={{
          end: "2024-09-27T16:00:00+00:00",
        }}
        onChange={onChange}
        label="period"
      />
    );

    const endDateWrapper = screen.getByTestId(
      `end-${DATE_TIME_ZONE_FORMAT}-field-period`
    );
    const endDateInput = endDateWrapper.querySelector(
      "input"
    ) as HTMLInputElement;
    fireEvent.change(endDateInput, { target: { value: "12-15-2024" } });

    expect(onChange).toHaveBeenLastCalledWith({
      end: expect.stringContaining("2024-12-15T16:00:00"),
    });
  });
});
