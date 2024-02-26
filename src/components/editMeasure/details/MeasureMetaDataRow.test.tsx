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
      />
    );
    const term = getByText("term");
    expect(term).toBeInTheDocument();
    const definition = getByText("I'm a measure definition");
    expect(definition).toBeInTheDocument();

    await waitFor(() => {
      const selectButton = getByTestId(`select-action-reference_id_1`);
      expect(selectButton).toBeInTheDocument();
      userEvent.click(selectButton);
    });

    const editButton = getByTestId(`edit-measure-reference-reference_id_1`);
    expect(editButton).toBeInTheDocument();
  });
});
