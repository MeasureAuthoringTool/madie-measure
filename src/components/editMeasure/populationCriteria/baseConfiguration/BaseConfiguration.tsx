import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import {
  Measure,
  GroupScoring,
  BaseConfigurationTypes,
} from "@madie/madie-models";
import {
  measureStore,
  checkUserCanEdit,
  routeHandlerStore,
} from "@madie/madie-util";
import { MenuItem as MuiMenuItem } from "@mui/material";
import MetaDataWrapper from "../../../editMeasure/details/MetaDataWrapper";
import { QDMMeasureSchemaValidator } from "../../../../validations/QDMMeasureSchemaValidator";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import MultipleSelectDropDown from "../MultipleSelectDropDown";
import {
  Select,
  MadieDiscardDialog,
  Toast,
  RadioButton,
} from "@madie/madie-design-system/dist/react";
import "./BaseConfiguration.scss";
import MeasureGroupsWarningDialog from "../groups/MeasureGroupWarningDialog";

interface BaseConfigurationForm {
  scoring: string;
  baseConfigurationTypes: BaseConfigurationTypes[];
  patientBasis: string;
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
  const [currentScoring, setCurrentScoring] = useState<string>();
  const [changeScoringDialog, setChangeScoringDialog] = useState(false);
  const [warningDialogModalType, setWarningDialogModalType] = useState("");
  const [currentPatientBasis, setCurrentPatientBasis] =
    useState<boolean>(undefined);

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
  useEffect(() => {
    if (measure && measure.scoring) {
      setCurrentScoring(measure.scoring);
      setCurrentPatientBasis(measure.patientBasis);
    }
  }, [measure]);

  const formik = useFormik({
    initialValues: {
      scoring: measure?.scoring || "",
      baseConfigurationTypes: measure?.baseConfigurationTypes || [],
      patientBasis: String(measure?.patientBasis) || "true",
    },
    enableReinitialize: true,
    validationSchema: QDMMeasureSchemaValidator,
    onSubmit: async (values: BaseConfigurationForm) => await handleSubmit(),
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

  const handleDialogClose = () => {
    setCurrentScoring(measure?.scoring);
    setCurrentPatientBasis(measure?.patientBasis);
    setChangeScoringDialog(false);
  };

  const handleSubmit = async () => {
    if (
      currentScoring != undefined &&
      formik.values.scoring !== currentScoring
    ) {
      setChangeScoringDialog(true);
      setCurrentScoring(formik.values.scoring);
      setWarningDialogModalType("scoring");
      measure.groups = null;
      return;
    }

    if (
      currentPatientBasis != undefined &&
      formik.values.patientBasis !== String(currentPatientBasis)
    ) {
      setChangeScoringDialog(true);
      setCurrentPatientBasis(formik.values.patientBasis === "true");
      setWarningDialogModalType("patientBasis");
      measure.groups = null;
      return;
    }
    setChangeScoringDialog(false);

    const newMeasure: Measure = {
      ...measure,
      scoring: formik.values.scoring,
      baseConfigurationTypes: formik.values.baseConfigurationTypes,
      patientBasis: formik.values.patientBasis === "true",
    };

    measureServiceApi
      .updateMeasure(newMeasure)
      .then(() => {
        handleToast(
          "success",
          "Measure Base Configuration Updated Successfully",
          true
        );
        // updating measure will propagate update state site wide.
        updateMeasure(newMeasure);
        setCurrentScoring(newMeasure.scoring);
        setCurrentPatientBasis(newMeasure.patientBasis);
      })
      // update to alert
      .catch((err) => {
        handleToast(
          "danger",
          "Error updating Measure Base Configuration: " +
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
        id="measure-base-configuration-form"
        onSubmit={formik.handleSubmit}
        data-testid="base-configuration-form"
      >
        <div id="base-configuration" data-testid="base-configuration">
          <div className="left">
            <MultipleSelectDropDown
              formControl={formik.getFieldProps("baseConfigurationTypes")}
              id="base-configuration-types"
              label="Type"
              placeHolder={{ name: "", value: "" }}
              defaultValue={formik.values.baseConfigurationTypes}
              required={true}
              disabled={!canEdit}
              error={
                formik.touched.baseConfigurationTypes &&
                Boolean(formik.errors.baseConfigurationTypes)
              }
              helperText={
                formik.touched.baseConfigurationTypes &&
                Boolean(formik.errors.baseConfigurationTypes) &&
                formik.errors.baseConfigurationTypes
              }
              {...formik.getFieldProps("baseConfigurationTypes")}
              onChange={(_event: any, selectedVal: string | null) => {
                formik.setFieldValue("baseConfigurationTypes", selectedVal);
              }}
              onClose={() =>
                formik.setFieldTouched("baseConfigurationTypes", true)
              }
              options={Object.values(BaseConfigurationTypes)}
              multipleSelect={true}
              limitTags={1}
            />
          </div>
          <div className="center">
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
          <div className="right">
            <RadioButton
              row
              id="patient-basis"
              dataTestId="patient-basis"
              label="Patient Basis"
              required
              options={[
                { label: "Yes", value: true },
                { label: "No", value: false },
              ]}
              value={formik.values.patientBasis}
              onChange={(e) => {
                const nextPatientBasis = e.target.value;
                formik.setFieldValue("patientBasis", nextPatientBasis);
              }}
              error={
                formik.touched.patientBasis &&
                Boolean(formik.errors.patientBasis)
              }
              disabled={!canEdit}
              helperText={
                formik.touched.patientBasis &&
                Boolean(formik.errors.patientBasis) &&
                formik.errors.patientBasis
              }
            />
          </div>
        </div>
        <Toast
          toastKey="base-configuration-toast"
          aria-live="polite"
          toastType={toastType}
          testId={
            toastType === "danger"
              ? "edit-base-configuration-generic-error-text"
              : "edit-base-configuration-success-text"
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
        {changeScoringDialog && (
          <MeasureGroupsWarningDialog
            open={changeScoringDialog}
            onClose={handleDialogClose}
            onSubmit={handleSubmit}
            modalType={warningDialogModalType}
          />
        )}
      </form>
    </MetaDataWrapper>
  );
};

export default BaseConfiguration;
