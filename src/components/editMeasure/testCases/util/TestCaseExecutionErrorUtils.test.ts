import {
  executionBundlePreparationErrorMessage,
  profileMismatchErrorMessage,
  resolveTestCaseExecutionErrorMessage,
  syntaxErrorMessage,
} from "./TestCaseExecutionErrorUtils";

describe("resolveTestCaseExecutionErrorMessage", () => {
  it("returns profile mismatch message when error matches profileMismatchRegex", () => {
    const error = {
      message:
        "Execution failed. Please ensure that meta.profile is properly set on the Patient resource before running test cases.",
    };

    expect(resolveTestCaseExecutionErrorMessage(error)).toBe(
      profileMismatchErrorMessage
    );
  });

  it("returns bundle preparation message when error includes filtering resource", () => {
    const error = {
      message: "Error filtering resource due to unresolved references",
    };

    expect(resolveTestCaseExecutionErrorMessage(error)).toBe(
      executionBundlePreparationErrorMessage
    );
  });

  it("returns syntax error message when error is an instance of SyntaxError", () => {
    const error = new SyntaxError(
      "Error filtering resource due to unresolved references"
    );

    expect(resolveTestCaseExecutionErrorMessage(error)).toBe(
      syntaxErrorMessage
    );
  });
});
