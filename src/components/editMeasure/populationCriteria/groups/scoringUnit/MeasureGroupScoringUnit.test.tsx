import React, { useState } from "react";
import {
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from "@testing-library/react";
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
        placeholder="test"
      />
    );
    const scoringUnitInput = screen.getByLabelText("Scoring Unit");
    expect(scoringUnitInput).toBeInTheDocument();
  });
});
