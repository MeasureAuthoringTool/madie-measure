import React, { useEffect, useState } from "react";
import tw from "twin.macro";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import { useFormik } from "formik";
import getInitialValues, { setMeasureMetadata } from "./MeasureMetadataHelper";
import {
  measureStore,
  useOktaTokens,
  routeHandlerStore,
} from "@madie/madie-util";
import {
  Button,
  Toast,
  MadieDiscardDialog,
} from "@madie/madie-design-system/dist/react";
import "./MeasureMetaData.scss";
import _ from "lodash";
const SubHeader = tw.p`mt-1 text-sm text-gray-500`;

export interface MeasureMetadataProps {
  measureMetadataType?: String;
  header?: String;
}

export default function MeasureMetadata(props: MeasureMetadataProps) {
  const { measureMetadataType, header } = props;
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
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  // toast utilities
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const onToastClose = () => {
    setToastType(null);
    setToastMessage("");
    setToastOpen(false);
  };
  const handleToast = (type, message, open) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(open);
  };

  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const canEdit =
    measure?.createdBy === userName ||
    measure?.acls?.some(
      (acl) => acl.userId === userName && acl.roles.indexOf("SHARED_WITH") >= 0
    );
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { genericField: getInitialValues(measure, typeLower) },
    onSubmit: (values) => {
      submitForm(values.genericField.trim());
    },
  });
  const { updateRouteHandlerState } = routeHandlerStore;
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
        handleToast("danger", message + " for " + measureMetadataType, true);
      });
  };

  const discardChanges = () => {
    resetForm();
    setDiscardDialogOpen(false);
  };

  return (
    <form
      id="measure-meta-data-form"
      onSubmit={formik.handleSubmit}
      data-testid={`measure${measureMetadataType}`}
    >
      <div className="content">
        <div className="subTitle">
          <h2>{header}</h2>
        </div>
        <label htmlFor={`measure-${typeLower}`}>{measureMetadataType}</label>
        <textarea
          readOnly={!canEdit}
          name={`measure-${typeLower}`}
          id={`measure-${typeLower}`}
          autoComplete={`measure-${typeLower}`}
          onChange={formik.handleChange}
          value={formik.values.genericField}
          placeholder={`${measureMetadataType}`}
          data-testid={`measure${measureMetadataType}Input`}
          {...formik.getFieldProps("genericField")}
        />
      </div>
      {canEdit && (
        <div className="form-actions">
          <Button
            className="cancel-button"
            data-testid="cancel-button"
            disabled={!formik.dirty}
            onClick={() => setDiscardDialogOpen(true)}
          >
            Discard Changes
          </Button>
          <Button
            disabled={!(formik.isValid && formik.dirty)}
            type="submit"
            variant="cyan"
            data-testid={`measure${measureMetadataType}Save`}
          >
            Save
          </Button>
        </div>
      )}

      <MadieDiscardDialog
        open={discardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
        onContinue={discardChanges}
      />
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
      />
    </form>
  );
}
