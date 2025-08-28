import React, { useEffect, useState } from "react";
import {
  Button,
  RadioButton,
  MadieDiscardDialog,
  Toast,
} from "@madie/madie-design-system/dist/react";
import { useFormik } from "formik";
import { Measure } from "@madie/madie-models";
import {
  measureStore,
  checkUserCanEdit,
  routeHandlerStore,
} from "@madie/madie-util";
import "../testCaseConfiguration.scss";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";
import { Typography } from "@mui/material";
import useFormikResetOnEvent from "../../../../../common/useFormikResetOnEvent";

const RAVPage = ({ setExecutionContextReady }) => {
  const [measure, setMeasure] = useState<any>(measureStore.state);
  const measureServiceApi = useMeasureServiceApi();
  const { updateMeasure } = measureStore;
  const { updateRouteHandlerState } = routeHandlerStore;
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );

  const formik = useFormik({
    initialValues: {
      ravIncluded: measure?.testCaseConfiguration?.ravIncluded || false,
    },
    enableReinitialize: true,
    onSubmit: async () => await handleSubmit(),
  });
  useFormikResetOnEvent(formik);
  const { resetForm } = formik;

  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty, updateRouteHandlerState]);

  const onToastClose = () => {
    setToastType("danger");
    setToastMessage("");
    setToastOpen(false);
  };
  const handleToast = (type, message, open) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(open);
  };

  const handleSubmit = async () => {
    const newMeasure: Measure = {
      ...measure,
      testCaseConfiguration: {
        ...measure.testCaseConfiguration,
        ravIncluded: formik.values.ravIncluded,
      },
    };

    measureServiceApi
      .updateMeasureTestCaseConfiguration(
        newMeasure?.testCaseConfiguration,
        newMeasure.id
      )
      .then(() => {
        handleToast(
          "success",
          "Test Case Configuration Updated Successfully",
          true
        );
        setExecutionContextReady(false);
        // updating measure will propagate update state site wide.
        updateMeasure(newMeasure);
      })
      // update to alert
      .catch((err) => {
        handleToast(
          "danger",
          "Error updating Test Case Configuration: " +
            err?.response?.data?.message?.toString(),
          true
        );
      });
  };

  return (
    <form
      id="rav-form"
      data-testid="rav-form"
      className="test-case-config-form"
      onSubmit={formik.handleSubmit}
    >
      <div className="form-title">
        <h2>RAV</h2>
        <Typography>
          <span>*</span>
          Indicates required field
        </Typography>
      </div>
      <div className="form-elements" data-testid="rav-page">
        <div className="radio-button-group">
          <RadioButton
            row
            id="rav-option"
            dataTestId="rav-option"
            label="Include Risk Adjustment Variables"
            required
            options={[
              { label: "Yes", value: true },
              { label: "No", value: false },
            ]}
            value={formik.values.ravIncluded}
            onChange={(e) => {
              formik.setFieldValue("ravIncluded", e.target.value === "true");
            }}
            readOnly={!canEdit}
          />
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
          data-testid="rav-save"
          type="submit"
          className="save-button"
        >
          Save
        </Button>
      </div>
      <Toast
        toastKey="rav-toast"
        aria-live="polite"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "edit-rav-generic-error-text"
            : "edit-rav-success-text"
        }
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={10000}
        closeButtonProps={{
          "data-testid": "close-toast-button",
        }}
      />
      <MadieDiscardDialog
        open={discardDialogOpen}
        onContinue={() => {
          resetForm();
          setDiscardDialogOpen(false);
        }}
        onClose={() => {
          setDiscardDialogOpen(false);
        }}
      />
    </form>
  );
};
export default RAVPage;
