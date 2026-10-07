import * as React from "react";
import Editor from "./Editor";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@madie/madie-editor", () => {
  const React = require("react");
  return {
    MadieJsonEditor: ({ value, onChange, readOnly }) =>
      React.createElement("textarea", {
        role: "textbox",
        value: value || "",
        readOnly: Boolean(readOnly),
        onChange: (event) => onChange?.(event.target.value),
      }),
  };
});

describe("Test Case Editor component", () => {
  it("should render Editor Component", () => {
    const handleChange = jest.fn();
    const container = render(
      <Editor value={""} height="500px" onChange={handleChange} />
    );
    expect(container).toBeDefined();
  });

  it("calls handleChange on change", async () => {
    const handleValueChanges = jest.fn();

    render(<Editor value="" height="500px" onChange={handleValueChanges} />);

    const monacoTextArea = screen.getByRole("textbox");
    await userEvent.paste(monacoTextArea, "this is invalid CQL");

    expect(handleValueChanges).toBeCalledWith("this is invalid CQL");
  });
});
