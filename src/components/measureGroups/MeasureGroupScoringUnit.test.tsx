import * as React from "react";
import {
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import MeasureGroupScoringUnit from "./MeasureGroupScoringUnit";
import userEvent from "@testing-library/user-event";

describe("MeasureGroupScoringUnit Component", () => {
  test("Should render scoring unit field", () => {
    const handleChange = jest.fn();
    render(
      <MeasureGroupScoringUnit
        value={"Test Option1"}
        onChange={handleChange}
        canEdit={true}
      />
    );

    const scoringUnitLabel = screen.getByText("Scoring Unit");
    expect(scoringUnitLabel).toBeInTheDocument();
    const scoringUnitInput = screen.getByRole("combobox");
    expect(scoringUnitInput).toBeInTheDocument();
  });

  test("Should render ucum options on click", async () => {
    const handleChange = jest.fn();

    render(
      <MeasureGroupScoringUnit
        value={"Test Option1"}
        onChange={handleChange}
        canEdit={true}
      />
    );
    const scoringUnitInput = screen.getByRole("combobox");
    userEvent.click(scoringUnitInput);

    expect(
      await screen.findByRole("combobox", { expanded: true })
    ).toBeInTheDocument();

    expect(screen.getByText("%")).toBeInTheDocument();
  });

  test("Should filter options on input change", () => {
    const handleChange = jest.fn();

    const { getByTestId } = render(
      <MeasureGroupScoringUnit
        value={"Test Option1"}
        onChange={handleChange}
        canEdit={true}
      />
    );
    const scoringUnit = getByTestId("measure-group-scoring-unit");
    expect(scoringUnit.textContent).toBe("Scoring Unit");

    const scoringUnitInput = within(scoringUnit).getByRole("combobox");
    expect(scoringUnitInput.getAttribute("value")).toBe("Test Option1");

    fireEvent.change(scoringUnitInput, {
      target: { value: "cm" },
    });
    const ucumOptionText = screen.getByText("cm centimeter");
    expect(ucumOptionText).toBeInTheDocument();

    fireEvent.change(scoringUnitInput, {
      target: { value: "k" },
    });
    const ucumOption1 = document.getElementById("react-select-4-option-0-0");
    expect(ucumOption1).toBeInTheDocument();
    const ucumOptionText1 = screen.getByText("[k] Boltzmann constant");
    expect(ucumOptionText1).toBeInTheDocument();
    const ucumOption2 = document.getElementById("react-select-4-option-0-1");
    expect(ucumOption2).toBeInTheDocument();
    const ucumOptionText2 = screen.getByText("[car_Au] carat of gold alloys");
    expect(ucumOptionText2).toBeInTheDocument();
  });

  test("Should display Invalid Scoring Unit when user input is invalid", () => {
    const handleChange = jest.fn();
    render(
      <MeasureGroupScoringUnit
        value={""}
        onChange={handleChange}
        canEdit={true}
      />
    );

    const scoringUnitLabel = screen.getByText("Scoring Unit");
    expect(scoringUnitLabel).toBeInTheDocument();
    const scoringUnitInput = screen.getByRole("combobox");
    expect(scoringUnitInput).toBeInTheDocument();

    fireEvent.change(scoringUnitInput, {
      target: { value: "null" },
    });

    const scoringUnitOption = screen.getByText("Invalid Scoring Unit!");
    expect(scoringUnitOption).toBeInTheDocument();
  });
});
