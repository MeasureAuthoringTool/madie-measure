import * as React from "react";
import { render, cleanup, screen } from "@testing-library/react";
import MeasureDefinitionRow from "./MeasureMetaDataRow";

afterEach(cleanup);

const testDescription = `this is a statement
      this is a statement
           this is a statement`;
const testDescriptionWithHtml = `<p>this is a statement</p><p><strong>this is a statement</strong></p><p><u>this is a statement</u></p>`;
const measureDefinitionRowId = "cdbf1bb6-2c18-4edb-ae57-123a1f263633";

describe("Measure MetaData Row Component", () => {
  it("Measure MetaData rows renders Measure Reference with description", async () => {
    render(
      <MeasureDefinitionRow
        name="MeasureReference"
        description={testDescription}
        id={measureDefinitionRowId}
        type="reference"
      />
    );

    const name = screen.getByText("MeasureReference");
    expect(name).toBeInTheDocument();

    // Use a function matcher to be more flexible with whitespace
    const descriptionElement = screen.getByText((content, element) => {
      return (
        content.includes("this is a statement") &&
        element?.textContent?.includes("this is a statement")
      );
    });
    expect(descriptionElement).toBeInTheDocument();
  });

  it("Measure MetaData rows renders Measure Reference with description (with no html in description)", async () => {
    render(
      <MeasureDefinitionRow
        name="MeasureReference"
        description={testDescription}
        id={measureDefinitionRowId}
        type="reference"
      />
    );

    const name = screen.getByText("MeasureReference");
    expect(name).toBeInTheDocument();

    const richTextReadOnlyDescription = screen.getByTestId(
      "MeasureReference-value"
    );
    expect(richTextReadOnlyDescription).toBeInTheDocument();

    expect(richTextReadOnlyDescription.innerHTML).toBe(
      "this is a statement\n      this is a statement\n           this is a statement"
    );
  });

  it("Measure MetaData rows renders Measure Reference with description (with html in description)", async () => {
    render(
      <MeasureDefinitionRow
        name="MeasureReference"
        description={testDescriptionWithHtml}
        id={measureDefinitionRowId}
        type="reference"
      />
    );

    const name = screen.getByText("MeasureReference");
    expect(name).toBeInTheDocument();

    const richTextReadOnlyDescription = screen.getByTestId(
      "MeasureReference-value"
    );
    expect(richTextReadOnlyDescription).toBeInTheDocument();

    expect(richTextReadOnlyDescription).toContainHTML(
      "<p>this is a statement</p>"
    );
    expect(richTextReadOnlyDescription).toContainHTML(
      "<p><strong>this is a statement</strong></p>"
    );
    expect(richTextReadOnlyDescription).toContainHTML(
      "<p><u>this is a statement</u></p>"
    );
  });

  it("Measure MetaData rows renders MeasureDefinition with edit functionality", async () => {
    const mockHandleClick = jest.fn();

    render(
      <MeasureDefinitionRow
        name="term"
        description="I'm a measure definition"
        id="reference_id_1"
        handleClick={mockHandleClick}
        canEdit={true}
        type="reference"
      />
    );

    const term = screen.getByText("term");
    expect(term).toBeInTheDocument();

    const definition = screen.getByText("I'm a measure definition");
    expect(definition).toBeInTheDocument();

    const editButton = screen.getByTestId(
      `edit-measure-reference-reference_id_1`
    );
    expect(editButton).toBeInTheDocument();
  });
});
