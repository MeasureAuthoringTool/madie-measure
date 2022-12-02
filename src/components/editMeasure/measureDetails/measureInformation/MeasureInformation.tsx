import React, { useState, useEffect } from "react";
import { Measure } from "@madie/madie-models";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import "styled-components/macro";
import {
  Button,
  MadieDiscardDialog,
  Toast,
  TextField,
  ReadOnlyTextField,
} from "@madie/madie-design-system/dist/react";
import { Typography } from "@mui/material";
import { useFormik } from "formik";
import { HelperText } from "@madie/madie-components";
import { MeasureSchemaValidator } from "../../../../validations/MeasureSchemaValidator";
import {
  measureStore,
  useOktaTokens,
  routeHandlerStore,
} from "@madie/madie-util";
import { versionFormat } from "../../../util/versionFormat";
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

export default function MeasureInformation() {
  const measureServiceApi = useMeasureServiceApi();
  const { updateMeasure } = measureStore;
  const [measure, setMeasure] = useState<any>(measureStore.state);
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const { getUserName } = useOktaTokens();
  const userName = getUserName();

  const row = {
    display: "flex",
    flexDirection: "row",
  };
  const spaced = {
    marginBottom: "23px",
  };
  const gap = {
    columnGap: "24px",
    "& > * ": {
      flex: 1,
    },
  };
  const formRow = Object.assign({}, row, spaced);
  const formRowGapped = Object.assign({}, formRow, gap);

  // Toast utilities
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
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
  const { resetForm } = formik;
  // tell our routehandler no go
  const { updateRouteHandlerState } = routeHandlerStore;
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);

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

  const handleSubmit = async (values) => {
    const inSyncCql = await synchingEditorCqlContent(
      "",
      measure?.cql,
      values.cqlLibraryName,
      measure?.cqlLibraryName,
      versionFormat(measure?.version, measure?.revisionNumber),
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
      cql: inSyncCql,
      elmJson: updatedElm ? updatedElm : measure.elmJson,
      measureId: values.measureSetId,
    };
    measureServiceApi
      .updateMeasure(newMeasure)
      .then(() => {
        handleToast(
          "success",
          "Measurement Information Updated Successfully",
          true
        );
        // updating measure will propagate update state site wide.
        updateMeasure(newMeasure);
      })
      .catch((err) => {
        handleToast("danger", err.response.data.message, true);
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
    <form
      id="measure-details-form"
      onSubmit={formik.handleSubmit}
      data-testid="measure-information-form"
    >
      <div className="content">
        <div className="subTitle">
          <h2>Name, Version & ID</h2>
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
              formik.touched.measureName && Boolean(formik.errors.measureName)
            }
            {...formik.getFieldProps("measureName")}
          />
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
            error={formik.touched.measureId && Boolean(formik.errors.measureId)}
            {...formik.getFieldProps("measureId")}
          />
          <ReadOnlyTextField
            tabIndex={0}
            placeholder="Version ID"
            label="Version ID"
            id="versionId"
            data-testid="version-id-text-field"
            inputProps={{ "data-testid": "version-id-input" }}
            helperText={formikErrorHandler("versionId", true)}
            size="small"
            error={formik.touched.versionId && Boolean(formik.errors.versionId)}
            {...formik.getFieldProps("versionId")}
          />
        </Box>

        <Box sx={formRowGapped}>
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
            error={formik.touched.ecqmTitle && Boolean(formik.errors.ecqmTitle)}
            {...formik.getFieldProps("ecqmTitle")}
          />
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
      </div>
      {canEdit && (
        <div className="form-actions">
          <Button
            onClick={() => setDiscardDialogOpen(true)}
            variant="outline"
            data-testid="cancel-button"
            disabled={!formik.dirty}
            style={{ marginTop: 20, float: "right", marginRight: 32 }}
          >
            Discard Changes
          </Button>
          <Button
            variant="cyan"
            type="submit"
            data-testid="measurement-information-save-button"
            disabled={!(formik.isValid && formik.dirty)}
            style={{ marginTop: 20, float: "right" }}
          >
            Save
          </Button>
        </div>
      )}
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
