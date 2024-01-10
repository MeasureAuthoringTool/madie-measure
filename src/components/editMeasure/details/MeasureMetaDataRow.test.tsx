import * as React from "react";
import { render, cleanup } from "@testing-library/react";
import MeasureDefinitionRow from "./MeasureMetaDataRow";

afterEach(cleanup);

describe("Measure MetaData Row Component", () => {
  it("Measure MetaData rows renders at all", async () => {
    const { getByText } = render(
      <MeasureDefinitionRow name="name" description="description" />
    );
    const name = getByText("name");
    expect(name).toBeInTheDocument();
    const description = getByText("description");
    expect(description).toBeInTheDocument();
  });
});
