import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import tw from "twin.macro";
import styled, { css } from "styled-components";
import { Measure } from "@madie/madie-models";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import "styled-components/macro";
import { Button, Toast } from "@madie/madie-design-system/dist/react";
import DeleteDialog from "./DeleteDialog";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import DateAdapter from "@mui/lab/AdapterDateFns";
import DesktopDatePicker from "@mui/lab/DesktopDatePicker";
import {
  TextField,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import { HelperText } from "@madie/madie-components";
import { MeasureSchemaValidator } from "../../../../validations/MeasureSchemaValidator";
import { measureStore, useOktaTokens } from "@madie/madie-util";
import classNames from "classnames";
import { makeStyles } from "@mui/styles";

interface measureInformationForm {
  measureName: string;
  cqlLibraryName: string;
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

const Form = tw.form`max-w-xl my-8`;
const MessageDiv = tw.div`ml-3`;
const MessageText = tw.p`text-sm font-medium`;
const SuccessText = tw(MessageText)`text-green-800`;
const ErrorText = tw(MessageText)`text-red-800`;

const INITIAL_VALUES = {
  measureName: "",
  cqlLibraryName: "",
  measurementPeriodStart: null,
  measurementPeriodEnd: null,
} as measureInformationForm;

export default function MeasureInformation() {
  const history = useHistory();
  const measureServiceApi = useMeasureServiceApi();
  const { updateMeasure } = measureStore;
  const [measure, setMeasure] = useState<any>(measureStore.state);
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const [genericErrorMessage, setGenericErrorMessage] = useState<string>();
  const { getUserName } = useOktaTokens();
  const userName = getUserName();

  const useStyles = makeStyles({
    row: {
      display: "flex",
      flexDirection: "row",
    },
    spaced: {
      marginTop: 23,
    },
    end: {
      justifyContent: "flex-end",
    },
    gap: {
      columnGap: 24,
      "& > * ": {
        flex: 1,
      },
    },
    dialogTitle: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "24px 32px",
    },
    title: {
      fontFamily: "Rubik",
      fontSize: 24,
      padding: 0,
    },
    fieldName: {
      fontFamily: "Rubik",
      fontSize: 15,
      padding: 0,
      fontWeight: 500,
    },
    info: {
      fontSize: 14,
      fontWeight: 300,
      fontFamily: "Rubik",
    },
    asterisk: {
      color: "#D92F2F",
      marginRight: 3,
    },
  });
  const classes = useStyles();
  const flexEnd = classNames(classes.row, classes.end);
  const formRow = classNames(classes.row, classes.spaced);
  const formRowGapped = classNames(formRow, classes.gap);

  // Dialog and toast utilities
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const [successMessage, setSuccessMessage] = useState<string>(null);
  const [errorMessage, setErrorMessage] = useState<string>(null);

  const formik = useFormik({
    initialValues: { ...INITIAL_VALUES },
    validationSchema: MeasureSchemaValidator,
    onSubmit: async (values: measureInformationForm) =>
      await handleSubmit(values),
  });
  const canEdit = measure?.createdBy === userName;
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

  const handleSubmit = async (values) => {
    const newMeasure: Measure = {
      ...measure,
      measureName: values.measureName,
      cqlLibraryName: values.cqlLibraryName,
      measurementPeriodStart: values.measurementPeriodStart,
      measurementPeriodEnd: values.measurementPeriodEnd,
    };
    measureServiceApi
      .updateMeasure(newMeasure)
      .then(() => {
        setSuccessMessage("Measurement Information Updated Successfully");
        setMeasure(newMeasure);
        updateMeasure(newMeasure);
      })
      .catch((err) => {
        setErrorMessage(err.response.data.message);
      });
  };

  useEffect(() => {
    formik.setFieldValue("measureName", measure?.measureName);
    formik.setFieldValue("cqlLibraryName", measure?.cqlLibraryName);
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
  }, [measure]);

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
    <div tw="px-1 pt-1" data-testid="measure-information-edit">
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

      <Form
        style={{ marginTop: 0 }}
        onSubmit={formik.handleSubmit}
        data-testid="measurement-information-form"
      >
        <div className={classes.dialogTitle}>
          <DialogTitle className={classes.title}>Information</DialogTitle>
        </div>

        <DialogContent>
          <div className={flexEnd}>
            <Typography className={classes.info}>
              <span className={classes.asterisk}>*</span>
              Indicates required field
            </Typography>
          </div>

          <div>
            <Divider style={{ marginTop: 20, marginBottom: 20 }} />
          </div>

          <DisplayDiv>
            <span className={classes.asterisk}>*</span>
            <span tw="mr-2" className={classes.fieldName}>
              Measure Name:
            </span>
          </DisplayDiv>
          <div className={formRowGapped}>
            <TextField
              placeholder="Measure Name"
              required
              disabled={!canEdit}
              label="Measure Name"
              id="measureName"
              inputProps={{ "data-testid": "measure-name-input" }}
              helperText={formikErrorHandler("measureName", true)}
              data-testid="measure-name-text-field"
              size="small"
              error={
                formik.touched.measureName && Boolean(formik.errors.measureName)
              }
              {...formik.getFieldProps("measureName")}
            />
          </div>

          <br />
          <DisplayDiv>
            <span className={classes.asterisk}>*</span>
            <span tw="mr-2" className={classes.fieldName}>
              Measure CQL Library Name:
            </span>
          </DisplayDiv>
          <div className={formRowGapped}>
            <TextField
              placeholder="Enter CQL Library Name"
              required
              disabled={!canEdit}
              label="Measure CQL Library Name"
              id="cqlLibraryName"
              data-testid="cql-library-name"
              inputProps={{ "data-testid": "cql-library-name-input" }}
              helperText={formikErrorHandler("cqlLibraryName", true)}
              size="small"
              error={
                formik.touched.cqlLibraryName &&
                Boolean(formik.errors.cqlLibraryName)
              }
              {...formik.getFieldProps("cqlLibraryName")}
            />
          </div>

          <br />
          <DisplayDiv>
            <span className={classes.asterisk}>*</span>
            <span tw="mr-2" className={classes.fieldName}>
              Measurement Period:
            </span>
          </DisplayDiv>
          <div className={formRowGapped} data-testid="measurement-period-div">
            <LocalizationProvider dateAdapter={DateAdapter}>
              <DesktopDatePicker
                disableOpenPicker={true}
                disabled={!canEdit}
                label="Start Date"
                inputFormat="MM/dd/yyyy"
                value={formik.values.measurementPeriodStart}
                onChange={(startDate) => {
                  formik.setFieldValue("measurementPeriodStart", startDate);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
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
                    data-testid="measurement-period-start"
                  />
                )}
              />
            </LocalizationProvider>
            <LocalizationProvider dateAdapter={DateAdapter}>
              <DesktopDatePicker
                disableOpenPicker={true}
                disabled={!canEdit}
                label="End Date"
                inputFormat="MM/dd/yyyy"
                value={formik.values.measurementPeriodEnd}
                onChange={(endDate) => {
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
        </DialogContent>

        <Button
          className="qpp-c-button--cyan"
          type="submit"
          data-testid="measurement-information-save-button"
          disabled={!(formik.isValid && formik.dirty)}
          style={{ marginTop: 20 }}
        >
          Save
        </Button>
        {canEdit && (
          <Button
            variant="danger-primary"
            data-testid="delete-measure-button"
            disabled={!canEdit}
            onClick={() => setDeleteOpen(true)}
            style={{ marginTop: 20, float: "right" }}
          >
            Delete Measure
          </Button>
        )}
      </Form>

      <MessageDiv>
        {successMessage && (
          <SuccessText data-testid="measurement-information-success-message">
            {successMessage}
          </SuccessText>
        )}
        {errorMessage && (
          <ErrorText data-testid="measurement-information-error-message">
            {errorMessage}
          </ErrorText>
        )}
      </MessageDiv>

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        measureName={measure?.measureName}
        deleteMeasure={deleteMeasure}
      />
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
    </div>
  );
}
