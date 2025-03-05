import * as React from "react";
import { render, screen } from "@testing-library/react";
import { createImportMessage } from "./StatusHandlerMessage";
import { TestCaseImportOutcome } from "@madie/madie-models";

describe("StatusHandler Messages", () => {
  it("Creates a message", () => {
    const testOutcomes: TestCaseImportOutcome[] = [
      {
        familyName: "Judith",
        givenNames: ["Raoul", "Beth"],
        patientId: "666",
        message: "You're a message",
        successful: false,
      } as unknown as TestCaseImportOutcome,
    ];
    render(createImportMessage([], 1, testOutcomes, "test"));
    const rootElement = screen.getByTestId("test");
    expect(rootElement).toBeInTheDocument();
    expect(
      screen.getByTestId("success-imports-with-warnings")
    ).toBeInTheDocument();
  });
});
