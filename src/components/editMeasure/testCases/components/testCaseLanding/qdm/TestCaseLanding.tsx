import React from "react";
import "twin.macro";
import "styled-components/macro";
import TestCaseList from "./TestCaseList";
import { TestCaseListProps } from "../common/interfaces";
import { useDocumentTitle } from "@madie/madie-util";

const TestCaseLandingQdm = (props: TestCaseListProps) => {
  useDocumentTitle("MADiE Edit Measure Test Cases");
  return (
    <div>
      <section>
        <TestCaseList
          warnings={props.warnings}
          errors={props.errors}
          setErrors={props.setErrors}
          setWarnings={props.setWarnings}
          setImportErrors={props.setImportErrors}
          setImportWarnings={props.setImportWarnings}
          setCustomWarningMessages={props.setCustomWarningMessages}
          setShiftTestCaseDatesWarnings={props.setShiftTestCaseDatesWarnings}
        />
      </section>
    </div>
  );
};

export default TestCaseLandingQdm;
