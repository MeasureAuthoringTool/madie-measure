import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import tw from "twin.macro";
import styled, { css } from "styled-components";
import InlineEdit from "../../../inlineEdit/InlineEdit";
import Measure from "../../../../models/Measure";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import useCurrentMeasure from "../../useCurrentMeasure";
import "styled-components/macro";
import useOktaTokens from "../../../../hooks/useOktaTokens";
import { Button, Toast } from "@madie/madie-design-system/dist/react";
import DeleteDialog from "./DeleteDialog";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import DateAdapter from "@mui/lab/AdapterDateFns";
import DesktopDatePicker from "@mui/lab/DesktopDatePicker";
import { TextField } from "@mui/material";
import { useFormik } from "formik";
import { HelperText } from "@madie/madie-components";
import { MeasurementPeriodValidator } from "../../../../models/MeasurementPeriodValidator";

interface measureInformationForm {
  measurementPeriodStart: Date;
  measurementPeriodEnd: Date;
}

export const DisplayDiv = styled.div(() => [
  tw`flex`,
  css`
    white-space: pre;
  `,
]);
export const DisplaySpan = styled.span`
  white-space: pre;
`;

const FormErrors = styled.div(() => [
  css`
    max-width: fit-content;
  `,
]);

const Form = tw.form`max-w-xl my-8`;
const MessageDiv = tw.div`ml-3`;
const MessageText = tw.p`text-sm font-medium`;
const SuccessText = tw(MessageText)`text-green-800`;
const ErrorText = tw(MessageText)`text-red-800`;

const INITIAL_VALUES = {
  measurementPeriodStart: null,
  measurementPeriodEnd: null,
} as measureInformationForm;

