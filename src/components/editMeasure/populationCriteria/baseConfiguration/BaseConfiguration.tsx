import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import { Measure, GroupScoring } from "@madie/madie-models";
import {
  measureStore,
  checkUserCanEdit,
  routeHandlerStore,
} from "@madie/madie-util";
import { MenuItem as MuiMenuItem } from "@mui/material";
import MetaDataWrapper from "../../../editMeasure/details/MetaDataWrapper";
import { QDMMeasureSchemaValidator } from "../../../../validations/QDMMeasureSchemaValidator";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import {
  Select,
  MadieDiscardDialog,
  Toast,
} from "@madie/madie-design-system/dist/react";

interface baseConfigurationForm {
  scoring: string;
}

const BaseConfiguration = () => {
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
    scoring: measure?.scoring || "",
  };

  const formik = useFormik({
    initialValues: { ...INITIAL_VALUES },
    validationSchema: QDMMeasureSchemaValidator,
    enableReinitialize: true,
    onSubmit: async (values: baseConfigurationForm) =>
      await handleSubmit(values),
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
    };

    measureServiceApi
      .updateMeasure(newMeasure)
      .then(() => {
        handleToast(
          "success",
          "Measurement Base Configuration Updated Successfully",
          true
        );
        // updating measure will propagate update state site wide.
        updateMeasure(newMeasure);
      })
      // update to alert
      .catch((err) => {
        handleToast(
          "danger",
          "Error updating Measurement Base Configuration: " +
            err?.response?.data?.message?.toString(),
          true
        );
      });
  };

  return (
    <MetaDataWrapper
      header="Base Configuration"
      canEdit={canEdit}
      dirty={formik.dirty}
      isValid={formik.isValid}
      handleSubmit={formik.handleSubmit}
      onCancel={onCancel}
    >
      <form
        id="measure-details-form"
        onSubmit={formik.handleSubmit}
        data-testid="base-configuration-form"
      >
        <div
          id="base-configuration"
          data-testid="base-configuration"
          style={{ width: "30%" }}
        >
          <Select
            placeHolder={{ name: "Select Scoring", value: "" }}
            required
            label="Scoring"
            id="scoring-select"
            inputProps={{
              "data-testid": "scoring-select-input",
            }}
            data-testid="scoring-select"
            {...formik.getFieldProps("scoring")}
            error={formik.touched.scoring && Boolean(formik.errors.scoring)}
            disabled={!canEdit}
            helperText={
              formik.touched.scoring &&
              Boolean(formik.errors.scoring) &&
              formik.errors.scoring
            }
            size="small"
            SelectDisplayProps={{
              "aria-required": "true",
            }}
            onChange={(e) => {
              const nextScoring = e.target.value;

              formik.setFieldValue("scoring", nextScoring);
            }}
            value={formik.values.scoring}
            options={Object.keys(GroupScoring).map((scoring) => {
              return (
                <MuiMenuItem
                  key={scoring}
                  value={GroupScoring[scoring]}
                  data-testid={`scoring-option-${scoring}`}
                >
                  {GroupScoring[scoring]}
                </MuiMenuItem>
              );
            })}
          />
        </div>
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
          onClose={() => {
            setDiscardDialogOpen(false);
          }}
        />
      </form>
    </MetaDataWrapper>
  );
};

export default BaseConfiguration;
