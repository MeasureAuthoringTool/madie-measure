import React, { useState, useEffect } from "react";

import {
  Button,
  MadieDiscardDialog,
  Toast,
} from "@madie/madie-design-system/dist/react";
import { Typography } from "@mui/material";
import {
  useMeasureServiceApi,
  measureStore,
  routeHandlerStore,
} from "@madie/madie-util";
import { useFormik } from "formik";
import useFormikResetOnEvent from "../../../common/useFormikResetOnEvent";
import TextEditor from "../../populationCriteria/groups/TextEditor";
import { MeasureLock } from "@madie/madie-models";

interface TransmissionFormatProps {
  setErrorMessage: Function;
  measureCanEdit: boolean;
  lockingFeatureEnabled?: boolean;
}

const TransmissionFormat = (props: TransmissionFormatProps) => {
  const { setErrorMessage, measureCanEdit, lockingFeatureEnabled } = props;
  const measureServiceApi = useMeasureServiceApi();
  const { updateMeasure } = measureStore;
  const [measure, setMeasure] = useState<any>(measureStore.state);
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  // Toast utilities
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
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
  // Form utilities
  const INITIAL_VALUES = {
    transmissionFormat: measure?.measureMetaData?.transmissionFormat || "",
  };
  const handleSubmit = ({ transmissionFormat }) => {
    const copiedMetaData = { ...measure?.measureMetaData };
    copiedMetaData.transmissionFormat = transmissionFormat;
    const modifiedMeasure = {
      ...measure,
      measureMetaData: copiedMetaData,
    };
    measureServiceApi
      .updateMeasure(modifiedMeasure)
      .then((res) => {
        //@ts-ignore
        const { status, data } = res;
        if (status === 200) {
          handleToast(
            "success",
            `Measure Transmission Format Saved Successfully`,
            true
          );
          updateMeasure(data);
        }
      })
      .catch((err) => {
        let message = `Error updating Transmission Format for "${measure.measureName}"`;
        if (lockingFeatureEnabled && err?.status === 423) {
          updateMeasure({
            ...measure,
            measureLock: {
              lockedBy: err?.response?.data?.message?.replace(
                "Unable to update measure. Measure is locked by ",
                ""
              ),
            } as unknown as MeasureLock,
          });
          formik.resetForm();
          message = err?.response?.data?.message.toString();
        }
        handleToast("danger", message, true);
        setErrorMessage(message);
      });
  };
  const formik = useFormik({
    initialValues: { ...INITIAL_VALUES },
    enableReinitialize: true,
    onSubmit: async (values) => await handleSubmit(values),
  });
  useFormikResetOnEvent(formik);

  function formikErrorHandler(name: string, isError: boolean) {
    if (formik.touched[name] && formik.errors[name]) {
      return `${formik.errors[name]}`;
    }
  }
  const { updateRouteHandlerState } = routeHandlerStore;
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);
  return (
    <div
      id="measure-details-form"
      data-testid={`transmission-format`}
      style={{ minHeight: 539 }}
    >
      <div className="content">
        <div className="subTitle">
          <h2>Transmission Format</h2>
          <div>
            <Typography
              style={{ fontSize: 14, fontWeight: 300, fontFamily: "Rubik" }}
            >
              <span style={{ color: "#D92F2F", marginRight: 3 }}>*</span>
              Indicates required field
            </Typography>
          </div>
        </div>
        <div>
          <div className="top-row">
            <TextEditor
              label="Description"
              setFieldValue={formik.setFieldValue}
              readOnly={!measureCanEdit}
              error={
                formik.touched.transmissionFormat &&
                Boolean(formik.errors.transmissionFormat)
              }
              helperText={formikErrorHandler("transmissionFormat", true)}
              {...formik.getFieldProps("transmissionFormat")}
            />
          </div>
        </div>
        <div className="form-actions">
          <Button
            onClick={() => setDiscardDialogOpen(true)}
            variant="outline"
            data-testid="cancel-button"
            disabled={!formik.dirty}
            style={{ marginTop: 20, float: "right", marginRight: 32 }}
          >
            Discard Changes
          </Button>
          <Button
            onClick={formik.handleSubmit}
            variant="cyan"
            type="submit"
            data-testid="save-button"
            disabled={!(formik.isValid && formik.dirty)}
            style={{ marginTop: 20, float: "right" }}
          >
            Save
          </Button>
        </div>
      </div>
      <Toast
        toastKey="measure-information-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? `measure-transmission-format-error`
            : `measure-transmission-format-success`
        }
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={6000}
        closeButtonProps={{
          "data-testid": "close-error-button",
        }}
      />
      <MadieDiscardDialog
        open={discardDialogOpen}
        onContinue={() => {
          formik.resetForm();
          setDiscardDialogOpen(false);
        }}
        onClose={() => setDiscardDialogOpen(false)}
      />
    </div>
  );
};

export default TransmissionFormat;
