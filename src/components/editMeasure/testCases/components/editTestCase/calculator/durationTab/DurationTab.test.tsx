import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DurationTab from "./DurationTab";
import dayjs from "dayjs";
import userEvent from "@testing-library/user-event";

describe("DurationTab", () => {
  it("renders the component with initial state", () => {
    render(<DurationTab />);
    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("End Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Precision")).toBeInTheDocument();
    expect(screen.getAllByText("Today")[0]).toBeInTheDocument();
    expect(screen.getByText("Calculate")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("--")[0]).toBeInTheDocument();
  });

  it("updates start date when 'Today' button is clicked", () => {
    render(<DurationTab />);
    const todayButton = screen.getAllByText("Today")[0];
    fireEvent.click(todayButton);
    const startDateInput = screen.getByLabelText("Start Date");
    expect(startDateInput).toHaveValue(dayjs.utc().format("MM/DD/YYYY"));
  });

  it("updates end date when 'Today' button is clicked", () => {
    render(<DurationTab />);
    const todayButton = screen.getAllByText("Today")[1];
    fireEvent.click(todayButton);
    const endDateInput = screen.getByLabelText("End Date");
    expect(endDateInput).toHaveValue(dayjs.utc().format("MM/DD/YYYY"));
  });

  it("enables calculate button when both dates are provided", () => {
    render(<DurationTab />);
    const todayButtons = screen.getAllByText("Today");
    fireEvent.click(todayButtons[0]);
    fireEvent.click(todayButtons[1]);
    const calculateButton = screen.getByText("Calculate");
    expect(calculateButton).not.toBeDisabled();
  });

  it("does not update start date if 'Today' button is clicked and date is already set", () => {
    render(<DurationTab />);
    const todayButton = screen.getAllByText("Today")[0];
    fireEvent.click(todayButton);
    const startDateInput = screen.getByLabelText("Start Date");
    // @ts-ignore
    const initialDate = startDateInput.value;
    fireEvent.click(todayButton);
    expect(startDateInput).toHaveValue(initialDate);
  });

  it("updates precision when a new option is selected", async () => {
    render(<DurationTab />);
    const precisionDropdown = screen.getByRole("combobox");
    userEvent.click(precisionDropdown);
    const monthsOption = screen.getByRole("option", {
      name: "Months",
    });
    userEvent.click(monthsOption);
    expect(precisionDropdown).toHaveTextContent("months");
  });

  it("toggles end date inclusion checkbox", () => {
    render(<DurationTab />);
    const checkbox = screen.getByLabelText(
      "Include end date in calculation (1 day is added)"
    );
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
