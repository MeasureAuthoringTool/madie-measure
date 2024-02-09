import React, { useState, useEffect } from "react";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import {
  Button,
  MadieDiscardDialog,
  TextArea,
  Toast,
} from "@madie/madie-design-system/dist/react";
import { Typography } from "@mui/material";
import {
  measureStore,
  routeHandlerStore,
  checkUserCanEdit,
} from "@madie/madie-util";
import { useFormik } from "formik";
import * as Yup from "yup";

interface TransmissionFormatProps {
  setErrorMessage: Function;
}

const TransmissionFormat = (props: TransmissionFormatProps) => {
  const { setErrorMessage } = props;
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
  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );
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
      .catch(() => {
        const message = `Error updating Transmission Format for "${measure.measureName}"`;
        handleToast("danger", message, true);
        setErrorMessage(message);
      });
  };
  const formik = useFormik({
    initialValues: { ...INITIAL_VALUES },
    enableReinitialize: true,
    onSubmit: async (values) => await handleSubmit(values),
  });
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
            <TextArea
              disabled={!canEdit}
              label="Description"
              placeholder="Enter"
              readOnly={!canEdit}
              id="measure-transmission-format"
              data-testid="measure-transmission-format"
              inputProps={{
                "data-testid": "measure-transmission-format-input",
                "aria-describedby": "measure-transmission-format-helper-text",
              }}
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
