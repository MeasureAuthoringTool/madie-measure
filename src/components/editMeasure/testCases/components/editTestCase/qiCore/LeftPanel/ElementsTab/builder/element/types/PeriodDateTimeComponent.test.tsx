import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PeriodDateTimeComponent, {
  YEAR_FORMAT,
  YEAR_MONTH_FORMAT,
  YEAR_MONTH_DAY_FORMAT,
  DATE_TIME_ZONE_FORMAT,
} from "./PeriodDateTimeComponent";

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
