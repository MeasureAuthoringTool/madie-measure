import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditorSearch from "./EditorSearch";

describe("Test SearchEditor component", () => {
  it("should register the search event on clicking search button", async () => {
    const eventListenerSpy = jest.fn();
    window.addEventListener("toggleEditorSearchBox", eventListenerSpy);
    render(<EditorSearch />);
    const searchButton = screen.getByRole("button");
    userEvent.click(searchButton);
    expect(eventListenerSpy).toHaveBeenCalled();
  });
});
