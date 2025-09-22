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
});
