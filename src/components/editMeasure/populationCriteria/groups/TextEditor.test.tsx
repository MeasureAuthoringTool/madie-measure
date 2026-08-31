import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import TextEditor from "./TextEditor";

jest.mock("@madie/madie-design-system/dist/react", () => ({
  RichTextEditor: jest.requireActual(
    "../../../../testUtils/mockRichTextEditor.testUtil"
  ).MockRichTextEditor,
}));

describe("TextEditor", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderEditor = (setFieldValue: jest.Mock) =>
    render(
      <TextEditor
        name="description"
        value="initial value"
        label="Description"
        setFieldValue={setFieldValue}
        onBlur={jest.fn()}
      />
    );

  test("updates the form value after the debounce interval", () => {
    const setFieldValue = jest.fn();
    renderEditor(setFieldValue);
    act(() => jest.advanceTimersByTime(250));
    setFieldValue.mockClear();

    const editor = screen.getByRole("textbox", { name: "Description" });
    act(() => {
      editor.innerHTML = "updated value";
      fireEvent.input(editor, {
        target: { innerHTML: "updated value" },
      });
    });

    act(() => jest.advanceTimersByTime(249));
    expect(setFieldValue).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(1));
    expect(setFieldValue).toHaveBeenCalledWith(
      "description",
      "<p>updated value</p>"
    );
  });

  test.each(["<p></p>", "<p><br></p>"])(
    "normalizes empty rich text: %s",
    (emptyHtml) => {
      const setFieldValue = jest.fn();
      renderEditor(setFieldValue);
      act(() => jest.advanceTimersByTime(250));
      setFieldValue.mockClear();

      const editor = screen.getByRole("textbox", { name: "Description" });
      act(() => {
        editor.innerHTML = emptyHtml;
        fireEvent.input(editor, { target: { innerHTML: emptyHtml } });
      });
      act(() => jest.advanceTimersByTime(250));

      expect(setFieldValue).toHaveBeenCalledWith("description", "");
    }
  );
});
