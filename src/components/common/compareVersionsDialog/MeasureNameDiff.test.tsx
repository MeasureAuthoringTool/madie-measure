import React from "react";
import { render, screen } from "@testing-library/react";
import MeasureNameDiff from "./MeasureNameDiff";

describe("MeasureNameDiff", () => {
  it("renders unchanged text only if no additions or removals", () => {
    render(
      <MeasureNameDiff
        oldMeasureName="Blood Pressure"
        newMeasureName="Blood Pressure"
      />
    );

    const allTokens = screen.getAllByTestId(/diff-(added|removed|unchanged)-/);
    expect(allTokens.length).toBe(1);
    expect(allTokens[0].textContent?.trim()).toBe("Blood Pressure");
  });

  it("renders a simple added token after unchanged text", () => {
    render(
      <MeasureNameDiff
        oldMeasureName="Blood Pressure"
        newMeasureName="Blood Pressure Measurement"
      />
    );

    const allTokens = screen.getAllByTestId(/diff-(added|removed|unchanged)-/);
    expect(allTokens.length).toBe(2);

    expect(allTokens[0].textContent?.trim()).toBe("Blood Pressure");

    expect(allTokens[1]).toHaveTextContent("++ Measurement");
    expect(allTokens[1]).toHaveStyle(
      "color: #4d7e23; background-color: #ddfbe6; font-weight: 500"
    );
  });

  it("renders a removed token after unchanged text", () => {
    render(
      <MeasureNameDiff
        oldMeasureName="Blood Pressure Measurement"
        newMeasureName="Blood Pressure"
      />
    );

    const allTokens = screen.getAllByTestId(/diff-(added|removed|unchanged)-/);
    expect(allTokens.length).toBe(2);

    expect(allTokens[0].textContent?.trim()).toBe("Blood Pressure");

    expect(allTokens[1]).toHaveTextContent("-- Measurement");
    expect(allTokens[1]).toHaveStyle(
      "color: #ae1c1c; background-color: #fbe9eb; font-weight: 500"
    );

    const removedInnerSpan = allTokens[1].querySelector("span");
    expect(removedInnerSpan).toHaveStyle("text-decoration: line-through");
  });

  it("adds spaces consistently between unchanged, removed, and added tokens", () => {
    render(
      <MeasureNameDiff
        oldMeasureName="Blood Pressure Measurement"
        newMeasureName="Blood Pressure Updated"
      />
    );

    const allTokens = screen.getAllByTestId(/diff-(added|removed|unchanged)-/);
    const text = allTokens.map((t) => t.textContent?.trim()).join(" ");
    expect(text).toBe("Blood Pressure -- Measurement ++ Updated");
  });

  it("renders all diff tokens in order with correct content and styling", () => {
    render(
      <MeasureNameDiff
        oldMeasureName="Systolic Blood Pressure"
        newMeasureName="Diastolic Blood Pressure Measurement"
      />
    );

    const allTokens = screen.getAllByTestId(/diff-(added|removed|unchanged)-/);
    expect(allTokens.length).toBe(4);

    // Removed "Systolic"
    expect(allTokens[0]).toHaveTextContent("-- Systolic");
    expect(allTokens[0]).toHaveStyle(
      "color: #ae1c1c; background-color: #fbe9eb; font-weight: 500"
    );
    const removedInnerSpan = allTokens[0].querySelector("span");
    expect(removedInnerSpan).toHaveStyle("text-decoration: line-through");

    // Added "Diastolic"
    expect(allTokens[1]).toHaveTextContent("++ Diastolic");
    expect(allTokens[1]).toHaveStyle(
      "color: #4d7e23; background-color: #ddfbe6; font-weight: 500"
    );

    // Unchanged "Blood Pressure"
    expect(allTokens[2].textContent?.trim()).toBe("Blood Pressure");

    // Added "Measurement"
    expect(allTokens[3]).toHaveTextContent("++ Measurement");
    expect(allTokens[3]).toHaveStyle(
      "color: #4d7e23; background-color: #ddfbe6; font-weight: 500"
    );
  });
});
