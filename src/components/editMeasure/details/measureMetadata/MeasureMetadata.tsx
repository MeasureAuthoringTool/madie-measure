import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import useFormikResetOnEvent from "../../../common/useFormikResetOnEvent";
import { Typography } from "@mui/material";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import getInitialValues, { setMeasureMetadata } from "./MeasureMetadataHelper";
import {
  measureStore,
  routeHandlerStore,
  checkUserCanEdit,
} from "@madie/madie-util";
import { Button, MadieDiscardDialog, Toast } from "@madie/madie-design-system";
import _ from "lodash";
import TextEditor from "../../populationCriteria/groups/TextEditor";

export interface MeasureMetadataProps {
  measureMetadataId?: string;
  measureMetadataType?: string;
  header?: string;
  setErrorMessage: Function;
  required?: boolean;
}

export default function MeasureMetadata(props: MeasureMetadataProps) {
  const { setErrorMessage, required } = props;
  const { measureMetadataId, measureMetadataType, header } = props;
  const typeLower = _.kebabCase(measureMetadataType.toLowerCase());
  const { updateMeasure } = measureStore;
  const [measure, setMeasure] = useState<any>(measureStore.state);
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  let measureMetaData = measure?.measureMetaData || {};
  const measureServiceApi = useMeasureServiceApi();
  // toast utilities
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

  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { genericField: getInitialValues(measure, typeLower) },
    onSubmit: (values) => {
      submitForm(values.genericField.trim());
    },
  });
  useFormikResetOnEvent(formik);

  const goBackToNav = (e) => {
    if (e.shiftKey && e.keyCode == 9) {
      e.preventDefault();
      document.getElementById("sideNavMeasure" + measureMetadataId).focus();
    }
  };

  const { updateRouteHandlerState } = routeHandlerStore;
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);

  useEffect(() => {
    if (!getInitialValues(measure, typeLower)) {
      formik.setFieldValue("genericField", "");
    }
  }, [measureMetadataType]);

  const { resetForm } = formik;
  const submitForm = (genericField: string) => {
    measure.measureMetaData = { ...measureMetaData };
    setMeasureMetadata(measure, typeLower, genericField);

    measureServiceApi
      .updateMeasure(measure)
      .then(() => {
        handleToast(
          "success",
          `Measure ${measureMetadataType} Information Saved Successfully`,
          true
        );
        updateMeasure(measure);
      })
      .catch((reason) => {
        const message = `Error updating measure "${measure.measureName}"`;
        setErrorMessage(message);
      });
  };

  return (
    <form
      id="measure-details-form"
      onSubmit={formik.handleSubmit}
      data-testid={`measure-${_.kebabCase(measureMetadataType)}`}
    >
      <div className="content">
        <div className="subTitle">
          <h2>{header}</h2>
          {required ? (
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
          ) : (
            // spacing element to prevent discrepancy.
            <div style={{ height: 15, marginBottom: 6 }} />
          )}
        </div>
        <TextEditor
          label={measureMetadataType}
          setFieldValue={formik.setFieldValue}
          required={required}
          canEdit={canEdit}
          data-testid={`measure-${_.kebabCase(measureMetadataType)}-input`}
          {...formik.getFieldProps("genericField")}
        />
      </div>
      {canEdit && (
        <div className="form-actions">
          <Button
            variant="outline"
            disabled={!formik.dirty}
            data-testid="discard-button"
            onClick={() => setDiscardDialogOpen(true)}
            style={{ marginTop: 20, float: "right", marginRight: 32 }}
          >
            Discard Changes
          </Button>
          <Button
            disabled={!(formik.isValid && formik.dirty)}
            type="submit"
            variant="cyan"
            data-testid={`measure-${_.kebabCase(measureMetadataType)}-save`}
            style={{ marginTop: 20, float: "right" }}
          >
            Save
          </Button>
        </div>
      )}
      <Toast
        toastKey="measure-information-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? `measure${measureMetadataType}Error`
            : `measure${measureMetadataType}Success`
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
          resetForm();
          setDiscardDialogOpen(false);
        }}
        onClose={() => setDiscardDialogOpen(false)}
      />
    </form>
  );
}
