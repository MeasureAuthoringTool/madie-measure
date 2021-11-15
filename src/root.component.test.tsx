/** @format */

import * as React from "react";
import { render } from "@testing-library/react";
import Root from "./root.component";
import App from "./App";

jest.mock("./components/CreateNewMeasure.tsx");

describe("Root component", () => {
  it("should be in the document", () => {
    const { getByTestId } = render(<Root name="Testapp" />);

    expect(getByTestId(/test/i)).toBeInTheDocument();
  });
});
