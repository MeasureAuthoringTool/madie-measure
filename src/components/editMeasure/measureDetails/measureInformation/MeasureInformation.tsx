import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import tw, { styled } from "twin.macro";
import { Measure } from "@madie/madie-models";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import "styled-components/macro";
import {
  Button,
  Toast,
  TextField,
  ReadOnlyTextField,
} from "@madie/madie-design-system/dist/react";
import DeleteDialog from "./DeleteDialog";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { DialogContent, Divider, Grid, Typography } from "@mui/material";
import { useFormik } from "formik";
import { HelperText } from "@madie/madie-components";
import { MeasureSchemaValidator } from "../../../../validations/MeasureSchemaValidator";
import { measureStore, useOktaTokens } from "@madie/madie-util";
import classNames from "classnames";
import { makeStyles } from "@mui/styles";
import { Box } from "@mui/system";
import {
  parseContent,
  synchingEditorCqlContent,
  validateContent,
} from "@madie/madie-editor";
import "./MeasureInformation.scss";

interface measureInformationForm {
  versionId: string;
  measureName: string;
  cqlLibraryName: string;
  ecqmTitle: string;
  measurementPeriodStart: Date;
  measurementPeriodEnd: Date;
  measureId: string;
  cmsId: string;
}
const Form = styled.form(() => [
  tw`my-8`,
  `max-width: 1360px;
  `,
]);
const MessageDiv = tw.div`ml-3`;
const MessageText = tw.p`text-sm font-medium`;
const SuccessText = tw(MessageText)`text-green-800`;
const ErrorText = tw(MessageText)`text-red-800`;

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
    end: {
      justifyContent: "flex-end",
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
      fontSize: 32,
      padding: 0,
    },
    required: {
      position: "absolute",
      bottom: 8,
      right: 12,
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

  const row = {
    display: "flex",
    flexDirection: "row",
  };
  const spaced = {
    marginTop: "23px",
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
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const [successMessage, setSuccessMessage] = useState<string>(null);
  const [errorMessage, setErrorMessage] = useState<string>(null);
  // our initial values are taken from the measure we subscribe to
  const INITIAL_VALUES = {
    measurementPeriodStart: measure?.measurementPeriodStart,
    measurementPeriodEnd: measure?.measurementPeriodEnd,
    measureName: measure?.measureName,
    cqlLibraryName: measure?.cqlLibraryName,
    ecqmTitle: measure?.ecqmTitle,
    versionId:
      measure?.versionId === null || measure?.versionId === undefined
        ? measure?.id
        : measure?.versionId,
    cmsId: measure?.cmsId,
    measureId: measure?.measureSetId,
  } as measureInformationForm;

  const formik = useFormik({
    initialValues: { ...INITIAL_VALUES },
    validationSchema: MeasureSchemaValidator,
    enableReinitialize: true, // formik will auto set initial variables whenever measure delivers new results
    onSubmit: async (values: measureInformationForm) =>
      await handleSubmit(values),
  });

  const goBackToNav = (e) => {
    if (e.shiftKey && e.keyCode == 9) {
      e.preventDefault();
      document.getElementById("sideNavMeasureInformation").focus();
    }
  };

  const isOwner = measure?.createdBy === userName;
  const canEdit =
    isOwner ||
    measure?.acls?.some(
      (acl) => acl.userId === userName && acl.roles.indexOf("SHARED_WITH") >= 0
    );
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
    const inSyncCql = await synchingEditorCqlContent(
      "",
      measure?.cql,
      values.cqlLibraryName,
      measure?.cqlLibraryName,
      "0.0.000", //as the versioning is not implemented in measure for now we just send default value: 0.0.000
      "measureInformation"
    );

    // Generate updated ELM when Library name is modified
    //  and there are no CQL errors.
    if (INITIAL_VALUES.cqlLibraryName !== values.cqlLibraryName) {
      if (inSyncCql && inSyncCql.trim().length > 0) {
        const cqlErrors = parseContent(inSyncCql);
        const { errors, translation } = await validateContent(inSyncCql);
        if (cqlErrors.length === 0 && errors.length === 0) {
          var updatedElm = JSON.stringify(translation);
        }
      }
    }

    const newMeasure: Measure = {
      ...measure,
      versionId: values.versionId,
      measureName: values.measureName,
      cqlLibraryName: values.cqlLibraryName,
      ecqmTitle: values.ecqmTitle,
      measurementPeriodStart: values.measurementPeriodStart,
      measurementPeriodEnd: values.measurementPeriodEnd,
      cql: inSyncCql,
      elmJson: updatedElm ? updatedElm : measure.elmJson,
      measureId: values.measureSetId,
    };
    measureServiceApi
      .updateMeasure(newMeasure)
      .then(() => {
        setSuccessMessage("Measurement Information Updated Successfully");
        // updating measure will propagate update state site wide.
        updateMeasure(newMeasure);
      })
      .catch((err) => {
        setErrorMessage(err.response.data.message);
      });
  };

  function formikErrorHandler(name: string, isError: boolean) {
    if (formik.touched[name] && formik.errors[name]) {
      return (
        <HelperText
          aria-live="polite"
          data-testid={`${name}-helper-text`}
          id={`${name}-helper-text`}
          text={formik.errors[name]?.toString()}
          isError={isError}
        />
      );
    }
  }

  return (
    <div tw="col-span-5 py-6 pr-8">
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
          <div tw="flex pb-2 pl-6" style={{ fontFamily: "Rubik" }}>
            <h2 tw="w-1/2 mb-0">Information</h2>
            <div tw="w-1/2 self-end ">
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
          </div>
          <Divider />

          <DialogContent>
            <Grid container spacing={4}>
              <Grid item xs={6}>
                <Box sx={formRowGapped}>
                  <TextField
                    placeholder="Measure Name"
                    required
                    disabled={!canEdit}
                    label="Measure Name"
                    id="measureName"
                    inputProps={{
                      "data-testid": "measure-name-input",
                      "aria-required": "true",
                    }}
                    helperText={formikErrorHandler("measureName", true)}
                    data-testid="measure-name-text-field"
                    size="small"
                    onKeyDown={goBackToNav}
                    error={
                      formik.touched.measureName &&
                      Boolean(formik.errors.measureName)
                    }
                    {...formik.getFieldProps("measureName")}
                  />
                  <TextField
                    placeholder="eCQM Name"
                    required
                    disabled={!canEdit}
                    label="eCQM Abbreviated Title"
                    id="ecqmTitle"
                    data-testid="ecqm-text-field"
                    inputProps={{
                      "data-testid": "ecqm-input",
                      "aria-required": "true",
                    }}
                    helperText={formikErrorHandler("ecqmTitle", true)}
                    size="small"
                    error={
                      formik.touched.ecqmTitle &&
                      Boolean(formik.errors.ecqmTitle)
                    }
                    {...formik.getFieldProps("ecqmTitle")}
                  />
                </Box>

                <Box sx={formRow}>
                  <TextField
                    placeholder="Enter CQL Library Name"
                    required
                    disabled={!canEdit}
                    label="Measure CQL Library Name"
                    id="cqlLibraryName"
                    data-testid="cql-library-name"
                    inputProps={{
                      "data-testid": "cql-library-name-input",
                      "aria-required": "true",
                    }}
                    helperText={formikErrorHandler("cqlLibraryName", true)}
                    size="small"
                    error={
                      formik.touched.cqlLibraryName &&
                      Boolean(formik.errors.cqlLibraryName)
                    }
                    {...formik.getFieldProps("cqlLibraryName")}
                  />
                </Box>

                <Box sx={formRowGapped} data-testid="measurement-period-div">
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DesktopDatePicker
                      disableOpenPicker={true}
                      disabled={!canEdit}
                      label="Measurement Period - Start Date"
                      inputFormat="MM/dd/yyyy"
                      aria-required="true"
                      value={formik.values.measurementPeriodStart}
                      onChange={(startDate) => {
                        formik.setFieldValue(
                          "measurementPeriodStart",
                          startDate
                        );
                      }}
                      renderInput={(params) => {
                        const { onChange, ...formikFieldProps } =
                          formik.getFieldProps("measurementPeriodStart");
                        const { inputProps } = params;
                        inputProps["aria-required"] = true;
                        return (
                          <TextField
                            {...formikFieldProps}
                            {...params}
                            inputProps={inputProps}
                            id="measurementPeriodStartDate"
                            required
                            data-testid="measurement-period-start"
                            helperText={formikErrorHandler(
                              "measurementPeriodStart",
                              true
                            )}
                          />
                        );
                      }}
                    />
                  </LocalizationProvider>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DesktopDatePicker
                      disableOpenPicker={true}
                      disabled={!canEdit}
                      label="Measurement Period - End Date"
                      inputFormat="MM/dd/yyyy"
                      value={formik.values.measurementPeriodEnd}
                      onChange={(endDate) => {
                        formik.setFieldValue("measurementPeriodEnd", endDate);
                      }}
                      renderInput={(params) => {
                        const { onChange, ...formikFieldProps } =
                          formik.getFieldProps("measurementPeriodEnd");
                        const { inputProps } = params;
                        inputProps["aria-required"] = true;
                        return (
                          <TextField
                            {...formikFieldProps}
                            {...params}
                            inputProps={inputProps}
                            id="measurementPeriodEndDate"
                            required
                            data-testid="measurement-period-end"
                            helperText={formikErrorHandler(
                              "measurementPeriodEnd",
                              true
                            )}
                          />
                        );
                      }}
                    />
                  </LocalizationProvider>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={formRowGapped}>
                  <ReadOnlyTextField
                    tabIndex={0}
                    placeholder="Measure ID"
                    label="Measure Id"
                    id="measureId"
                    data-testid="measure-id-text-field"
                    inputProps={{ "data-testid": "measure-id-input" }}
                    helperText={formikErrorHandler("measureId", true)}
                    size="small"
                    error={
                      formik.touched.measureId &&
                      Boolean(formik.errors.measureId)
                    }
                    {...formik.getFieldProps("measureId")}
                  />
                </Box>

                <Box sx={formRowGapped}>
                  <ReadOnlyTextField
                    tabIndex={0}
                    placeholder="Version ID"
                    label="Version ID"
                    id="versionId"
                    data-testid="version-id-text-field"
                    inputProps={{ "data-testid": "version-id-input" }}
                    helperText={formikErrorHandler("versionId", true)}
                    size="small"
                    error={
                      formik.touched.versionId &&
                      Boolean(formik.errors.versionId)
                    }
                    {...formik.getFieldProps("versionId")}
                  />
                </Box>

                <Box sx={formRowGapped}>
                  <ReadOnlyTextField
                    tabIndex={0}
                    placeholder="CMS ID"
                    label="CMS Id"
                    id="cmsId"
                    data-testid="cms-id-text-field"
                    inputProps={{ "data-testid": "cms-id-input" }}
                    helperText={formikErrorHandler("cmsId", true)}
                    size="small"
                    error={formik.touched.cmsId && Boolean(formik.errors.cmsId)}
                    {...formik.getFieldProps("cmsId")}
                  />
                </Box>
              </Grid>
            </Grid>
          </DialogContent>

          <Button
            className="qpp-c-button--cyan"
            type="submit"
            data-testid="measurement-information-save-button"
            disabled={!(formik.isValid && formik.dirty)}
            style={{ marginTop: 20, marginLeft: 22 }}
          >
            Save
          </Button>
          {isOwner && (
            <Button
              variant="danger-primary"
              data-testid="delete-measure-button"
              disabled={!isOwner}
              onClick={() => setDeleteOpen(true)}
              style={{ marginTop: 20, float: "right" }}
            >
              Delete Measure
            </Button>
          )}
        </Form>

        <MessageDiv>
          {successMessage && (
            <SuccessText
              data-testid="measurement-information-success-message"
              aria-live="polite"
            >
              {successMessage}
            </SuccessText>
          )}
          {errorMessage && (
            <ErrorText
              data-testid="measurement-information-error-message"
              aria-live="polite"
            >
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
          autoHideDuration={6000}
        />
      </div>
    </div>
  );
}
