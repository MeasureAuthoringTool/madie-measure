import React, { Dispatch, SetStateAction } from "react";
import { TestCaseImportOutcome } from "@madie/madie-models";
import { CustomWarningMessage } from "../../statusHandler/StatusHandler";

export interface TestCasesPassingDetailsProps {
  passPercentage: number;
  passFailRatio: string;
}

export interface TestCaseListProps {
  errors: Array<string>;
  warnings?: Array<string>;
  setErrors: Dispatch<SetStateAction<Array<string>>>;
  setImportErrors?: Dispatch<SetStateAction<Array<string>>>;
  setWarnings?: Dispatch<SetStateAction<Array<string>>>;
  setImportWarnings?: Dispatch<SetStateAction<TestCaseImportOutcome[]>>;
  setShiftTestCaseDatesWarnings?: Dispatch<SetStateAction<Array<string>>>;
  setCustomWarningMessages?: Dispatch<SetStateAction<CustomWarningMessage[]>>;
}
