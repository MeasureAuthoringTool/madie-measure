import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DateTimeComponent, {
  YEAR_FORMAT,
  YEAR_MONTH_FORMAT,
  YEAR_MONTH_DAY_FORMAT,
  DATE_TIME_ZONE_FORMAT,
} from "./DateTimeComponent";
import dayjs from "dayjs";

describe("DateTimeComponent", () => {
  test("renders with default label", () => {
    const handleChange = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value="2024-09-26"
        onChange={handleChange}
      />
    );
    expect(screen.getByTestId("YYYY-MM-DD-field-DateTime")).toBeInTheDocument();
  });

  test("renders invalid format and calls setTouched", () => {
    const handleChange = jest.fn();
    const setTouched = jest.fn();

    render(
      <DateTimeComponent
        value="2024-09-26222234"
        label="birthday"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        setTouched={setTouched}
      />
    );

    expect(
      screen.getByRole("textbox", { name: "Date Field" })
    ).toBeInTheDocument();
    expect(
      (
        screen.getByTestId(
          "date-time-format-selector-input-field-birthday"
        ) as HTMLInputElement
      ).value
    ).toBe("Invalid Format");
    expect(setTouched).toHaveBeenCalled();
  });

  test("switches and renders all date formats from empty value", () => {
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

    const selector = screen.getByTestId(
      "date-time-format-selector-input-field-birthday"
    );

    for (const format of [
      YEAR_FORMAT,
      YEAR_MONTH_FORMAT,
      YEAR_MONTH_DAY_FORMAT,
      DATE_TIME_ZONE_FORMAT,
    ]) {
      fireEvent.change(selector, { target: { value: format } });
      expect(
        screen.getByTestId(`${format}-field-birthday`)
      ).toBeInTheDocument();
    }
  });

  test("handles input in YEAR format", async () => {
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

    fireEvent.change(
      screen.getByTestId("date-time-format-selector-input-field-birthday"),
      {
        target: { value: YEAR_FORMAT },
      }
    );

    const input = screen.getByTestId(`${YEAR_FORMAT}-field-birthday-input`);
    userEvent.type(input, "2022");
    expect(handleChange).toBeCalledWith("2022");
  });

  test("handles input in YEAR_MONTH format", async () => {
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

    fireEvent.change(
      screen.getByTestId("date-time-format-selector-input-field-birthday"),
      {
        target: { value: YEAR_MONTH_FORMAT },
      }
    );

    const input = screen.getByTestId(
      `${YEAR_MONTH_FORMAT}-field-birthday-input`
    ) as HTMLInputElement;
    userEvent.type(input, "January 2025");
    expect(input.value).toBe("01-2025");
    expect(handleChange).toBeCalledWith("2025-01");
  });

  test("handles input in YEAR_MONTH_DAY format", async () => {
    const handleChange = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={null}
        onChange={handleChange}
        addTitle={"Birthday"}
        showAddAttributeButton={true}
      />
    );
    expect(screen.getByText("Add Birthday")).toBeInTheDocument();
    fireEvent.change(
      screen.getByTestId("date-time-format-selector-input-field-birthday"),
      {
        target: { value: YEAR_MONTH_DAY_FORMAT },
      }
    );

    const input = screen.getByTestId(
      `${YEAR_MONTH_DAY_FORMAT}-field-birthday-input`
    );
    userEvent.type(input, "01-01-2025");
    expect(handleChange).toBeCalledWith("2025-01-01");
  });

  test("AddElementButton functionality works", async () => {
    const handleChange = jest.fn();
    const handleAddElement = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={null}
        onChange={handleChange}
        addTitle={"Birthday"}
        showAddAttributeButton={true}
        handleAddElement={handleAddElement}
      />
    );

    expect(screen.getByText("Add Birthday")).toBeInTheDocument();

    fireEvent.change(
      screen.getByTestId("date-time-format-selector-input-field-birthday"),
      {
        target: { value: YEAR_MONTH_DAY_FORMAT },
      }
    );

    const input = screen.getByTestId(
      `${YEAR_MONTH_DAY_FORMAT}-field-birthday-input`
    );
    userEvent.type(input, "01-01-2025");
    expect(handleChange).toBeCalledWith("2025-01-01");

    // Test AddElementButton click
    const addButton = screen.getByText("Add Birthday");
    fireEvent.click(addButton);
    expect(handleAddElement).toHaveBeenCalled();
  });

  test("AddElementButton is not rendered when showAddAttributeButton is false", () => {
    const handleChange = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={null}
        onChange={handleChange}
        addTitle={"Birthday"}
        showAddAttributeButton={false}
      />
    );

    expect(screen.queryByText("Add Birthday")).not.toBeInTheDocument();
  });

  test("AddElementButton is not rendered when addTitle is not provided", () => {
    const handleChange = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value={null}
        onChange={handleChange}
        showAddAttributeButton={true}
      />
    );

    expect(screen.queryByText(/Add/)).not.toBeInTheDocument();
  });

  it("Handles pasted date and resets time to 00:00:00", () => {
    const onChange = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        fieldRequired={false}
        value={null}
        onChange={onChange}
        label="birthday"
      />
    );

    const pasteTarget = screen.getByTestId(
      `${YEAR_MONTH_DAY_FORMAT}-field-birthday-input`
    );
    fireEvent.paste(pasteTarget, {
      clipboardData: {
        getData: () => "2023-10-15T12:00:00Z",
      },
    });

    const expectedDate = dayjs.utc("2023-10-15").hour(0).minute(0).second(0);
    expect(onChange).toHaveBeenCalledWith(expectedDate.format("YYYY-MM-DD"));
  });
});
