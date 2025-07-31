import * as React from "react";
import { render, cleanup, waitFor, screen } from "@testing-library/react";
import MeasureDefinitionRow from "./MeasureMetaDataRow";
import { useFeatureFlags } from "@madie/madie-util";

afterEach(cleanup);

jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: jest.fn(() => {
    return {
      EnhancedTextFormatting: false,
    };
  }),
}));

const testDescription = `this is a statement
      this is a statement
           this is a statement`;
const testDescriptionWithHtml = `<p>this is a statement</p><p><strong>this is a statement</strong></p><p><u>this is a statement</u></p>`;
const measureDefinitionRowId = "cdbf1bb6-2c18-4edb-ae57-123a1f263633";

describe("Measure MetaData Row Component", () => {
  beforeEach(() => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      EnhancedTextFormatting: false,
    }));
  });

  it("Measure MetaData rows renders Measure Reference with description", async () => {
    const { getByText } = render(
      <MeasureDefinitionRow
        name="MeasureReference"
        description={testDescription}
        id={measureDefinitionRowId}
        type="reference"
      />
    );
    const name = getByText("MeasureReference");
    expect(name).toBeInTheDocument();

    const readOnlyDescription = screen.getByTestId(
      `measure-reference-${measureDefinitionRowId}-description`
    );
    expect(readOnlyDescription).toBeInTheDocument();
    expect(readOnlyDescription.textContent).toEqual(testDescription);
  });

  it("Measure MetaData rows renders Measure Reference with description (with no html in description) if EnhancedTextFormatting flag is true", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      EnhancedTextFormatting: true,
    }));

    const { getByText } = render(
      <MeasureDefinitionRow
        name="MeasureReference"
        description={testDescription}
        id={measureDefinitionRowId}
        type="reference"
      />
    );
    const name = getByText("MeasureReference");
    expect(name).toBeInTheDocument();

    const richTextReadOnlyDescription = screen.getByTestId(
      "measure-reference-rich-text-editor"
    );
    expect(richTextReadOnlyDescription).toBeInTheDocument();

    const paragraph = richTextReadOnlyDescription.querySelector("p");
    expect(paragraph).toBeInTheDocument();

    expect(paragraph.innerHTML).toBe(
      "this is a statement\n      this is a statement\n           this is a statement"
    );
  });

  it("Measure MetaData rows renders Measure Reference with description (with html in description) if EnhancedTextFormatting flag is true", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      EnhancedTextFormatting: true,
    }));

    const { getByText } = render(
      <MeasureDefinitionRow
        name="MeasureReference"
        description={testDescriptionWithHtml}
        id={measureDefinitionRowId}
        type="reference"
      />
    );
    const name = getByText("MeasureReference");
    expect(name).toBeInTheDocument();

    const richTextReadOnlyDescription = screen.getByTestId(
      "measure-reference-rich-text-editor"
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
