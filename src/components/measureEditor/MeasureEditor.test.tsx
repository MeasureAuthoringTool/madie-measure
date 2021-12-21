import { fireEvent, render } from "@testing-library/react";
import * as React from "react";
import MeasureEditor from "./MeasureEditor";

describe("MeasureEditor component", () => {
  it("should mount measure editor component", async () => {
    const { getByTestId } = render(<MeasureEditor />);
    fireEvent.click(getByTestId("measure-editor"));
    const editorValdivEl: HTMLElement = await getByTestId("measure-editor");
    expect(editorValdivEl.innerHTML).toEqual(
      "library testCql version '1.0.000'"
    );
    expect(localStorage.getItem("editorVal")).toEqual(
      "library testCql version '1.0.000'"
    );
  });
});
