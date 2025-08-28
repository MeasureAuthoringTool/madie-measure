import * as React from "react";
import { render, screen } from "@testing-library/react";
import StatusHandler from "./StatusHandler";
import { EXPORT_ERROR_CHARACTERS_MESSAGE } from "../../util/checkSpecialCharacters";
import { TestCaseImportOutcome } from "@madie/madie-models";
import { MadieAlert } from "@madie/madie-design-system/dist/react";

jest.mock("@madie/madie-design-system/dist/react", () => ({
  MadieAlert: jest.fn(({ alerts, minimizeAlerts }) => (
    <div data-testid="madie-alert-mock">
      {alerts.map((alert, index) => (
        <div key={index} data-testid={`alert-${index}`} data-type={alert.type}>
          <div data-testid={`alert-content-${index}`}>{alert.content}</div>
        </div>
      ))}
      <div data-testid="minimize-flag">{minimizeAlerts ? "true" : "false"}</div>
    </div>
  )),
}));

const mockUseFeatureFlags = jest.fn();
jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: () => mockUseFeatureFlags(),
}));

describe("StatusHandler Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeatureFlags.mockReturnValue({});
    MadieAlert.mockClear();
  });

  const specialCharsErrors = [
    EXPORT_ERROR_CHARACTERS_MESSAGE + "~title",
    EXPORT_ERROR_CHARACTERS_MESSAGE + "!series",
  ];

  test("Should display nothing when error is false", () => {
    render(
      <StatusHandler
        error={false}
        errorMessages={[]}
        testDataId="test_data_id"
      />
    );
    expect(screen.queryByTestId("madie-alert-mock")).not.toBeInTheDocument();
  });

  test("Should display nothing when error is true but errorMessages are empty", () => {
    render(
      <StatusHandler
        error={true}
        errorMessages={[]}
        testDataId="test_data_id"
      />
    );
    expect(screen.queryByTestId("madie-alert-mock")).not.toBeInTheDocument();
  });

  test("Should display single error with correct configuration", () => {
    render(
      <StatusHandler
        error={true}
        errorMessages={["test error"]}
        testDataId="test_data_id"
      />
    );

    expect(screen.getByTestId("madie-alert-mock")).toBeInTheDocument();
    expect(screen.getByTestId("alert-0")).toHaveAttribute("data-type", "error");
    expect(screen.getByTestId("alert-content-0")).toHaveTextContent(
      "test error"
    );
    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: "error",
            copyButton: true,
            canClose: false,
          }),
        ]),
        minimizeAlerts: true,
      }),
      expect.anything()
    );
  });

  test("Should display single error with exportErrors", () => {
    render(
      <StatusHandler
        error={true}
        errorMessages={[specialCharsErrors[0]]}
        testDataId="test_data_id"
      />
    );

    expect(screen.getByTestId("madie-alert-mock")).toBeInTheDocument();
    expect(screen.getByTestId("alert-0")).toHaveAttribute("data-type", "error");
    expect(screen.getByTestId("error-special-char-title")).toBeInTheDocument();
    expect(screen.getByTestId("error-special-char")).toBeInTheDocument();
    expect(screen.getByText("~title")).toBeInTheDocument();
  });

  test("Should display shiftTestCaseDatesWarning message with correct configuration", () => {
    render(
      <StatusHandler
        warning={true}
        shiftTestCaseDatesWarning={["test warning"]}
        testDataId="test_data_id"
      />
    );

    expect(screen.getByTestId("madie-alert-mock")).toBeInTheDocument();
    expect(screen.getByTestId("alert-0")).toHaveAttribute(
      "data-type",
      "warning"
    );
    expect(screen.getByTestId("warn-title")).toBeInTheDocument();

    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: "warning",
            copyButton: true,
            canClose: false,
          }),
        ]),
        minimizeAlerts: true,
      }),
      expect.anything()
    );
  });

  test("Should display warning message with correct configuration", () => {
    render(
      <StatusHandler
        warning={true}
        warningMessages={["test warning"]}
        testDataId="test_data_id"
      />
    );

    expect(screen.getByTestId("madie-alert-mock")).toBeInTheDocument();
    expect(screen.getByTestId("alert-0")).toHaveAttribute(
      "data-type",
      "warning"
    );
    expect(screen.getByTestId("warn-title")).toBeInTheDocument();

    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: "warning",
            copyButton: true,
            canClose: false,
          }),
        ]),
        minimizeAlerts: true,
      }),
      expect.anything()
    );
  });

  test("Should display multiple errors with correct configuration", () => {
    render(
      <StatusHandler
        error={true}
        errorMessages={["test error 1", "test error 2"]}
        testDataId="test_data_id"
      />
    );

    expect(screen.getByTestId("madie-alert-mock")).toBeInTheDocument();
    expect(screen.getByTestId("alert-0")).toHaveAttribute("data-type", "error");
    expect(screen.getByText("2 errors were found")).toBeInTheDocument();
    expect(screen.getByTestId("generic-fail-text-list")).toBeInTheDocument();
    expect(screen.getByText("test error 1")).toBeInTheDocument();
    expect(screen.getByText("test error 2")).toBeInTheDocument();
  });

  test("Should pass multiple alerts to MadieAlert when multiple types are present", () => {
    render(
      <StatusHandler
        error={true}
        warning={true}
        errorMessages={["test error"]}
        warningMessages={["test warning"]}
        testDataId="test_data_id"
      />
    );

    expect(screen.getByTestId("madie-alert-mock")).toBeInTheDocument();
    expect(screen.getByTestId("alert-0")).toHaveAttribute("data-type", "error");
    expect(screen.getByTestId("alert-1")).toHaveAttribute(
      "data-type",
      "warning"
    );
    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({ type: "error" }),
          expect.objectContaining({ type: "warning" }),
        ]),
        minimizeAlerts: true,
      }),
      expect.anything()
    );
  });

  test("Should pass minimizeAlerts flag from feature flags", () => {
    mockUseFeatureFlags.mockReturnValue({ MinimizeAlerts: true });

    render(
      <StatusHandler
        error={true}
        errorMessages={["test error"]}
        testDataId="test_data_id"
      />
    );

    expect(screen.getByTestId("minimize-flag")).toHaveTextContent("true");
    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        minimizeAlerts: true,
      }),
      expect.anything()
    );
  });

  it("Should display import warning alert with correct configuration", () => {
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

    expect(screen.getByTestId("madie-alert-mock")).toBeInTheDocument();
    expect(screen.getByTestId("alert-0")).toHaveAttribute(
      "data-type",
      "warning"
    );
    expect(screen.getAllByTestId("failed-test-cases")).toHaveLength(2);

    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: "warning",
            copyButton: true,
            canClose: false,
          }),
        ]),
      }),
      expect.anything()
    );
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
    expect(screen.getAllByTestId("failed-test-cases")).toHaveLength(1);
    expect(screen.getAllByTestId("success-imports-with-warnings")).toHaveLength(
      1
    );
  });

  it("Should not display import warning alert", () => {
    render(<StatusHandler importWarnings={[]} />);
    expect(screen.queryByTestId("failed-test-cases")).toBeNull();
  });

  it("displays success family + given names", async () => {
    const successOutcomes: TestCaseImportOutcome[] = [
      {
        familyName: "Family1",
        givenNames: ["Given1"],
        patientId: "test.patientId",
        message: "Error while processing Test Case Json.",
        successful: true,
      },
      {
        familyName: "Family2",
        givenNames: [""],
        patientId: "test.patientId2",
        message:
          "The measure populations do not match the populations in the import file. No expected values have been set.",
        successful: true,
      },
    ];
    render(<StatusHandler importWarnings={successOutcomes} />);
    const name = await screen.findByText("Family1 Given1");
    expect(name).toBeInTheDocument();
    const name1 = await screen.findByText("test.patientId2");
    expect(name1).toBeInTheDocument();
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
    render(<StatusHandler importWarnings={failureOutcome} />);
    const name = await screen.findByText("Family1 Given1");
    expect(name).toBeInTheDocument();
    const name1 = await screen.findByText("test.patientId2");
    expect(name1).toBeInTheDocument();
  });
});
