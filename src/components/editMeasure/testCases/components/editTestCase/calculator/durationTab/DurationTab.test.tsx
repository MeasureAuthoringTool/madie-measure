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

  it("updates precision when a new option is selected", () => {
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
    userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("shows '--' for results if calculate is clicked without both dates", () => {
    render(<DurationTab />);
    const calculateButton = screen.getByTestId("calculate-duration");
    userEvent.click(calculateButton);
    expect(screen.getByTestId("duration-result")).toHaveValue("--");
    expect(screen.getByTestId("difference-result")).toHaveValue("--");
  });

  it("shows '--' for results if calculate is clicked when either start date or end date is missing", () => {
    render(<DurationTab />);
    const startDateInput = screen.getByLabelText("Start Date");
    userEvent.type(startDateInput, "01/01/2020");
    const calculateButton = screen.getByTestId("calculate-duration");
    userEvent.click(calculateButton);
    expect(screen.getByTestId("duration-result")).toHaveValue("--");
    expect(screen.getByTestId("difference-result")).toHaveValue("--");
  });

  it("calculates duration and difference in years", () => {
    render(<DurationTab />);
    const startDateInput = screen.getByLabelText("Start Date");
    const endDateInput = screen.getByLabelText("End Date");
    userEvent.type(startDateInput, "01/01/2020");
    userEvent.type(endDateInput, "01/01/2023");
    userEvent.click(screen.getByTestId("calculate-duration"));
    expect(screen.getByTestId("duration-result")).toHaveValue("3 years");
    expect(screen.getByTestId("difference-result")).toHaveValue("3 years");
  });

  it("calculates duration and difference in months", () => {
    render(<DurationTab />);
    const startDateInput = screen.getByLabelText("Start Date");
    const endDateInput = screen.getByLabelText("End Date");
    userEvent.type(startDateInput, "01/01/2020");
    userEvent.type(endDateInput, "04/01/2020");
    // Change precision to months
    const precisionDropdown = screen.getByRole("combobox");
    userEvent.click(precisionDropdown);
    const monthsOption = screen.getByRole("option", { name: "Months" });
    userEvent.click(monthsOption);
    userEvent.click(screen.getByTestId("calculate-duration"));
    expect(screen.getByTestId("duration-result")).toHaveValue("3 months");
    expect(screen.getByTestId("difference-result")).toHaveValue("3 months");
  });

  it("calculates duration and difference in weeks", () => {
    render(<DurationTab />);
    const startDateInput = screen.getByLabelText("Start Date");
    const endDateInput = screen.getByLabelText("End Date");
    userEvent.type(startDateInput, "01/01/2020");
    userEvent.type(endDateInput, "01/22/2020");
    // Change precision to weeks
    const precisionDropdown = screen.getByRole("combobox");
    userEvent.click(precisionDropdown);
    const weeksOption = screen.getByRole("option", { name: "Weeks" });
    userEvent.click(weeksOption);
    userEvent.click(screen.getByTestId("calculate-duration"));
    expect(screen.getByTestId("duration-result")).toHaveValue("3 weeks");
    expect(screen.getByTestId("difference-result")).toHaveValue("3 weeks");
  });

  it("calculates duration and difference in days", () => {
    render(<DurationTab />);
    const startDateInput = screen.getByLabelText("Start Date");
    const endDateInput = screen.getByLabelText("End Date");
    userEvent.type(startDateInput, "01/01/2020");
    userEvent.type(endDateInput, "01/05/2020");
    // Change precision to days
    const precisionDropdown = screen.getByRole("combobox");
    userEvent.click(precisionDropdown);
    const daysOption = screen.getByRole("option", { name: "Days" });
    userEvent.click(daysOption);
    userEvent.click(screen.getByTestId("calculate-duration"));
    expect(screen.getByTestId("duration-result")).toHaveValue("4 days");
    expect(screen.getByTestId("difference-result")).toHaveValue("4 days");
  });

  it("adds 1 day when end date inclusive is checked", () => {
    render(<DurationTab />);
    const startDateInput = screen.getByLabelText("Start Date");
    const endDateInput = screen.getByLabelText("End Date");
    userEvent.type(startDateInput, "01/01/2020");
    userEvent.type(endDateInput, "01/05/2020");
    // Change precision to days
    const precisionDropdown = screen.getByRole("combobox");
    userEvent.click(precisionDropdown);
    const daysOption = screen.getByRole("option", { name: "Days" });
    userEvent.click(daysOption);
    // Check the end date inclusive checkbox
    const checkbox = screen.getByLabelText(
      "Include end date in calculation (1 day is added)"
    );
    userEvent.click(checkbox);
    userEvent.click(screen.getByTestId("calculate-duration"));
    expect(screen.getByTestId("duration-result")).toHaveValue("5 days");
    expect(screen.getByTestId("difference-result")).toHaveValue("5 days");
  });

  it("shows values even if start date is after end date", () => {
    render(<DurationTab />);
    const startDateInput = screen.getByLabelText("Start Date");
    const endDateInput = screen.getByLabelText("End Date");
    userEvent.type(startDateInput, "01/10/2020");
    userEvent.type(endDateInput, "01/05/2020");
    userEvent.click(screen.getByTestId("calculate-duration"));
    expect(screen.getByTestId("duration-result")).toHaveValue("-1 years");
    expect(screen.getByTestId("difference-result")).toHaveValue("1 years");
  });
});
