import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import NewMeasure from "../NewMeasure/NewMeasure";

test("shows the children when the checkbox is checked", () => {
  const testMessage = "New Measure";
  render(<NewMeasure />);

  expect(screen.getByTestId("create-new-measure-button")).toBeTruthy();
});
