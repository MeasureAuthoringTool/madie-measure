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
import { Button, Toast } from "@madie/madie-design-system/dist/react";
import "./MeasureMetaData.scss";
const SubHeader = tw.p`mt-1 text-sm text-gray-500`;

export interface MeasureMetadataProps {
  measureMetadataType?: String;
  header?: String;
}

export default function MeasureMetadata(props: MeasureMetadataProps) {
  const { measureMetadataType, header } = props;
  const typeLower = measureMetadataType.toLowerCase();

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
  const canEdit = userName === measure?.createdBy;
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { genericField: getInitialValues(measure, typeLower) },
    onSubmit: (values) => {
      submitForm(values.genericField);
    },
  });
  const { updateRouteHandlerState } = routeHandlerStore;
  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);
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

  return (
    <form
      id="measure-meta-data-form"
      onSubmit={formik.handleSubmit}
      data-testid={`measure${measureMetadataType}`}
    >
      <div className="content">
        <h3>{header}</h3>
        {measureMetadataType === "Steward" && (
          <SubHeader>
            This information will be displayed publicly so be careful what you
            share.
          </SubHeader>
        )}
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
          <button
            className="cancel-button"
            data-testid="cancel-button"
            disabled={!formik.dirty}
            onClick={() => resetForm()}
          >
            Discard Changes
          </button>
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
