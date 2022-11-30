import * as React from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";
import MeasureGroupScoringUnit from "./MeasureGroupScoringUnit";
import { act } from "react-dom/test-utils";

describe("MeasureGroupScoringUnit Component", () => {
  const options = [
    {
      code: "B[V]",
      guidance: "used to express power gain in electrical circuits",
      name: "bel volt",
      system: "https://clinicaltables.nlm.nih.gov/",
    },
    {
      code: "B",
      guidance:
        "Logarithm of the ratio of power- or field-type quantities; usually expressed in decibels ",
      name: "bel",
      system: "https://clinicaltables.nlm.nih.gov/",
    },
    {
      code: "mho",
      guidance:
        "unit of electric conductance (the inverse of electrical resistance) equal to ohm^-1",
      name: "mho",
      system: "https://clinicaltables.nlm.nih.gov/",
    },
  ];
  const testValue = {
    value: {
      code: "mho",
      guidance:
        "unit of electric conductance (the inverse of electrical resistance) equal to ohm^-1",
      name: "mho",
      system: "https://clinicaltables.nlm.nih.gov/",
    },
  };
  test("Should render scoring unit field", () => {
    const handleChange = jest.fn();
    render(
      <MeasureGroupScoringUnit
        value={"Test Option1"}
        onChange={handleChange}
        canEdit={true}
      />
    );

    const scoringUnitLabel = screen.getByTestId("scoring-unit-dropdown-label");
    expect(scoringUnitLabel).toBeInTheDocument();
    const scoringUnitInput = screen.getByRole("combobox");
    expect(scoringUnitInput).toBeInTheDocument();
  });

  test("Should render scoring unit field with selected option", async () => {
    const handleChange = jest.fn();
    render(
      <MeasureGroupScoringUnit
        onChange={handleChange}
        canEdit={true}
        options={options}
        value={testValue}
      />
    );
    await act(async () => {
      const scoringUnitLabel = screen.getByTestId(
        "scoring-unit-dropdown-label"
      );
      expect(scoringUnitLabel).toBeInTheDocument();
      const scoringAutoComplete = await screen.findByTestId(
        "scoring-unit-dropdown"
      );
      const listBox = within(scoringAutoComplete).getByRole("combobox");
      expect(listBox).toHaveValue(
        `${testValue.value.code} ${testValue.value.name}`
      );
    });
  });

  test("Should render ucum options on click", async () => {
    const handleChange = jest.fn();
    render(
      <MeasureGroupScoringUnit
        value={null}
        onChange={handleChange}
        canEdit={true}
        options={options}
      />
    );
    let autoComplete;
    await waitFor(() => {
      autoComplete = screen.getByTestId("scoring-unit-dropdown");
    });
    const scoringSelectAutoComplete =
      within(autoComplete).getByRole("combobox");
    autoComplete.focus();
    fireEvent.change(scoringSelectAutoComplete, {
      target: { value: "b" },
    });
    fireEvent.keyDown(autoComplete, { key: "ArrowDown" });
    fireEvent.keyDown(autoComplete, { key: "Enter" });
    expect(scoringSelectAutoComplete).toHaveValue("B bel");
  });
});
