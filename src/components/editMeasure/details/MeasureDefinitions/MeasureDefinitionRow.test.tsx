import * as React from "react";
import { render, cleanup } from "@testing-library/react";
import MeasureDefinitionRow from "./MeasureDefinitionRow";

afterEach(cleanup);

describe("Measure Definition Row Component", () => {
  it("Measure Definition Row renders at all", async () => {
    const { getByText, getByTestId } = render(
      <MeasureDefinitionRow
        measureDefinition={{
          term: "term",
          definition: "I'm a measure definition",
        }}
        setOpen={jest.fn()}
        setSelectedDefinition={jest.fn()}
      />
    );
    const term = getByText("term");
    expect(term).toBeInTheDocument();
    const definition = getByText("I'm a measure definition");
    expect(definition).toBeInTheDocument();

    const editButton = getByTestId(
      "measure-definition-edit-term-I'm a measure definition"
    );
    expect(editButton).toBeInTheDocument();
  });
});
