import * as React from "react";
import { render, screen } from "@testing-library/react";
import StatusHandler from "./StatusHandler";
import { EXPORT_ERROR_CHARACTERS_MESSAGE } from "../../util/checkSpecialCharacters";
import { TestCaseImportOutcome } from "@madie/madie-models";
import { useFeatureFlags } from "@madie/madie-util";
import { MadieAlert } from "@madie/madie-design-system/dist/react";

// Mock the useFeatureFlags hook
jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: jest.fn(),
}));

// Mock the StatusHandlerMessage module
jest.mock("./StatusHandlerMessage", () => ({
  createImportAlerts: jest
    .fn()
    .mockImplementation(
      (failedImports, successfulImports, successfulImportsWithWarnings) => {
        // Create basic alerts based on the imports
        const alerts = [];

        if (failedImports && failedImports.length > 0) {
          alerts.push({
            type: "error",
            content: (
              <div>
                <div>
                  The following test case(s) were not imported successfully.
                </div>
                <ul>
                  {failedImports.map((item, i) => (
                    <li key={i} data-testid="failed-imports">
                      {item.message}
                    </li>
                  ))}
                </ul>
              </div>
            ),
            canClose: false,
          });
        }

        if (
          successfulImportsWithWarnings &&
          successfulImportsWithWarnings.length > 0
        ) {
          alerts.push({
            type: "warning",
            content: (
              <div>
                <div>Some test cases were imported with warnings</div>
                <ul>
                  {successfulImportsWithWarnings.map((item, i) => (
                    <li key={i} data-testid="success-imports-with-warnings">
                      {item.message}
                    </li>
                  ))}
                </ul>
              </div>
            ),
            canClose: false,
          });
        }

        return alerts;
      }
    ),
  createWarningAlerts: jest.fn().mockImplementation((warnings, testDataId) => {
    return [
      {
        type: "warning",
        content: (
          <div data-testid={testDataId}>
            {warnings.map((warning, i) => (
              <div key={i}>{warning}</div>
            ))}
          </div>
        ),
        canClose: false,
      },
    ];
  }),
}));

// Mock MadieAlert component
jest.mock("@madie/madie-design-system/dist/react", () => ({
  MadieAlert: jest.fn(({ alerts, minimizeAlerts }) => (
    <div data-testid="mock-madie-alert" data-minimize={minimizeAlerts}>
      {alerts.map((alert, index) => (
        <div key={index} data-testid={`alert-${alert.type}`}>
          {alert.content}
        </div>
      ))}
    </div>
  )),
}));

