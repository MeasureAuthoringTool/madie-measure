import {
  executionBundlePreparationErrorMessage,
  profileMismatchErrorMessageEditView,
  profileMismatchErrorMessageListView,
  resolveTestCaseExecutionErrorMessage,
  syntaxErrorMessage,
} from "./TestCaseExecutionErrorUtils";

describe("resolveTestCaseExecutionErrorMessage", () => {
  const elmJson = JSON.stringify({
    library: {
      statements: {
        def: [
          {
            name: "Patient",
            expression: {
              operand: {
                templateId:
                  "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
              },
            },
          },
        ],
      },
    },
  });

  it("returns list-view profile mismatch message when error matches profileMismatchRegex", () => {
    const error = {
      message:
        "Execution failed. Please ensure that meta.profile is properly set on the Patient resource before running test cases.",
    };

    expect(resolveTestCaseExecutionErrorMessage(error, elmJson, true)).toBe(
      profileMismatchErrorMessageListView(
        "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient"
      )
    );
  });

  it("returns edit-view profile mismatch message when error matches profileMismatchRegex", () => {
    const error = {
      message:
        "Execution failed. Please ensure that meta.profile is properly set on the Patient resource before running test cases.",
    };

    expect(resolveTestCaseExecutionErrorMessage(error, elmJson, false)).toBe(
      profileMismatchErrorMessageEditView(
        "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient"
      )
    );
  });

  it("returns bundle preparation message when error includes filtering resource", () => {
    const error = {
      message: "Error filtering resource due to unresolved references",
    };

    expect(resolveTestCaseExecutionErrorMessage(error, elmJson, true)).toBe(
      executionBundlePreparationErrorMessage
    );
  });

  it("returns syntax error message when error is an instance of SyntaxError", () => {
    const error = new SyntaxError(
      "Error filtering resource due to unresolved references"
    );

    expect(resolveTestCaseExecutionErrorMessage(error, elmJson, false)).toBe(
      syntaxErrorMessage
    );
  });
});
