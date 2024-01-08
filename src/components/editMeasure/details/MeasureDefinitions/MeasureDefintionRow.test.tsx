import * as React from "react";
import { render, cleanup } from "@testing-library/react";
import MeasureDefinitionRow from "./MeasureDefinitionRow";

afterEach(cleanup);

describe("Measure Definition Row Component", () => {
  it("Measure Definition Row renders at all", async () => {
    const { getByText } = render(
      <MeasureDefinitionRow
        measureDefinition={{
          term: "term",
          definition: "I'm a measure definition",
        }}
      />
    );
    const term = getByText("term");
    expect(term).toBeInTheDocument();
    const definition = getByText("I'm a measure definition");
    expect(definition).toBeInTheDocument();
  });
});
