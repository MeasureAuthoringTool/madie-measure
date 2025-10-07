import * as React from "react";
import { render } from "@testing-library/react";
import {
  createImportMessage,
  createWarningMessage,
  createShiftTestCaseDatesWarningMessage,
  createMissingDataElementMessage,
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

    const config = createImportMessage(
      testOutcomes,
      1,
      successImportsWithWarnings,
      "test-id"
    );

    expect(config.type).toBe("warning");
    expect(config.copyButton).toBe(true);
    expect(config.canClose).toBe(false);

    const { getByTestId } = render(<div>{config.content}</div>);
    expect(getByTestId("test-id")).toBeInTheDocument();
    expect(getByTestId("failed-test-cases")).toBeInTheDocument();
    expect(getByTestId("success-imports-with-warnings")).toBeInTheDocument();
  });

  it("Creates a warning message configuration object with multiple items", () => {
    const warningMessages = ["Warning 1", "Warning 2"];
    const config = createWarningMessage(warningMessages, "warning-test-id");
    expect(config.type).toBe("warning");
    expect(config.copyButton).toBe(true);
    expect(config.canClose).toBe(false);
    expect(config.alertProps).toEqual({ "data-testid": "warning-test-id" });
    const { getByTestId } = render(<div>{config.content}</div>);
    expect(getByTestId("warning-test-id")).toBeInTheDocument();
    expect(getByTestId("warn-title")).toBeInTheDocument();

    const listItems = getByTestId("warn-title").querySelectorAll("li");
    expect(listItems.length).toBe(2);
    expect(listItems[0]).toHaveTextContent("Warning 1");
    expect(listItems[1]).toHaveTextContent("Warning 2");
  });

  it("Creates a warning message configuration object with a single item", () => {
    const warnings = ["Warning 1"];
    const config = createWarningMessage(
      warnings,
      "shift-single-warning-test-id"
    );

    expect(config.type).toBe("warning");
    expect(config.copyButton).toBe(true);
    expect(config.canClose).toBe(false);
    expect(config.alertProps).toEqual({
      "data-testid": "shift-single-warning-test-id",
    });

    const { getByTestId } = render(<div>{config.content}</div>);
    const warnTitle = getByTestId("warn-title");

    expect(warnTitle).toBeInTheDocument();
    expect(warnTitle).toHaveTextContent("Warning 1");
  });

  it("Creates a shift test case dates message configuration object with multiple items", () => {
    const warningMessages = ["Warning 1", "Warning 2"];
    const config = createShiftTestCaseDatesWarningMessage(
      warningMessages,
      "shift-warning-test-id"
    );

    expect(config.type).toBe("warning");
    expect(config.copyButton).toBe(true);
    expect(config.canClose).toBe(false);
    expect(config.alertProps).toEqual({
      "data-testid": "shift-warning-test-id",
    });

    const { getByTestId } = render(<div>{config.content}</div>);
    expect(getByTestId("shift-warning-test-id")).toBeInTheDocument();
    expect(getByTestId("warn-title")).toBeInTheDocument();

    const listItems = getByTestId("warn-title").querySelectorAll("li");
    expect(listItems.length).toBe(2);
    expect(listItems[0]).toHaveTextContent("Warning 1");
    expect(listItems[1]).toHaveTextContent("Warning 2");
  });

  it("Creates a shift test case dates message configuration object with a single item", () => {
    const warningMessages = ["Warning 1"];
    const config = createShiftTestCaseDatesWarningMessage(
      warningMessages,
      "shift-single-warning-test-id"
    );

    expect(config.type).toBe("warning");
    expect(config.copyButton).toBe(true);
    expect(config.canClose).toBe(false);
    expect(config.alertProps).toEqual({
      "data-testid": "shift-single-warning-test-id",
    });

    const { getByTestId } = render(<div>{config.content}</div>);
    const warnTitle = getByTestId("warn-title");

    expect(warnTitle).toBeInTheDocument();
    const listItems = warnTitle.querySelectorAll("li");
    expect(listItems.length).toBe(1);
    expect(listItems[0]).toHaveTextContent("Warning 1");
  });

  it("renders missing data elements correctly for single and multiple items with preamble", () => {
    // Single item
    const singleItem = ["Data Element 1"];
    const singleConfig = createMissingDataElementMessage(
      singleItem,
      "test_case_missing_data_elements"
    );

    const { getByTestId, rerender } = render(<div>{singleConfig.content}</div>);

    const container = getByTestId("test_case_missing_data_elements");
    expect(container).toHaveTextContent(
      "The following data elements in this test case are no longer relevant to the measure."
    );

    const singleListItems = container.querySelectorAll("li");
    expect(singleListItems.length).toBe(1);
    expect(singleListItems[0]).toHaveTextContent("Data Element 1");

    // Multiple items
    const multipleItems = [
      "Data Element 1",
      "Data Element 2",
      "Data Element 3",
    ];
    const multipleConfig = createMissingDataElementMessage(
      multipleItems,
      "test_case_missing_data_elements"
    );

    rerender(<div>{multipleConfig.content}</div>);

    const multipleContainer = getByTestId("test_case_missing_data_elements");
    expect(multipleContainer).toHaveTextContent(
      "The following data elements in this test case are no longer relevant to the measure."
    );

    const multipleListItems = multipleContainer.querySelectorAll("li");
    expect(multipleListItems.length).toBe(3);
    expect(multipleListItems[0]).toHaveTextContent("Data Element 1");
    expect(multipleListItems[1]).toHaveTextContent("Data Element 2");
    expect(multipleListItems[2]).toHaveTextContent("Data Element 3");
  });
  it("Should handle createWarningMessage when message is not provided", () => {
    const warnings = ["Warning 1", "Warning 2"];
    const config = createWarningMessage(warnings, "no-message-warning-test-id");

    expect(config.type).toBe("warning");
    expect(config.copyButton).toBe(true);
    expect(config.canClose).toBe(false);
    expect(config.alertProps).toEqual({
      "data-testid": "no-message-warning-test-id",
    });

    const { getByTestId } = render(<div>{config.content}</div>);
    const warnTitle = getByTestId("warn-title");

    expect(warnTitle).toBeInTheDocument();
  });
});
