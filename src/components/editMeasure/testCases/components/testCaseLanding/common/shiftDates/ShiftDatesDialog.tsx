import React from "react";
import { TestCase } from "@madie/madie-models";
import {
  MadieDialog,
  NumberInput,
} from "@madie/madie-design-system/dist/react";
import { useFormik } from "formik";
import * as _ from "lodash";
import "./ShiftDatesDialog.scss";

interface shiftDatesDialogProps {
  open: boolean;
  onClose: Function;
  canEdit?: boolean;
  testCases?: TestCase[];
  onTestCaseShiftDates?: (testCases: TestCase[], shifted: number) => void;
}

const ShiftDatesDialog = ({
  open,
  onClose,
  canEdit,
  testCases,
  onTestCaseShiftDates,
}: shiftDatesDialogProps) => {
  const formik = useFormik({
    initialValues: {
      shiftDatesInput: "",
    },
    onSubmit: async (value) => {
      await handleSubmit(value);
      onClose();
    },
  });

  const handleSubmit = async (value) => {
    onTestCaseShiftDates(testCases, value.shiftDatesInput);
  };

  return (
    <MadieDialog
      form
      title="Shift Test Case Date(s)"
      dialogProps={{
        onClose,
        open,
        onSubmit: formik.handleSubmit,
        maxWidth: "md",
        fullWidth: true,
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Cancel",
        "data-testid": "shift-dates-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        "data-testid": "shift-dates-save-button",
        disabled: !(formik.isValid && formik.dirty),
        continueText: "Save",
      }}
    >
      <div
        data-testid="shift-dates-dialog"
        id="shift-dates-dialog"
        className="shift-dates-grid"
      >
        <div
          data-testid="shift-dates-selected-test-cases"
          className={"test-case-list-container"}
          style={{ fontSize: 14 }}
        >
          Test Case(s)
          <ul>
            {testCases.map((testCase) => (
              <li
                data-testid={`${testCase.series} - ${testCase.title}`}
              >{`\u2022 ${testCase.title}`}</li>
            ))}
          </ul>
        </div>

        <div id="shift-dates-info " style={{ fontSize: 15 }}>
          Shift dates on test case(s) by the number of years being changed.
          Entering a negative number will shift the test case(s) years
          backwards. Feb 29 in Leap Years - Feb 28 in non Leap Years.
        </div>

        <div id="shift-dates-info " style={{ fontSize: 15 }}>
          Note that resulting years prior to 1900 will be set to 1900 and after
          9999 will be set to 9999.
        </div>

        <div className="shift-dates-number-input">
          <NumberInput
            id="shift-dates"
            data-testid="shift-dates-number-input"
            label="Shift Test Case Dates"
            placeholder="# of Years"
            disabled={!canEdit || _.isEmpty(testCases)}
            required={true}
            allowNegative={true}
            {...formik.getFieldProps("shiftDatesInput")}
            error={
              formik.touched.shiftDatesInput &&
              Boolean(formik.errors.shiftDatesInput)
            }
            helperText={
              formik.touched.shiftDatesInput && formik.errors.shiftDatesInput
            }
          ></NumberInput>
        </div>
      </div>
    </MadieDialog>
  );
};

export default ShiftDatesDialog;
