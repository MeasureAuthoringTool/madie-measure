import * as React from "react";
import { render, screen } from "@testing-library/react";
import {
  createImportAlerts,
  createWarningAlerts,
} from "./StatusHandlerMessage";
import { TestCaseImportOutcome } from "@madie/madie-models";

describe("StatusHandler Messages", () => {
  describe("createWarningAlerts", () => {
    it("creates warning alerts with the correct structure", () => {
      const warnings = ["Warning 1", "Warning 2"];
      const alerts = createWarningAlerts(warnings, "warning-test");

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("warning");
      expect(alerts[0].copyButton).toBe(true);
      expect(alerts[0].canClose).toBe(false);

      render(<div>{alerts[0].content}</div>);
      expect(screen.getByTestId("warning-test")).toBeInTheDocument();
      expect(screen.getByTestId("warn-title")).toBeInTheDocument();

      // Check that both warnings are in the document
      expect(screen.getByText("Warning 1")).toBeInTheDocument();
      expect(screen.getByText("Warning 2")).toBeInTheDocument();
    });

    it("correctly displays the warning message text", () => {
      const warnings = ["Date shift failed"];
      const alerts = createWarningAlerts(warnings, "warning-test");

      render(<div>{alerts[0].content}</div>);
      expect(
        screen.getByText(/The following Test Case dates could not be shifted/)
      ).toBeInTheDocument();
      expect(screen.getByText("Date shift failed")).toBeInTheDocument();
    });
  });

  describe("createImportAlerts", () => {
    it("creates import alerts with the correct structure", () => {
      const testOutcomes: TestCaseImportOutcome[] = [
        {
          familyName: "Judith",
          givenNames: ["Raoul", "Beth"],
          patientId: "666",
          message: "You're a message",
          successful: false,
        } as unknown as TestCaseImportOutcome,
      ];

      const alerts = createImportAlerts(testOutcomes, 2, [], "test");
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("warning");
      expect(alerts[0].copyButton).toBe(true);
      expect(alerts[0].canClose).toBe(false);

      render(<div>{alerts[0].content}</div>);
      expect(screen.getByTestId("test")).toBeInTheDocument();
      expect(screen.getByTestId("failed-test-cases")).toBeInTheDocument();
      expect(
        screen.getByText(/\(2\) test case\(s\) were imported/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/\(1\) test case\(s\) could not be imported/)
      ).toBeInTheDocument();
    });

    it("displays patient information correctly for failed imports", () => {
      const testOutcomes: TestCaseImportOutcome[] = [
        {
          familyName: "Judith",
          givenNames: ["Raoul", "Beth"],
          patientId: "666",
          message: "Invalid format",
          successful: false,
        } as unknown as TestCaseImportOutcome,
      ];

      const alerts = createImportAlerts(testOutcomes, 0, [], "test");
      render(<div>{alerts[0].content}</div>);

      expect(screen.getByText(/Judith Raoul,Beth/)).toBeInTheDocument();
      expect(screen.getByText(/Reason: Invalid format/)).toBeInTheDocument();
    });

    it("displays successful imports with warnings", () => {
      const testOutcomes: TestCaseImportOutcome[] = [
        {
          familyName: "Smith",
          givenNames: ["John"],
          patientId: "123",
          message: "missing some optional fields",
          successful: true,
        } as unknown as TestCaseImportOutcome,
      ];

      const alerts = createImportAlerts([], 1, testOutcomes, "test");
      render(<div>{alerts[0].content}</div>);

      expect(
        screen.getByTestId("success-imports-with-warnings")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Following test case\(s\) were imported successfully/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/missing some optional fields/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Smith John/)).toBeInTheDocument();
    });

    it("handles cases where family name and given names are missing", () => {
      const testOutcomes: TestCaseImportOutcome[] = [
        {
          patientId: "999",
          message: "Missing name data",
          successful: false,
        } as unknown as TestCaseImportOutcome,
      ];

      const alerts = createImportAlerts(testOutcomes, 0, [], "test");
      render(<div>{alerts[0].content}</div>);

      // Should use patientId when name is missing
      expect(screen.getByText(/999/)).toBeInTheDocument();
    });

    it("handles both failed imports and successful imports with warnings", () => {
      const failedImports: TestCaseImportOutcome[] = [
        {
          familyName: "Doe",
          givenNames: ["Jane"],
          patientId: "111",
          message: "Invalid data",
          successful: false,
        } as unknown as TestCaseImportOutcome,
      ];

      const successfulWithWarnings: TestCaseImportOutcome[] = [
        {
          familyName: "Smith",
          givenNames: ["John"],
          patientId: "222",
          message: "Some fields could not be imported",
          successful: true,
        } as unknown as TestCaseImportOutcome,
      ];

      const alerts = createImportAlerts(
        failedImports,
        2,
        successfulWithWarnings,
        "test"
      );
      render(<div>{alerts[0].content}</div>);

      // Check for failed imports section
      expect(
        screen.getByText(/\(2\) test case\(s\) were imported/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Doe Jane/)).toBeInTheDocument();
      expect(screen.getByText(/Reason: Invalid data/)).toBeInTheDocument();

      // Check for successful with warnings section
      expect(
        screen.getByText(/Following test case\(s\) were imported successfully/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Some fields could not be imported/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Smith John/)).toBeInTheDocument();
    });
  });
});