export default function MeasureInformation() {
  const history = useHistory();
  const measureServiceApi = useMeasureServiceApi();
  const { measure, setMeasure } = useCurrentMeasure();
  const [genericErrorMessage, setGenericErrorMessage] = useState<string>();
  const { getUserName } = useOktaTokens();
  const userName = getUserName();

  // Dialog and toast utilities
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const [successMessage, setSuccessMessage] = useState<string>(null);
  const [errorMessage, setErrorMessage] = useState<string>(null);

  const formik = useFormik({
    initialValues: { ...INITIAL_VALUES },
    validationSchema: MeasurementPeriodValidator,
    onSubmit: async (values: measureInformationForm) =>
      await handleSubmit(values),
  });
  const canEdit = measure.createdBy === userName;

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

  const deleteMeasure = async () => {
    const deletedMeasure: Measure = { ...measure, active: false };
    try {
      const result = await measureServiceApi.updateMeasure(deletedMeasure);
      if (result.status === 200) {
        handleToast("success", "Measure successfully deleted", true);
        setTimeout(() => {
          history.push("/measures");
        }, 3000);
      }
    } catch (e) {
      if (e?.response?.data) {
        const { error, status, message } = e.response.data;
        const errorMessage = `${status}: ${error} ${message}`;
        handleToast("danger", errorMessage, true);
      } else {
        handleToast("danger", e.toString(), true);
      }
    }
  };
  function updateMeasureTitle(text: string): void {
    if (text !== measure.measureName) {
      const newMeasure: Measure = { ...measure, measureName: text };

      measureServiceApi
        .updateMeasure(newMeasure)
        .then(() => {
          setMeasure(newMeasure);
        })
        .catch(({ response }) => {
          if (response.data.measureName) {
            setGenericErrorMessage(
              "Unable to update measure. Reason: " + response.data.measureName
            );
          }
        });
    }
  }

  const handleSubmit = async (values) => {
    const newMeasure: Measure = {
      ...measure,
      measurementPeriodStart: values.measurementPeriodStart,
      measurementPeriodEnd: values.measurementPeriodEnd,
    };
    measureServiceApi
      .updateMeasure(newMeasure)
      .then(() => {
        setSuccessMessage("Measurement Period Updated Successfully");
        setMeasure(newMeasure);
      })
      .catch((err) => {
        setErrorMessage(err.response.data.message);
      });
  };

  useEffect(() => {
    if (measure?.measurementPeriodStart && measure?.measurementPeriodEnd) {
      formik.setFieldValue(
        "measurementPeriodStart",
        measure?.measurementPeriodStart
      );
      formik.setFieldValue(
        "measurementPeriodEnd",
        measure?.measurementPeriodEnd
      );
    }
  }, []);

  function formikErrorHandler(name: string, isError: boolean) {
    if (formik.touched[name] && formik.errors[name]) {
      return (
        <HelperText
          data-testid={`${name}-helper-text`}
          text={formik.errors[name]?.toString()}
          isError={isError}
        />
      );
    }
  }

  return (
    <div tw="px-4 pt-4" data-testid="measure-name-edit">
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        measureName={measure?.measureName}
        deleteMeasure={deleteMeasure}
      />
      {genericErrorMessage && (
        <div tw="bg-red-500 pt-4 px-4 pb-4">
          <span
            tw="text-white"
            data-testid="edit-measure-information-generic-error-text"
          >
            {genericErrorMessage}
          </span>
        </div>
      )}
      <DisplayDiv>
        <span tw="mr-2">Measure Name:</span>
        {canEdit && (
          <InlineEdit
            text={measure.measureName}
            onSetText={updateMeasureTitle}
          />
        )}
        {!canEdit && measure.measureName}
        {canEdit && (
          <Button
            variant="danger-primary"
            data-testid="delete-measure-button"
            disabled={!canEdit}
            onClick={() => setDeleteOpen(true)}
          >
            Delete Measure
          </Button>
        )}
      </DisplayDiv>
      <div tw="flex" data-testid="cql-library-name-display">
        <span tw="mr-2">Measure CQL Library Name:</span>
        <DisplaySpan>{measure.cqlLibraryName || "NA"}</DisplaySpan>
      </div>
      <Toast
        toastKey="measure-information-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "edit-measure-information-generic-error-text"
            : "edit-measure-information-success-text"
        }
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={6000}
      />

      <Form
        className="flex"
        onSubmit={formik.handleSubmit}
        data-testid="measurement-period-form"
      >
        <h5>Measurement Period</h5>
        <div tw="flex">
          <div tw="m-5" data-testid="measurement-period-start-date">
            <LocalizationProvider dateAdapter={DateAdapter}>
              <DesktopDatePicker
                disableOpenPicker={true}
                label="Start"
                inputFormat="MM/dd/yyyy"
                value={formik.values.measurementPeriodStart}
                onChange={(startDate) => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  formik.setFieldValue("measurementPeriodStart", startDate);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    data-testid="measurement-period-start"
                    required
                    helperText={formikErrorHandler(
                      "measurementPeriodStart",
                      true
                    )}
                    error={
                      formik.touched.measurementPeriodStart &&
                      Boolean(formik.errors.measurementPeriodStart)
                    }
                    {...formik.getFieldProps("measurementPeriodStart")}
                  />
                )}
              />
            </LocalizationProvider>
          </div>

          <div tw="m-5" data-testid="measurement-period-end-date">
            <LocalizationProvider dateAdapter={DateAdapter}>
              <DesktopDatePicker
                disableOpenPicker={true}
                label="End"
                inputFormat="MM/dd/yyyy"
                value={formik.values.measurementPeriodEnd}
                onChange={(endDate) => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  formik.setFieldValue("measurementPeriodEnd", endDate);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    data-testid="measurement-period-end"
                    helperText={formikErrorHandler(
                      "measurementPeriodEnd",
                      true
                    )}
                    error={
                      formik.touched.measurementPeriodEnd &&
                      Boolean(formik.errors.measurementPeriodEnd)
                    }
                    {...formik.getFieldProps("measurementPeriodEnd")}
                  />
                )}
              />
            </LocalizationProvider>
          </div>
        </div>

        <Button
          className="qpp-c-button--cyan"
          type="submit"
          data-testid="measurement-period-save-button"
          disabled={!(formik.isValid && formik.dirty)}
          style={{ marginTop: 0 }}
        >
          Save
        </Button>
      </Form>

      <MessageDiv>
        {successMessage && (
          <SuccessText data-testid="measurement-period-success-message">
            {successMessage}
          </SuccessText>
        )}
        {errorMessage && (
          <ErrorText data-testid="measurement-period-error-message">
            {errorMessage}
          </ErrorText>
        )}
      </MessageDiv>
    </div>
  );
}
