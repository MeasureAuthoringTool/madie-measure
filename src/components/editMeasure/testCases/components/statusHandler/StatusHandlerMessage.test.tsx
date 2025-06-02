import * as React from "react";
import { render, screen } from "@testing-library/react";
import {
  createImportMessageConfig,
  createWarningMessageConfig,
} from "./StatusHandlerMessage";
import { TestCaseImportOutcome } from "@madie/madie-models";

describe("StatusHandler Messages", () => {
  it("Creates an import message configuration object", () => {
    const testOutcomes: TestCaseImportOutcome[] = [
      {
        familyName: "Judith",
        givenNames: ["Raoul", "Beth"],
        patientId: "666",
        message: "You're a message",
        successful: false,
      } as unknown as TestCaseImportOutcome,
    ];

    const successImportsWithWarnings: TestCaseImportOutcome[] = [
      {
        familyName: "Smith",
        givenNames: ["John"],
        patientId: "123",
        message: "Some warning message",
        successful: true,
      } as unknown as TestCaseImportOutcome,
    ];

    const config = createImportMessageConfig(
      testOutcomes,
      1,
      successImportsWithWarnings,
      "test-id"
    );

    // Verify configuration properties
    expect(config.type).toBe("warning");
    expect(config.copyButton).toBe(true);
    expect(config.canClose).toBe(false);

    // Render the content to test its structure
    const { getByTestId } = render(<div>{config.content}</div>);
    expect(getByTestId("test-id")).toBeInTheDocument();
    expect(getByTestId("failed-test-cases")).toBeInTheDocument();
    expect(getByTestId("success-imports-with-warnings")).toBeInTheDocument();
  });

  it("Creates a warning message configuration object", () => {
    const warningMessages = ["Warning 1", "Warning 2"];
    const config = createWarningMessageConfig(
      warningMessages,
      "warning-test-id"
    );

    // Verify configuration properties
    expect(config.type).toBe("warning");
    expect(config.copyButton).toBe(true);
    expect(config.canClose).toBe(false);
    expect(config.alertProps).toEqual({ "data-testid": "warning-test-id" });

    // Render the content to test its structure
    const { getByTestId } = render(<div>{config.content}</div>);
    expect(getByTestId("warning-test-id")).toBeInTheDocument();
    expect(getByTestId("warn-title")).toBeInTheDocument();

    // Verify list items are rendered
    const listItems = getByTestId("warn-title").querySelectorAll("li");
    expect(listItems.length).toBe(2);
    expect(listItems[0]).toHaveTextContent("Warning 1");
    expect(listItems[1]).toHaveTextContent("Warning 2");
  });
});
