import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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
});
