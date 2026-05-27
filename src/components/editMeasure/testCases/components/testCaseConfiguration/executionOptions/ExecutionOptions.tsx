import React, { useState, useEffect, useCallback } from "react";
import { useFormik } from "formik";
import {
  measureStore,
  checkUserCanEdit,
  routeHandlerStore,
  useMeasureServiceApi,
} from "@madie/madie-util";
import {
  Button,
  Toast,
  MadieDiscardDialog,
} from "@madie/madie-design-system/dist/react";
import { FormControlLabel, Checkbox } from "@mui/material";
import useFormikResetOnEvent from "../../../../../common/useFormikResetOnEvent";
import { Measure } from "@madie/madie-models";

export const EXECUTE_INVALID_TEST_WARNING_TEST_DATA_ID =
  "test-cases-execute-invalid-test-cases-warning";
export const EXECUTE_INVALID_TEST_CASES_WARNING =
  "Execution of invalid test cases is enabled. You may receive inaccurate pass/fail results. You can update this setting in Execution Configuration tab.";

export default function ExecutionOptions({ setCustomWarningMessages }) {
  const [measure, setMeasure] = useState<Measure>(measureStore.state);
  const measureServiceApi = useMeasureServiceApi();
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    type: string;
    message: string;
  }>({
    open: false,
    type: "danger",
    message: "",
  });

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => subscription.unsubscribe();
  }, []);

  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls
  );

  const formik = useFormik({
    initialValues: {
      executeInvalidTestCases:
        measure?.testCaseConfiguration?.executeInvalidTestCases || false,
    },
    enableReinitialize: true,
    onSubmit: async () => {
      const newMeasure: Measure = {
        ...measure,
        testCaseConfiguration: {
          ...measure.testCaseConfiguration,
          executeInvalidTestCases: formik.values.executeInvalidTestCases,
        },
      };
      try {
        await measureServiceApi.updateMeasureTestCaseConfiguration(
          newMeasure.testCaseConfiguration,
          newMeasure.id
        );
        setToast({
          open: true,
          type: "success",
          message: "Test Case Configuration Updated Successfully",
        });
        measureStore.updateMeasure(newMeasure);
        if (newMeasure?.testCaseConfiguration?.executeInvalidTestCases) {
          setCustomWarningMessages([
            {
              message: EXECUTE_INVALID_TEST_CASES_WARNING,
              testDataId: "test-cases-execute-invalid-test-cases-warning",
            },
          ]);
        } else {
          setCustomWarningMessages([]);
        }
      } catch (err: any) {
        console.error(err);
        setToast({
          open: true,
          type: "danger",
          message:
            "An error occurred while updating the Test Case Configuration.",
        });
      }
    },
  });

  useFormikResetOnEvent(formik);

  useEffect(() => {
    routeHandlerStore.updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);

  const handleDiscard = useCallback(() => {
    formik.resetForm();
    setDiscardDialogOpen(false);
  }, [formik]);

  const handleToastClose = () =>
    setToast({ open: false, type: "danger", message: "" });

  return (
    <form
      id="execution-options-form"
      data-testid="execution-options-form"
      className="test-case-config-form"
      onSubmit={formik.handleSubmit}
    >
      <div className="form-title">
        <h2>Execution Options</h2>
      </div>

      <div
        className="execution-options-checkbox-section"
        style={{ marginBottom: "1.5em" }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={formik.values.executeInvalidTestCases}
              onChange={formik.handleChange}
              disabled={!canEdit}
              name="executeInvalidTestCases"
              id="executeInvalidTestCases"
              data-testid="execute-invalid-test-cases"
            />
          }
          label={
            <span
              style={{
                fontFamily: "Rubik",
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "16px",
                letterSpacing: "0px",
                color: "#515151",
              }}
            >
              Execute test cases regardless of validation status
            </span>
          }
        />
        <div
          style={{
            fontFamily: "Rubik",
            fontWeight: 400,
            fontSize: "14px",
            lineHeight: "100%",
            letterSpacing: "0px",
            color: "#000000",
            display: "flex",
            flexDirection: "column",
            rowGap: "5px",
            marginLeft: "32px",
          }}
        >
          <span>
            I Understand that checking this checkbox will allow me to execute
            invalid test cases. Executing test cases that are marked as invalid
          </span>
          <span>
            may lead to inaccurate pass/fail results. It’s recommended to
            validate test cases before execution to ensure reliable outcomes.
          </span>
        </div>
      </div>

      <div className="form-actions">
        <Button
          variant="outline"
          disabled={!formik.dirty || !canEdit}
          data-testid="cancel-button"
          onClick={() => setDiscardDialogOpen(true)}
          className="cancel-button"
        >
          Discard Changes
        </Button>
        <Button
          variant="cyan"
          disabled={!(formik.isValid && formik.dirty) || !canEdit}
          data-testid="execution-options-save"
          type="submit"
          className="save-button"
        >
          Save
        </Button>
      </div>

      <Toast
        toastKey="execution-options-toast"
        aria-live="polite"
        toastType={toast.type}
        testId={
          toast.type === "danger"
            ? "execution-options-generic-error-text"
            : "execution-options-success-text"
        }
        open={toast.open}
        message={toast.message}
        onClose={handleToastClose}
        autoHideDuration={10000}
        closeButtonProps={{
          "data-testid": "close-error-button",
        }}
      />

      <MadieDiscardDialog
        open={discardDialogOpen}
        onContinue={handleDiscard}
        onClose={() => setDiscardDialogOpen(false)}
      />
    </form>
  );
}
