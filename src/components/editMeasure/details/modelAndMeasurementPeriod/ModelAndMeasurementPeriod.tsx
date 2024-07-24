import React, { useState, useEffect } from "react";
import { Measure } from "@madie/madie-models";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import "styled-components/macro";
import {
  Button,
  MadieDiscardDialog,
  Toast,
  ReadOnlyTextField,
  DateField,
} from "@madie/madie-design-system/dist/react";

import { Typography } from "@mui/material";
import { useFormik } from "formik";
import { MeasurementPeriodValidator } from "../../../../validations/MeasurementPeriodValidator";
import {
  measureStore,
  routeHandlerStore,
  checkUserCanEdit,
} from "@madie/madie-util";
import { Box } from "@mui/system";

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr",
  gap: 5,
};

interface modelAndMeasurementPeriod {
  model: string;
  measurementPeriodStart: Date;
  measurementPeriodEnd: Date;
}

interface ModelAndMeasurementPeriodProps {
  setErrorMessage: Function;
}

const ModelAndMeasurementPeriod = (props: ModelAndMeasurementPeriodProps) => {
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

  const row = {
    display: "flex",
    flexDirection: "row",
  };
  const spaced = {
    marginBottom: "23px",
  };
  const gap = {
    columnGap: "24px",
    "& > * ": {
      flex: 1,
    },
  };
  const formRow = Object.assign({}, row, spaced);
  const formRowGapped = Object.assign({}, formRow, gap);

  // Dialog and toast utilities
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  // our initial values are taken from the measure we subscribe to
  const INITIAL_VALUES = {
    measurementPeriodStart: measure?.measurementPeriodStart,
    measurementPeriodEnd: measure?.measurementPeriodEnd,
    model: measure?.model,
  } as modelAndMeasurementPeriod;

  const formik = useFormik({
    initialValues: { ...INITIAL_VALUES },
    validationSchema: MeasurementPeriodValidator,
    enableReinitialize: true, // formik will auto set initial variables whenever measure delivers new results
    onSubmit: async (values: modelAndMeasurementPeriod) =>
      await handleSubmit(values),
  });
  const { resetForm } = formik;
  // update our routehandler discard dialog
  const { updateRouteHandlerState } = routeHandlerStore;
  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);

  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );
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

  const goBackToNav = (e) => {
    if (e.shiftKey && e.keyCode == 9) {
      e.preventDefault();
      document
        .getElementById("sideNavMeasureModelAndMeasurementPeriod")
        .focus();
    }
  };

  const handleSubmit = async (values) => {
    const newMeasure: Measure = {
      ...measure,
      measurementPeriodStart: values.measurementPeriodStart,
      measurementPeriodEnd: values.measurementPeriodEnd,
    };
    measureServiceApi
      .updateMeasure(newMeasure)
      .then(() => {
        handleToast(
          "success",
          "Measurement Information Updated Successfully",
          true
        );
        // updating measure will propagate update state site wide.
        updateMeasure(newMeasure);
      })
      .catch((err) => {
        // alert here.
        setErrorMessage(err?.response?.data?.message.toString());
      });
  };

  // discard dialog
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  function formikErrorHandler(name: string, isError: boolean) {
    if (formik.touched[name] && formik.errors[name]) {
      return `${formik.errors[name]}`;
    }
  }

  return (
    <form
      id="measure-details-form"
      onSubmit={formik.handleSubmit}
      data-testid="model-measurement-form"
    >
      <div className="content">
        <div className="subTitle">
          <h2>Model & Measurement Period</h2>
          <Typography
            style={{
              fontSize: 14,
              fontWeight: 300,
              fontFamily: "Rubik",
              float: "right",
            }}
          >
            <span style={{ color: "#D92F2F", marginRight: 3 }}>*</span>
            Indicates required field
          </Typography>
        </div>
        <Box sx={formRowGapped}>
          <ReadOnlyTextField
            tabIndex={0}
            placeholder="Model"
            label="Model"
            id="modelId"
            data-testid="model-id-text-field"
            inputProps={{ "data-testid": "model-id-input" }}
            helperText={formikErrorHandler("model", true)}
            size="small"
            {...formik.getFieldProps("model")}
            onKeyDown={goBackToNav}
          />
        </Box>
        <Box sx={formGridStyle} data-testid="measurement-period-div">
          <DateField
            id="measurement-period-start"
            disabled={!canEdit}
            required={true}
            label="Measurement Period - Start Date"
            handleDateChange={(startDate) =>
              formik.setFieldValue(
                "measurementPeriodStart",
                startDate.format("YYYY-MM-DDTHH:mm:ss")
              )
            }
            error={
              formik.touched.measurementPeriodStart &&
              Boolean(formik.errors.measurementPeriodStart)
            }
            helperText={formikErrorHandler("measurementPeriodStart", true)}
            value={formik.values.measurementPeriodStart}
            textFieldSx={{ width: "100%" }}
            {...formik.getFieldProps("measurementPeriodStart")}
            onBlur={() =>
              formik.setFieldTouched("measurementPeriodStart", true, false)
            }
          />
          <DateField
            id="measurement-period-end"
            disabled={!canEdit}
            required={true}
            label="Measurement Period - End Date"
            handleDateChange={(endDate) =>
              formik.setFieldValue(
                "measurementPeriodEnd",
                endDate.format("YYYY-MM-DDTHH:mm:ss"),
                true
              )
            }
            error={
              formik.touched.measurementPeriodEnd &&
              Boolean(formik.errors.measurementPeriodEnd)
            }
            helperText={formikErrorHandler("measurementPeriodEnd", true)}
            value={formik.values.measurementPeriodEnd}
            textFieldSx={{ width: "100%" }}
            {...formik.getFieldProps("measurementPeriodEnd")}
            onBlur={() =>
              formik.setFieldTouched("measurementPeriodEnd", true, false)
            }
          />
        </Box>
      </div>
      {canEdit && (
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
            variant="cyan"
            type="submit"
            data-testid="model-and-measurement-save-button"
            disabled={!(formik.isValid && formik.dirty)}
            style={{ marginTop: 20, float: "right" }}
          >
            Save
          </Button>
        </div>
      )}
      <Toast
        toastKey="measure-information-toast"
        aria-live="polite"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "edit-measure-information-generic-error-text"
            : "edit-measure-information-success-text"
        }
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={10000}
        closeButtonProps={{
          "data-testid": "close-error-button",
        }}
      />
      <MadieDiscardDialog
        open={discardDialogOpen}
        onContinue={() => {
          resetForm();
          setDiscardDialogOpen(false);
        }}
        onClose={() => setDiscardDialogOpen(false)}
      />
    </form>
  );
};

export default ModelAndMeasurementPeriod;
