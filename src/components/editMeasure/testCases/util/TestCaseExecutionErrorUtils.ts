export const profileMismatchRegex =
  /Please ensure that meta.profile is properly set on the Patient resource/;

const getProfileLabel = (profile?: string): string => {
  const trimmedProfile = profile?.trim();
  return trimmedProfile ? `${trimmedProfile} profile` : "required profile";
};

export const profileMismatchErrorMessageListView = (
  profile?: string
): string => {
  const profileLabel = getProfileLabel(profile);
  return `Test cases execution failed. One or more test cases contain a Patient resource that is missing the ${profileLabel}. Please review your test cases and ensure that each Patient resource includes the ${profileLabel}.`;
};

export const profileMismatchErrorMessageEditView = (
  profile?: string
): string => {
  const profileLabel = getProfileLabel(profile);
  return `Test case execution failed. The test case contains a Patient resource that is missing the ${profileLabel}. Please review your test case and ensure that the Patient resource includes the ${profileLabel}.`;
};

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

export const resolveTestCaseExecutionErrorMessage = (
  error: any,
  elmJson: string,
  isListView: boolean
): string => {
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
    let patientProfile: string | undefined;
    try {
      const elm = JSON.parse(elmJson);
      const patientDef = elm.library.statements?.def?.find(
        (statement) => statement.name === "Patient"
      );
      patientProfile = patientDef.expression?.operand?.templateId;
    } catch (e) {
      console.error(e);
    }
    if (isListView) {
      return profileMismatchErrorMessageListView(patientProfile);
    }
    return profileMismatchErrorMessageEditView(patientProfile);
  }
  return errorMessage || defaultExecutionErrorMessage;
};
