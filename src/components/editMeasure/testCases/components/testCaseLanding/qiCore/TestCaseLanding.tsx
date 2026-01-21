import React from "react";
import "twin.macro";
import "styled-components/macro";
import TestCaseList from "./TestCaseList";
import { TestCaseListProps } from "../common/interfaces";
import { useDocumentTitle } from "@madie/madie-util";

const TestCaseLanding = (props: TestCaseListProps) => {
  useDocumentTitle("MADiE Edit Measure Test Cases");
  return (
    <div>
      <section>
        <TestCaseList
          errors={props.errors}
          warnings={props.warnings}
          setErrors={props.setErrors}
          setWarnings={props.setWarnings}
          setImportWarnings={props.setImportWarnings}
          setShiftTestCaseDatesWarnings={props.setShiftTestCaseDatesWarnings}
          setUpdateQiCoreJsonWithGroupAndTitleWarning={
            props.setUpdateQiCoreJsonWithGroupAndTitleWarning
          }
          setCustomWarningMessages={props.setCustomWarningMessages}
        />
      </section>
    </div>
  );
};

export default TestCaseLanding;
