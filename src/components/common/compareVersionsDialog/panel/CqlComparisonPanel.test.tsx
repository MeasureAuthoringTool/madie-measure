import React from "react";
import { render, screen } from "@testing-library/react";
import { Measure } from "@madie/madie-models";
import CqlComparisonPanel from "./CqlComparisonPanel";

const mockMeasures: Measure[] = [
  {
    id: "1",
    measureName: "Older Measure",
    version: "1.0.001",
    lastModifiedAt: "2025-11-20T10:00:00Z",
    measureSet: { cmsId: "100" },
    measureMetaData: { draft: false },
  } as any,
  {
    id: "2",
    measureName: "Newer Measure (Draft)",
    version: "1.1.001",
    lastModifiedAt: "2025-11-21T12:00:00Z",
    measureSet: { cmsId: "100" },
    measureMetaData: { draft: true },
  } as any,
];

describe("CqlComparisonPanel component", () => {
  it("renders the old measure correctly", () => {
    render(<CqlComparisonPanel measure={mockMeasures[0]} side="old" />);

    expect(screen.getByTestId("comparison-panel-old")).toBeInTheDocument();
    expect(screen.getByTestId("version-text-old")).toHaveTextContent(
      `Version ${mockMeasures[0].version}`
    );
    expect(screen.queryByTestId("draft-chip-old")).not.toBeInTheDocument();
    expect(screen.getByTestId("last-updated-old")).toHaveTextContent(
      "Last updated on 11/20/2025"
    );
    expect(screen.getByTestId("panel-content-old")).toHaveTextContent(
      "CQL coming soon"
    );
  });

  it("renders the new measure (draft) correctly", () => {
    render(<CqlComparisonPanel measure={mockMeasures[1]} side="new" />);

    expect(screen.getByTestId("comparison-panel-new")).toBeInTheDocument();
    expect(screen.getByTestId("version-text-new")).toHaveTextContent(
      `Version ${mockMeasures[1].version}`
    );
    expect(screen.getByTestId("draft-chip-new")).toBeInTheDocument();
    expect(screen.getByTestId("last-updated-new")).toHaveTextContent(
      "Last updated on 11/21/2025"
    );
    expect(screen.getByTestId("panel-content-new")).toHaveTextContent(
      "CQL coming soon"
    );
  });
});
