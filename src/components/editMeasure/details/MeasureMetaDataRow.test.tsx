import * as React from "react";
import { render, cleanup } from "@testing-library/react";
import MeasureDefinitionRow from "./MeasureMetaDataRow";

afterEach(cleanup);

describe("Measure MetaData Row Component", () => {
  it("Measure Definition Row renders at all", async () => {
    const { getByText } = render(
      <MeasureDefinitionRow
        value={{
          term: "term",
          definition: "I'm a measure definition",
        }}
        type="definition"
      />
    );
    const term = getByText("term");
    expect(term).toBeInTheDocument();
    const definition = getByText("I'm a measure definition");
    expect(definition).toBeInTheDocument();
  });
  it("Measure Definition Row renders at all", async () => {
    const { getByText } = render(
      <MeasureDefinitionRow
        value={{
          referenceType: "Criteria",
          referenceText: "I'm a reference",
        }}
        type="reference"
      />
    );
    const criteria = getByText("Criteria");
    expect(criteria).toBeInTheDocument();
    const reference = getByText("I'm a reference");
    expect(reference).toBeInTheDocument();
  });
});
