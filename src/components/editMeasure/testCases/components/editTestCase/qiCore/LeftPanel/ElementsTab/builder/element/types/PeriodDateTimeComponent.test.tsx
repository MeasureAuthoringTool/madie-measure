import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PeriodDateTimeComponent, {
  YEAR_FORMAT,
  YEAR_MONTH_FORMAT,
  YEAR_MONTH_DAY_FORMAT,
  DATE_TIME_ZONE_FORMAT,
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
    expect(
      screen.getByTestId("start-YYYY-MM-DD-field-DateTime")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("end-YYYY-MM-DD-field-DateTime")
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
    expect(handleChange).toHaveBeenCalledWith({ start: "2022", end: "" });
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

  it("does not trigger onChange when user types an invalid end date and blurs", async () => {
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
    expect(onChange).not.toHaveBeenCalled();
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
      "start-YYYY-MM-DD-field-DateTime"
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

    const endInput = await screen.findByTestId("end-YYYY-MM-DD-field-DateTime");
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

    const startInput = await screen.findByTestId("start-year-field-DateTime");
    const endInput = await screen.findByTestId("end-year-field-DateTime");

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
      "date-time-format-selector-input-field-DateTime"
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
      "date-time-format-selector-input-field-DateTime"
    );
    expect((selector as HTMLSelectElement).value).toBe("YYYY-MM-DD");
  });
});
