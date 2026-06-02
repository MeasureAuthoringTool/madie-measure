import {
  createUnresolvedPatientReferenceWarningDetails,
  extractUnresolvedPatientReferenceResourceIds,
  upsertExecuteInvalidTestCaseWarning,
} from "./EditTestCaseUtil";
import {
  EXECUTE_INVALID_TEST_CASES_WARNING,
  EXECUTE_INVALID_TEST_WARNING_TEST_DATA_ID,
} from "../../testCaseConfiguration/executionOptions/ExecutionOptions";

describe("extractUnresolvedPatientReferenceResourceIds", () => {
  it("returns matching unresolved patient reference resource ids", () => {
    const validationErrors = [
      {
        diagnostics:
          "Resource [Patient/123e4567-e89b-12d3-a456-426614174000] contains a reference that does not resolve within the bundle",
      },
      {
        diagnostics: "Some other validation warning",
      },
    ];

    expect(
      extractUnresolvedPatientReferenceResourceIds(validationErrors)
    ).toEqual(["Patient/123e4567-e89b-12d3-a456-426614174000"]);
  });

  it("returns unique resource ids when duplicates are present", () => {
    const unresolvedWarningDiagnostics =
      "Resource [Patient/123e4567-e89b-12d3-a456-426614174000] contains a reference that does not resolve within the bundle";

    const validationErrors = [
      { diagnostics: unresolvedWarningDiagnostics },
      { diagnostics: unresolvedWarningDiagnostics },
    ];

    expect(
      extractUnresolvedPatientReferenceResourceIds(validationErrors)
    ).toEqual(["Patient/123e4567-e89b-12d3-a456-426614174000"]);
  });

  it("returns an empty array when no matching diagnostics are present", () => {
    const validationErrors = [
      { diagnostics: "Warning: unexpected profile" },
      { diagnostics: "Error: invalid code" },
    ];

    expect(
      extractUnresolvedPatientReferenceResourceIds(validationErrors)
    ).toEqual([]);
  });
});

describe("createUnresolvedPatientReferenceWarningDetails", () => {
  it("creates unique warning details from unresolved resource ids", () => {
    const validationErrors = [
      {
        diagnostics:
          "Resource [Patient/123e4567-e89b-12d3-a456-426614174000] contains a reference that does not resolve within the bundle",
      },
      {
        diagnostics:
          "Resource [Patient/123e4567-e89b-12d3-a456-426614174000] contains a reference that does not resolve within the bundle",
      },
    ];

    const warningDetails = createUnresolvedPatientReferenceWarningDetails(
      validationErrors,
      (resourceId) => `Resource ${resourceId} does not resolve in the bundle`
    );

    expect(warningDetails).toEqual([
      "Resource Patient/123e4567-e89b-12d3-a456-426614174000 does not resolve in the bundle",
    ]);
  });
});

describe("upsertExecuteInvalidTestCaseWarning", () => {
  it("removes old execute-invalid warning and prepends latest warning", () => {
    const setCustomWarningMessages = jest.fn();
    const warningDetails = ["Resource Patient/123 has unresolved reference"];

    upsertExecuteInvalidTestCaseWarning(
      setCustomWarningMessages,
      warningDetails
    );

    const stateUpdater = setCustomWarningMessages.mock.calls[0][0];
    const nextState = stateUpdater([
      { message: "Keep this", testDataId: "other-warning" },
      {
        message: "Old execute warning",
        details: ["old"],
        testDataId: EXECUTE_INVALID_TEST_WARNING_TEST_DATA_ID,
      },
    ]);

    expect(nextState).toEqual([
      {
        message: EXECUTE_INVALID_TEST_CASES_WARNING,
        details: warningDetails,
        testDataId: EXECUTE_INVALID_TEST_WARNING_TEST_DATA_ID,
      },
      { message: "Keep this", testDataId: "other-warning" },
    ]);
  });

  it("clears execute-invalid warning when details are empty", () => {
    const setCustomWarningMessages = jest.fn();

    upsertExecuteInvalidTestCaseWarning(setCustomWarningMessages, []);

    const stateUpdater = setCustomWarningMessages.mock.calls[0][0];
    const nextState = stateUpdater([
      {
        message: "Old execute warning",
        details: ["old"],
        testDataId: EXECUTE_INVALID_TEST_WARNING_TEST_DATA_ID,
      },
      { message: "Keep this", testDataId: "other-warning" },
    ]);

    expect(nextState).toEqual([
      { message: "Keep this", testDataId: "other-warning" },
    ]);
  });
});
