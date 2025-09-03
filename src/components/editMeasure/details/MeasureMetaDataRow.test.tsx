import * as React from "react";
import { render, cleanup, screen } from "@testing-library/react";
import MeasureMetaDataRow from "./MeasureMetaDataRow";

afterEach(cleanup);

const testDescription = `this is a statement\n      this is a statement\n           this is a statement`;
const testDescriptionWithHtml = `<p>this is a statement</p><p><strong>this is a statement</strong></p><p><u>this is a statement</u></p>`;
const measureDefinitionRowId = "cdbf1bb6-2c18-4edb-ae57-123a1f263633";

describe("Measure MetaData Row Component", () => {
  it("renders Measure Reference with plain text description", async () => {
    render(
      <table>
        <tbody>
          <MeasureMetaDataRow
            name="MeasureReference"
            description={testDescription}
            id={measureDefinitionRowId}
            type="reference"
          />
        </tbody>
      </table>
    );
    const cell = screen.getByTestId(`MeasureReference-value`);
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveTextContent("this is a statement");
  });

  it("renders Measure Reference with html description", async () => {
    render(
      <table>
        <tbody>
          <MeasureMetaDataRow
            name="MeasureReference"
            description={testDescriptionWithHtml}
            id={measureDefinitionRowId}
            type="reference"
          />
        </tbody>
      </table>
    );
    const cell = screen.getByTestId(`MeasureReference-value`);
    expect(cell).toBeInTheDocument();
    expect(cell.innerHTML).toContain("<p>this is a statement</p>");
  });

  it("renders edit/delete actions when canEdit", async () => {
    const handleClick = jest.fn();
    render(
      <table>
        <tbody>
          <MeasureMetaDataRow
            name="MeasureReference"
            description={testDescription}
            id={measureDefinitionRowId}
            type="reference"
            canEdit={true}
            handleClick={handleClick}
          />
        </tbody>
      </table>
    );
    expect(
      screen.getByTestId(`edit-measure-reference-${measureDefinitionRowId}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`delete-measure-reference-${measureDefinitionRowId}`)
    ).toBeInTheDocument();
  });
});
