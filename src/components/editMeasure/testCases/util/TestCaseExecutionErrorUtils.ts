export const profileMismatchRegex =
  /Please ensure that meta.profile is properly set on the Patient resource/;

export const profileMismatchErrorMessage =
  "Test case execution failed. One or more Patient resources are missing the required profile or have a profile that does not correspond to the measure model. Please verify that the Patient resource(s) includes the correct profile for the selected measure model and try again.";

export const executionBundlePreparationErrorMessage =
  "An error occurred while preparing the test case execution bundle. Please try again. If the issue continues, please contact helpdesk.";

export const syntaxErrorMessage =
  "Some test cases could not be executed due to syntax errors in their definitions. Please review and correct the syntax issues, then try running the tests again.";

const syntaxErrorMessages = [
  "Unexpected end of JSON input",
  "Cannot read properties of null (reading 'entry')",
  "not valid JSON",
];

const defaultExecutionErrorMessage =
  "An unexpected error occurred while executing test cases.";

export const resolveTestCaseExecutionErrorMessage = (error: any): string => {
  const errorMessage = error?.message;
  if (
    error instanceof SyntaxError ||
    (error?.name && error.name.includes("SyntaxError")) ||
    syntaxErrorMessages.includes(errorMessage)
  ) {
    return syntaxErrorMessage;
  }
  if (errorMessage?.includes("filtering resource")) {
    return executionBundlePreparationErrorMessage;
  }
  if (errorMessage?.match(profileMismatchRegex)) {
    return profileMismatchErrorMessage;
  }
  return errorMessage || defaultExecutionErrorMessage;
};
