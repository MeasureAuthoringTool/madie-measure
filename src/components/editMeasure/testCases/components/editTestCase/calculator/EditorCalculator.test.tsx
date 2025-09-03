import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditorCalculator from "./EditorCalculator";

describe("Test EditorCalculator component", () => {
  it("should register the calculator event on clicking calculator button", async () => {
    const eventListenerSpy = jest.fn();
    window.addEventListener("toggleEditorCalculatorBox", eventListenerSpy);
    render(<EditorCalculator onClick={eventListenerSpy} />);
    const searchButton = screen.getByRole("button");
    userEvent.click(searchButton);
    expect(eventListenerSpy).toHaveBeenCalled();
  });
});
