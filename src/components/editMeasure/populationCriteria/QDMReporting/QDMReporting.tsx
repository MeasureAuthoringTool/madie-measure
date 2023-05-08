import React, { useState, useEffect } from "react";
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
  MadieDiscardDialog,
  Toast,
} from "@madie/madie-design-system/dist/react";
import "./QDMReporting.scss";
import { FieldInput } from "../../../../styles/editMeasure/populationCriteria/groups";
import {
  FieldLabel,
  FieldSeparator,
} from "../../../../styles/editMeasure/populationCriteria/supplementalData";

interface ReportingForm {
  rateAggregation: string;
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
    measure?.createdBy,
    measure?.acls,
    measure?.measureMetaData?.draft
  );

  const INITIAL_VALUES = {
    rateAggregation: measure?.rateAggregation || "",
  };

  const formik = useFormik({
    initialValues: { ...INITIAL_VALUES },
    enableReinitialize: true,
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
          <div className="left">
            <FieldLabel htmlFor="rate-aggregation" id="rate-aggregation-label">
              Rate Aggregation
            </FieldLabel>
            <FieldSeparator>
              <FieldInput
                {...formik.getFieldProps("rateAggregation")}
                aria-labelledby="rate-aggregation-label"
                type="text"
                disabled={!canEdit}
                name="rate-aggregation"
                id="rate-aggregation"
                autoComplete="rate-aggregation"
                placeholder="Rate Aggregation"
                data-testid="rateAggregationText"
                {...formik.getFieldProps("rateAggregation")}
              />
            </FieldSeparator>
          </div>
          <div className="right"></div>
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
