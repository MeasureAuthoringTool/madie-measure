import { jest } from "@jest/globals";
import * as React from "react";
import { render, cleanup, waitFor } from "@testing-library/react";
import MeasureDefinitionRow from "./MeasureMetaDataRow";
import userEvent from "@testing-library/user-event";

afterEach(cleanup);

describe("Measure MetaData Row Component", () => {
  it("Measure MetaData rows renders Measure Reference", async () => {
    const { getByText } = render(
      <MeasureDefinitionRow
        name="MeasureReference"
        description="Measure reference description"
        type="reference"
      />
    );
    const name = getByText("MeasureReference");
    expect(name).toBeInTheDocument();
    const description = getByText("Measure reference description");
    expect(description).toBeInTheDocument();
  });

  it("Measure MetaData rows renders MeasureDefinition", async () => {
    const { getByText, getByTestId } = render(
      <MeasureDefinitionRow
        name="term"
        description="I'm a measure definition"
        id="reference_id_1"
        handleClick={jest.fn()}
        canEdit={true}
        type="reference"
      />
    );
    const term = getByText("term");
    expect(term).toBeInTheDocument();
    const definition = getByText("I'm a measure definition");
    expect(definition).toBeInTheDocument();

    const editButton = getByTestId(`edit-measure-reference-reference_id_1`);
    expect(editButton).toBeInTheDocument();
  });
});
