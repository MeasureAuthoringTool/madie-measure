import React, { useRef } from "react";
import { TestCase, Measure } from "@madie/madie-models";
import {
  MadieDialog,
  NumberInput,
} from "@madie/madie-design-system/dist/react";
import { useFormik } from "formik";
import * as _ from "lodash";
import "./ShiftDatesDialog.scss";
import { useFeatureFlags } from "@madie/madie-util";
import useTestCaseServiceApi from "../../../../api/useTestCaseServiceApi";

interface shiftDatesDialogProps {
  open: boolean;
  onClose: Function;
  canEdit?: boolean;
  testCases?: TestCase[];
  measure: Measure;
  setToastOpen: Function;
  setToastType: Function;
  setToastMessage: Function;
  setShiftTestCaseDatesWarnings: Function;
}

const ShiftDatesDialog = ({
  open,
  onClose,
  canEdit,
  testCases,
  measure,
  setToastOpen,
  setToastType,
  setToastMessage,
  setShiftTestCaseDatesWarnings,
}: shiftDatesDialogProps) => {
  const featureFlags = useFeatureFlags();
  const testCaseService = useRef(useTestCaseServiceApi());
  const isQdm = measure?.model?.includes("QDM");
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
    if (isQdm) {
      testCaseService.current
        .shiftQdmTestCaseDates(
          measure.id,
          testCases.map((testCase) => testCase.id),
          value.shiftDatesInput
        )
        .then((response) => {
          if (response.failed.length === 0) {
            setToastOpen(true);
            setToastType("success");
            setToastMessage(`All Test Case dates successfully shifted.`);
          } else {
            setShiftTestCaseDatesWarnings((prevState) => [
              ...prevState,
              ...response.failed,
            ]);
          }
        })
        .catch((err) => {
          setToastOpen(true);
          setToastType("danger");
          setToastMessage(err?.message);
        });
    } else {
      testCaseService.current
        .shiftQiCoreTestCaseDates(
          measure.id,
          testCases.map((testCase) => testCase.id),
          value.shiftDatesInput
        )
        .then((response) => {
          if (response.failed.length === 0) {
            setToastOpen(true);
            setToastType("success");
            setToastMessage(`All Test Case dates successfully shifted.`);
          } else {
            setShiftTestCaseDatesWarnings((prevState) => [
              ...prevState,
              ...response.failed,
            ]);
          }
        })
        .catch((err) => {
          setToastOpen(true);
          setToastType("danger");
          setToastMessage(err?.message);
        });
    }
    formik.resetForm();
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
        <div id="shift-dates-info " style={{ fontSize: 15 }}>
          Shift dates on all test cases by the number of years being changed.
          Entering a negative number will shift the test cases years backwards.
          Feb 29 in Leap Years - Feb 28 in non Leap Years.
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
            readOnly={!canEdit || _.isEmpty(testCases)}
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
