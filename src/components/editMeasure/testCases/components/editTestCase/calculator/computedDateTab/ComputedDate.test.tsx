import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ComputedDate from "./ComputedDate";
import userEvent from "@testing-library/user-event";

describe("ComputedDate", () => {
  it("renders the ComputedDate with initial state", () => {
    render(<ComputedDate />);
    expect(screen.getByLabelText("Initial Date")).toBeInTheDocument();
    expect(screen.getByText("Add/Subtract")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Days/Weeks/Months/Years")
    ).toBeInTheDocument();
    expect(screen.getByText("Calculate")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("--/--/----")).toBeInTheDocument();
  });

  it("Click compute precision dropdown can select options", () => {
    render(<ComputedDate />);
    const precisionDropdown = screen.getByRole("combobox");
    userEvent.click(precisionDropdown);
    const daysOption = screen.getByRole("option", {
      name: "Days",
    });
    expect(daysOption).toBeInTheDocument();
    const weeksOption = screen.getByRole("option", {
      name: "Weeks",
    });
    expect(weeksOption).toBeInTheDocument();
    const monthsOption = screen.getByRole("option", {
      name: "Months",
    });
    expect(monthsOption).toBeInTheDocument();
    const yearsOption = screen.getByRole("option", {
      name: "Years",
    });
    expect(yearsOption).toBeInTheDocument();

    const precisionOption = screen.getByTestId("precision-input");
    expect(precisionOption).toBeInTheDocument();
    fireEvent.change(precisionOption, { target: { value: "months" } });
    expect((precisionOption as HTMLInputElement).value).toBe("months");

    const precisionNumberInput = screen.getByTestId("precision-number-input");
    expect(precisionNumberInput).toBeInTheDocument();
    fireEvent.change(precisionNumberInput, { target: { value: "5" } });
    expect((precisionNumberInput as HTMLInputElement).value).toBe("5");
  });

  it("computes the correct date when valid inputs are provided (add mode)", async () => {
    render(<ComputedDate />);
    const dateInput = screen.getByLabelText("Initial Date");
    userEvent.clear(dateInput);
    userEvent.type(dateInput, "01/01/2024");

    const precisionNumberInput = screen.getByLabelText(
      "Days/Weeks/Months/Years"
    );
    userEvent.clear(precisionNumberInput);
    userEvent.type(precisionNumberInput, "10");

    const precisionDropdown = screen.getByRole("combobox");
    userEvent.click(precisionDropdown);
    const daysOption = screen.getByRole("option", { name: "Days" });
    userEvent.click(daysOption);

    const calculateBtn = screen.getByTestId("calculate-computed-date");
    userEvent.click(calculateBtn);

    expect(await screen.findByDisplayValue("01/11/2024")).toBeInTheDocument();
  });

  it("computes the correct date when valid inputs are provided (subtract mode)", async () => {
    render(<ComputedDate />);
    const dateInput = screen.getByLabelText("Initial Date");
    userEvent.clear(dateInput);
    userEvent.type(dateInput, "01/15/2024");

    const precisionNumberInput = screen.getByLabelText(
      "Days/Weeks/Months/Years"
    );
    userEvent.clear(precisionNumberInput);
    userEvent.type(precisionNumberInput, "5");

    const precisionDropdown = screen.getByRole("combobox");
    userEvent.click(precisionDropdown);
    const daysOption = screen.getByRole("option", { name: "Days" });
    userEvent.click(daysOption);

    const subtractRadio = screen.getByLabelText("(-) Subtract");
    userEvent.click(subtractRadio);

    const calculateBtn = screen.getByTestId("calculate-computed-date");
    userEvent.click(calculateBtn);

    expect(await screen.findByDisplayValue("01/10/2024")).toBeInTheDocument();
  });

  it("shows placeholder when inputs are missing or invalid", async () => {
    render(<ComputedDate />);

    const calculateBtn = screen.getByTestId("calculate-computed-date");
    userEvent.click(calculateBtn);
    expect(screen.getByDisplayValue("--/--/----")).toBeInTheDocument();

    const dateInput = screen.getByLabelText("Initial Date");
    userEvent.clear(dateInput);
    userEvent.type(dateInput, "01/01/2024");
    userEvent.click(calculateBtn);
    expect(screen.getByDisplayValue("--/--/----")).toBeInTheDocument();
  });

  it("copies computed date to clipboard", async () => {
    // Mock clipboard
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<ComputedDate />);
    const dateInput = screen.getByLabelText("Initial Date");
    userEvent.clear(dateInput);
    userEvent.type(dateInput, "01/01/2024");

    const precisionNumberInput = screen.getByLabelText(
      "Days/Weeks/Months/Years"
    );
    userEvent.clear(precisionNumberInput);
    userEvent.type(precisionNumberInput, "10");

    const precisionDropdown = screen.getByRole("combobox");
    userEvent.click(precisionDropdown);
    const daysOption = screen.getByRole("option", { name: "Days" });
    userEvent.click(daysOption);

    const calculateBtn = screen.getByTestId("calculate-computed-date");
    userEvent.click(calculateBtn);

    expect(await screen.findByDisplayValue("01/11/2024")).toBeInTheDocument();

    const copyBtn = await screen.findByTestId("copy-computed-date");
    await userEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith("01/11/2024");
  });
});
