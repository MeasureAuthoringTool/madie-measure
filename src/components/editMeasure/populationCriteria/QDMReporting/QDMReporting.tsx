import React, { useState, useEffect } from "react";
import tw from "twin.macro";
import { useFormik } from "formik";
import { Measure } from "@madie/madie-models";
import {
  measureStore,
  checkUserCanEdit,
  routeHandlerStore,
} from "@madie/madie-util";
import MetaDataWrapper from "../../../editMeasure/details/MetaDataWrapper";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import {
  Select,
  MadieDiscardDialog,
  Toast,
  TextArea,
  TextField,
} from "@madie/madie-design-system/dist/react";
import "./QDMReporting.scss";
import { MenuItem as MuiMenuItem } from "@mui/material";
import { QDMReportingValidator } from "./QDMReportingValidator";
import _ from "lodash";
const Grid = tw.div`grid grid-cols-2 gap-4   overflow-hidden w-full`;
const improvementNotationOptions = [
  {
    label: "-",
    value: "",
    subtitle: null,
    code: null,
  },
  {
    label: "Increased score indicates improvement",
    value: "Increased score indicates improvement",
    subtitle:
      "Improvement is indicated as an increase in the score or measurement (e.g. Higher score indicates better quality).",
    code: "increase",
  },
  {
    label: "Decreased score indicates improvement",
    value: "Decreased score indicates improvement",
    subtitle:
      "Improvement is indicated as a decrease in the score or measurement (e.g. Lower score indicates better quality).",
    code: "decrease",
  },
  {
    label: "Other",
    value: "Other",
    subtitle: "Custom Input",
    code: "other",
  },
];

interface ReportingForm {
  rateAggregation: string;
  improvementNotation: string;
  improvementNotationDescription: string;
}

const QDMReporting = () => {
  const [measure, setMeasure] = useState<Measure>(measureStore.state);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const measureServiceApi = useMeasureServiceApi();
  const { updateMeasure } = measureStore;
  // Toast utilities
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const { updateRouteHandlerState } = routeHandlerStore;

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
      rateAggregation: measure?.rateAggregation || "",
      improvementNotation: measure?.improvementNotation || "",
      improvementNotationDescription:
        measure?.improvementNotationDescription || "",
    },
    enableReinitialize: true,
    validationSchema: QDMReportingValidator,
    onSubmit: async (values: ReportingForm) => await handleSubmit(values),
  });
  const { resetForm } = formik;

  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);

  const onCancel = () => {
    setDiscardDialogOpen(true);
  };

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

  const handleSubmit = async (values) => {
    const newMeasure: Measure = {
      ...measure,
      rateAggregation: values.rateAggregation,
      improvementNotation: values.improvementNotation,
      improvementNotationDescription: values?.improvementNotationDescription,
    };

    measureServiceApi
      .updateMeasure(newMeasure)
      .then(() => {
        handleToast("success", "Measure Reporting Updated Successfully", true);
        // updating measure will propagate update state site wide.
        updateMeasure(newMeasure);
      })
      // update to alert
      .catch((err) => {
        handleToast(
          "danger",
          "Error updating Measure Reporting: " +
            err?.response?.data?.message?.toString(),
          true
        );
      });
  };

  const handleImprovementNotationChange = (evt) => {
    if (_.isEmpty(evt.target.value)) {
      formik.setFieldValue("improvementNotationDescription", "");
    }
    formik.setFieldValue("improvementNotation", evt.target.value);
  };

  return (
    <MetaDataWrapper
      header="Reporting"
      canEdit={canEdit}
      dirty={formik.dirty}
      isValid={formik.isValid}
      handleSubmit={formik.handleSubmit}
      onCancel={onCancel}
    >
      <form
        id="measure-reporting-form"
        onSubmit={formik.handleSubmit}
        data-testid="reporting-form"
      >
        <div id="reporting" data-testid="reporting">
          <Grid>
            <div>
              <TextArea
                disabled={!canEdit}
                label="Rate Aggregation"
                name="rate-aggregation"
                id="rate-aggregation"
                autoComplete="rate-aggregation"
                placeholder="Rate Aggregation"
                data-testid="rateAggregationText"
                {...formik.getFieldProps("rateAggregation")}
              />
            </div>
            <div />
            <div>
              <Select
                name="Improvement Notation"
                placeHolder={{ name: "Select Improvement Notation", value: "" }}
                label="Improvement Notation"
                id="improvement-notation-select"
                inputProps={{
                  "data-testid": "improvement-notation-input",
                }}
                disabled={!canEdit}
                data-testid="improvement-notation-select"
                {...formik.getFieldProps("improvementNotation")}
                size="small"
                options={Object.values(improvementNotationOptions).map(
                  (opt) => (
                    <MuiMenuItem key={opt.label} value={opt.value}>
                      {opt.label}
                    </MuiMenuItem>
                  )
                )}
                onChange={handleImprovementNotationChange}
              />
            </div>
            <div>
              <TextField
                label="Improvement Notation Description"
                helperText={
                  formik.touched.improvementNotationDescription &&
                  formik.errors.improvementNotationDescription
                }
                error={
                  formik.touched.improvementNotationDescription &&
                  formik.errors.improvementNotationDescription
                }
                disabled={
                  !canEdit ||
                  _.isEmpty(formik.getFieldProps("improvementNotation").value)
                }
                required={
                  formik.getFieldProps("improvementNotation").value == "Other"
                }
                name="improvement-notation-description"
                id="improvement-notation-description"
                autoComplete="improvement-notation-description"
                placeholder="Description"
                data-testid="improvement-notation-description"
                {...formik.getFieldProps("improvementNotationDescription")}
              />
            </div>
          </Grid>
        </div>

        <Toast
          toastKey="reporting-toast"
          aria-live="polite"
          toastType={toastType}
          testId={
            toastType === "danger"
              ? "edit-reporting-generic-error-text"
              : "edit-reporting-success-text"
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
          onClose={() => {
            setDiscardDialogOpen(false);
          }}
        />
      </form>
    </MetaDataWrapper>
  );
};

export default QDMReporting;
