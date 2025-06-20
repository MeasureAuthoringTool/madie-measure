import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MeasureGroupScoringUnit from "./MeasureGroupScoringUnit";
import { act } from "react-dom/test-utils";

describe("MeasureGroupScoringUnit Component", () => {
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

    act(() => {
      userEvent.type(scoringUnitInput, "/mn");
    });
  });
});
