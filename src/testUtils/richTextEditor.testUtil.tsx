import { act, fireEvent } from "@testing-library/react";

export const updateRichText = async (editor: HTMLElement, value: string) => {
  await act(async () => {
    fireEvent.focus(editor);
    editor.innerHTML = value;
    fireEvent.input(editor, { target: { innerHTML: value } });
    fireEvent.blur(editor);
  });
};
