import * as React from "react";
import { render, screen } from "@testing-library/react";
import {
  createImportMessage,
  createImportAlerts,
  createWarningMessage,
  createWarningAlerts,
} from "./StatusHandlerMessage";
import { TestCaseImportOutcome } from "@madie/madie-models";

describe("StatusHandler Messages", () => {
  it("Creates an import message", () => {
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

  it("Creates import alerts", () => {
    const testOutcomes: TestCaseImportOutcome[] = [
      {
        familyName: "Judith",
        givenNames: ["Raoul", "Beth"],
        patientId: "666",
        message: "You're a message",
        successful: false,
      } as unknown as TestCaseImportOutcome,
    ];

    const alerts = createImportAlerts([], 1, testOutcomes, "test");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("warning");
    expect(alerts[0].copyButton).toBe(true);
    expect(alerts[0].canClose).toBe(false);

    render(<div>{alerts[0].content}</div>);
    expect(screen.getByTestId("test")).toBeInTheDocument();
    expect(
      screen.getByTestId("success-imports-with-warnings")
    ).toBeInTheDocument();
  });

  it("Creates a warning message", () => {
    const warnings = ["Warning 1", "Warning 2"];
    render(createWarningMessage(warnings, "warning-test"));
    const rootElement = screen.getByTestId("warning-test");
    expect(rootElement).toBeInTheDocument();
    expect(screen.getByTestId("warn-title")).toBeInTheDocument();
  });

  it("Creates warning alerts", () => {
    const warnings = ["Warning 1", "Warning 2"];
    const alerts = createWarningAlerts(warnings, "warning-test");

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("warning");
    expect(alerts[0].copyButton).toBe(true);
    expect(alerts[0].canClose).toBe(false);

    render(<div>{alerts[0].content}</div>);
    expect(screen.getByTestId("warning-test")).toBeInTheDocument();
    expect(screen.getByTestId("warn-title")).toBeInTheDocument();
  });
});