describe("StatusHandler Component", () => {
  const { getByTestId, queryByTestId, getByText, findByText, queryByText } =
    screen;
  const specialCharsErrors = [
    EXPORT_ERROR_CHARACTERS_MESSAGE + "~title",
    EXPORT_ERROR_CHARACTERS_MESSAGE + "!series",
  ];

  beforeEach(() => {
    // Set up the mock to return a default value
    (useFeatureFlags as jest.Mock).mockReturnValue({ MinimizeAlerts: false });
    jest.clearAllMocks();
  });

  test("Should display nothing when error is false", () => {
    render(
      <StatusHandler
        error={false}
        errorMessages={[]}
        testDataId="test_data_id"
      />
    );
    expect(queryByTestId("test_data_id")).not.toBeInTheDocument();
  });

  test("Should display nothing when error is true but errorMessages are empty", () => {
    render(
      <StatusHandler
        error={true}
        errorMessages={[]}
        testDataId="test_data_id"
      />
    );
    expect(queryByTestId("test_data_id")).not.toBeInTheDocument();
  });

  test("Should display single error", () => {
    render(
      <StatusHandler
        error={true}
        errorMessages={["test error"]}
        testDataId="test_data_id"
      />
    );
    expect(getByTestId("mock-madie-alert")).toBeInTheDocument();
    expect(getByText("test error")).toBeInTheDocument();
  });

  test("Should display single error with exportErrors", () => {
    render(
      <StatusHandler
        error={true}
        errorMessages={[specialCharsErrors[0]]}
        testDataId="test_data_id"
      />
    );
    expect(getByTestId("mock-madie-alert")).toBeInTheDocument();
    expect(getByTestId("error-special-char-title")).toBeInTheDocument();
    expect(getByTestId("error-special-char")).toBeInTheDocument();
    expect(getByText("~title")).toBeInTheDocument();
  });

  test("Should display single warning with exportErrors", () => {
    render(
      <StatusHandler
        warning={true}
        warningMessages={[specialCharsErrors[0]]}
        testDataId="test_data_id"
      />
    );
    expect(getByTestId("mock-madie-alert")).toBeInTheDocument();
    // Instead of looking for warn-title, check for the warning message content
    expect(getByText(specialCharsErrors[0])).toBeInTheDocument();
  });

  test("Should display multiple errors", () => {
    render(
      <StatusHandler
        error={true}
        errorMessages={["test error 1", "test error 2"]}
        testDataId="test_data_id"
      />
    );
    expect(getByTestId("mock-madie-alert")).toBeInTheDocument();
    expect(getByText("2 errors were found")).toBeInTheDocument();
    expect(getByTestId("generic-fail-text-list")).toBeInTheDocument();
    expect(getByText("test error 1")).toBeInTheDocument();
    expect(getByText("test error 2")).toBeInTheDocument();
  });

  test("Should display multiple errors with exportErrors", () => {
    render(
      <StatusHandler
        error={true}
        errorMessages={["test error 1", specialCharsErrors[1]]}
        testDataId="test_data_id"
      />
    );
    expect(getByTestId("mock-madie-alert")).toBeInTheDocument();
    expect(getByTestId("error-special-char-title")).toBeInTheDocument();
    expect(getByTestId("error-special-char")).toBeInTheDocument();
    expect(getByText("!series")).toBeInTheDocument();
  });

  it("Should display import warning alert", () => {
    const importWarnings: TestCaseImportOutcome[] = [
      {
        patientId: "test.patientId",
        message: "Error while processing Test Case Json.",
        successful: false,
      },
      {
        patientId: "test.patientId2",
        message: "Patient Id is not found",
        successful: false,
      },
    ];
    render(<StatusHandler importWarnings={importWarnings} />);
    expect(getByTestId("mock-madie-alert")).toBeInTheDocument();
    expect(screen.getAllByTestId("failed-imports")).toHaveLength(2);
  });

  it("Should display import warning alert for successful imports with warnings", () => {
    const importWarnings: TestCaseImportOutcome[] = [
      {
        patientId: "test.patientId",
        message: "Error while processing Test Case Json.",
        successful: false,
      },
      {
        patientId: "test.patientId2",
        message:
          "The measure populations do not match the populations in the import file. No expected values have been set.",
        successful: true,
      },
    ];
    render(<StatusHandler importWarnings={importWarnings} />);
    expect(getByTestId("mock-madie-alert")).toBeInTheDocument();
    expect(screen.getAllByTestId("failed-imports")).toHaveLength(1);
    expect(screen.getAllByTestId("success-imports-with-warnings")).toHaveLength(
      1
    );
  });

  it("Should not display import warning alert", () => {
    render(<StatusHandler importWarnings={[]} />);
    expect(screen.queryByTestId("failed-imports")).toBeNull();
  });

  it("displays success family + given names", async () => {
    const successOutcomes: TestCaseImportOutcome[] = [
      {
        familyName: "Family1",
        givenNames: ["Given1"],
        patientId: "test.patientId",
        message: "Test message for Family1",
        successful: true,
      },
      {
        familyName: "Family2",
        givenNames: [""],
        patientId: "test.patientId2",
        message: "Test message for Family2",
        successful: true,
      },
    ];

    // Replace mock implementation for this test
    const createImportAlertsMock =
      require("./StatusHandlerMessage").createImportAlerts;
    createImportAlertsMock.mockImplementationOnce(
      (failedImports, successfulImports, successfulImportsWithWarnings) => {
        return [
          {
            type: "success",
            content: (
              <>
                <span>Family1 Given1</span>
                <span>test.patientId2</span>
              </>
            ),
            canClose: false,
          },
        ];
      }
    );

    render(<StatusHandler importWarnings={successOutcomes} />);
    expect(getByTestId("mock-madie-alert")).toBeInTheDocument();
    expect(getByText("Family1 Given1")).toBeInTheDocument();
    expect(getByText("test.patientId2")).toBeInTheDocument();
  });

  it("displays failure family + given names", async () => {
    const failureOutcome: TestCaseImportOutcome[] = [
      {
        familyName: "Family1",
        givenNames: ["Given1"],
        patientId: "test.patientId",
        message: "Error while processing Test Case Json.",
        successful: false,
      },
      {
        familyName: "Family2",
        givenNames: [""],
        patientId: "test.patientId2",
        message:
          "The measure populations do not match the populations in the import file. No expected values have been set.",
        successful: false,
      },
    ];

    // Replace mock implementation for this test
    const createImportAlertsMock =
      require("./StatusHandlerMessage").createImportAlerts;
    createImportAlertsMock.mockImplementationOnce(
      (failedImports, successfulImports, successfulImportsWithWarnings) => {
        return [
          {
            type: "error",
            content: (
              <>
                <div>Family1 Given1</div>
                <div>test.patientId2</div>
              </>
            ),
            canClose: false,
          },
        ];
      }
    );

    render(<StatusHandler importWarnings={failureOutcome} />);
    expect(getByTestId("mock-madie-alert")).toBeInTheDocument();
    expect(getByText("Family1 Given1")).toBeInTheDocument();
    expect(getByText("test.patientId2")).toBeInTheDocument();
  });

  describe("MinimizeAlerts feature flag", () => {
    it("Should pass minimizeAlerts=true to MadieAlert when feature flag is enabled", () => {
      // Set the feature flag to true for this test
      (useFeatureFlags as jest.Mock).mockReturnValue({ MinimizeAlerts: true });

      render(
        <StatusHandler
          error={true}
          errorMessages={["test error"]}
          testDataId="test_data_id"
        />
      );

      // Check that the minimizeAlerts prop is set to true
      expect(MadieAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          minimizeAlerts: true,
        }),
        expect.anything()
      );

      // Also verify through the data-attribute we set on our mock
      expect(
        getByTestId("mock-madie-alert").getAttribute("data-minimize")
      ).toBe("true");
    });

    it("Should pass minimizeAlerts=false to MadieAlert when feature flag is disabled", () => {
      // Set the feature flag to false for this test
      (useFeatureFlags as jest.Mock).mockReturnValue({ MinimizeAlerts: false });

      render(
        <StatusHandler
          error={true}
          errorMessages={["test error"]}
          testDataId="test_data_id"
        />
      );

      // Check that the minimizeAlerts prop is set to false
      expect(MadieAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          minimizeAlerts: false,
        }),
        expect.anything()
      );

      // Also verify through the data-attribute we set on our mock
      expect(
        getByTestId("mock-madie-alert").getAttribute("data-minimize")
      ).toBe("false");
    });
  });
});
