import * as React from "react";
import { render, screen } from "@testing-library/react";
import AutoComplete from "./AutoComplete";

describe("AutoComplete Component", () => {
  test("Should render with all default props", () => {
    render(
      <AutoComplete
        id="autocomplete"
        label="autocomplete-label"
        //   placeHolder = undefined,
        //   defaultValue = undefined,
        //   required = false,
        //   disabled = false,
        //   error = false,
        //   helperText = undefined,
        //   options = [],
      />
    );

    const autocomplete = screen.getByTestId("autocomplete-combo-box");
    expect(autocomplete).toBeInTheDocument();
  });
});
