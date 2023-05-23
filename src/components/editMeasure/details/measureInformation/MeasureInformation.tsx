import React, { useState, useEffect } from "react";
import { Endorsement, Measure } from "@madie/madie-models";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import "styled-components/macro";
import {
  AutoComplete,
  Button,
  MadieDiscardDialog,
  Toast,
  TextField,
  ReadOnlyTextField,
} from "@madie/madie-design-system/dist/react";
import { Typography, FormControlLabel, Checkbox } from "@mui/material";
import { useFormik } from "formik";
import { MeasureSchemaValidator } from "../../../../validations/MeasureSchemaValidator";
import {
  measureStore,
  routeHandlerStore,
  checkUserCanEdit,
  PROGRAM_USE_CONTEXTS,
} from "@madie/madie-util";
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
  experimental: boolean;
  programUseContext: any;
  endorsements: Array<Endorsement>;
  endorsementId: string;
}

interface MeasureInformationProps {
  setErrorMessage: Function;
}

export default function MeasureInformation(props: MeasureInformationProps) {
  const { setErrorMessage } = props;
  const measureServiceApi = useMeasureServiceApi();
  const [endorsers, setEndorsers] = useState<string[]>();
  const [endorsementIdRequired, setEndorsementIdRequired] = useState<boolean>();
  const { updateMeasure } = measureStore;
  const [measure, setMeasure] = useState<any>(measureStore.state);
  const programUseContextOptions: string[] = PROGRAM_USE_CONTEXTS.map(
    (puc) => puc.display
  );
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
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
    experimental: measure?.measureMetaData?.experimental || false,
    programUseContext: measure?.programUseContext || null,
    endorsements: measure?.measureMetaData?.endorsements || [],
    endorsementId: measure?.measureMetaData?.endorsements?.[0]?.endorsementId,
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

  // fetch endorsers DB using measure service and sorts alphabetically
  useEffect(() => {
    measureServiceApi
      .getAllEndorsers()
      .then((response) => {
        const endorsers = response
          .sort((a, b) =>
            a.endorserOrganization.localeCompare(b.endorserOrganization)
          )
          .map((element) => element.endorserOrganization);
        setEndorsers(endorsers);
      })
      .catch(() => {
        const message = `Error fetching endorsers`;
        setErrorMessage(message);
      });
  }, []);

  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );

  const handleEndorserChange = (selectedValue: string) => {
    if (selectedValue === "" || selectedValue === "-") {
      selectedValue = null;
    }
    const newList: Endorsement[] = [];
    newList.push({
      endorser: selectedValue,
    });

    formik.setFieldValue("endorsements", newList);
    if (selectedValue === null) {
      setEndorsementIdRequired(false);
      formik.setFieldValue("endorsementId", "");
      formik.setFieldValue("endorserSystemId", null);
    } else {
      setEndorsementIdRequired(true);
      formik.setFieldValue(
        "endorserSystemId",
        "https://madie.cms.gov/measure/nqfId"
      );
    }
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

  const validateEndorser = (
    endorser: string,
    endorsementId: string
  ): boolean => {
    // empty string needs to be considered
    if (endorser && endorsementId === "") {
      handleToast("danger", "Endorser Number is Required", true);
      return false;
    }
    if (!!!endorser && endorsementId !== "") {
      handleToast(
        "danger",
        "Endorser Organization is set to None, Endorser Number must not contain a value",
        true
      );
      return false;
    }
    if (endorsementId) {
      const stripped = endorsementId.replace(/^[0-9a-zA-Z]*$/, "");
      if (stripped && stripped.length > 0) {
        handleToast("danger", "Endorser Number must be alpha numeric", true);
        return false;
      }
    }
    return true;
  };
  const handleSubmit = async (values) => {
    let endorsersValid = true;
    // we only want to validate this field if it's not an empty array.
    if (values.endorsements.length > 0) {
      endorsersValid = validateEndorser(
        values.endorsements[0]?.endorser,
        values.endorsementId
      );
    }
    if (endorsersValid) {
      const inSyncCql = await synchingEditorCqlContent(
        "",
        measure?.cql,
        values.cqlLibraryName,
        measure?.cqlLibraryName,
        measure?.version,
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
        programUseContext: values.programUseContext,
        measureMetaData: {
          ...measure?.measureMetaData,
          experimental: values.experimental,
          endorsements: [
            {
              endorser: values.endorsements[0]?.endorser || "",
              endorsementId: values.endorsementId || "",
              endorserSystemId:
                values.endorsements[0]?.endorserSystemId || null,
            },
          ],
        },
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
        // update to alert
        .catch((err) => {
          setErrorMessage(err?.response?.data?.message?.toString());
        });
    }
  };

  function formikErrorHandler(name: string, isError: boolean) {
    if (formik.touched[name] && formik.errors[name]) {
      return `${formik.errors[name]}`;
    }
  }

  // we create a state to track current focus. We only display helper text on focus and remove current focus on blur
  const [focusedField, setFocusedField] = useState("");
  const onBlur = (field) => {
    setFocusedField("");
    formik.setFieldTouched(field);
  };
  const onFocus = (field) => {
    setFocusedField(field);
  };

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
            onFocus={() => onFocus("measureName")}
            placeholder="Measure Name"
            required
            disabled={!canEdit}
            label="Measure Name"
            id="measureName"
            inputProps={{
              "data-testid": "measure-name-input",
              "aria-required": "true",
            }}
            helperText={
              (formik.touched["measureName"] ||
                focusedField === "measureName") &&
              formikErrorHandler("measureName", true)
            }
            data-testid="measure-name-text-field"
            size="small"
            onKeyDown={goBackToNav}
            error={
              formik.touched.measureName && Boolean(formik.errors.measureName)
            }
            {...formik.getFieldProps("measureName")}
            onBlur={() => {
              onBlur("measureName");
            }}
          />
          <TextField
            onFocus={() => onFocus("cqlLibraryName")}
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
            helperText={
              formik.touched["cqlLibraryName"] &&
              focusedField === "cqlLibraryName" &&
              formikErrorHandler("cqlLibraryName", true)
            }
            size="small"
            error={
              formik.touched.cqlLibraryName &&
              Boolean(formik.errors.cqlLibraryName)
            }
            {...formik.getFieldProps("cqlLibraryName")}
            onBlur={() => {
              onBlur("cqlLibraryName");
            }}
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
        <Box sx={formRowGapped}>
          <FormControlLabel
            control={
              <Checkbox
                {...formik.getFieldProps("experimental")}
                checked={formik.values.experimental}
                disabled={!canEdit}
                name="experimental"
                id="experimental"
                data-testid="experimental"
              />
            }
            label="Experimental"
          />
        </Box>
        <Box sx={formRowGapped}>
          <AutoComplete
            formControl={formik.getFieldProps("programUseContext")}
            id="programUseContext"
            dataTestId="programUseContext"
            label="Program Use Context"
            placeHolder="-"
            required={false}
            disabled={!canEdit}
            error={false}
            helperText=""
            multipleSelect={false}
            limitTags={1}
            options={programUseContextOptions}
            value={formik.values?.programUseContext?.display ?? null}
            onClose={() => {}}
            onChange={(id, value) => {
              if (value) {
                formik.setFieldValue(
                  "programUseContext",
                  PROGRAM_USE_CONTEXTS.find((puc) => value === puc.display)
                );
              } else {
                formik.setFieldValue("programUseContext", null);
              }
            }}
          />
          <div />
          <div />
          <div />
        </Box>
        <Box sx={formRowGapped}>
          <AutoComplete
            id="endorser"
            dataTestId="endorser"
            label="Endorsing Organization"
            placeholder="-"
            required={true}
            disabled={!canEdit}
            error={formik.touched.endorsements && formik.errors["endorsements"]}
            helperText={
              formik.touched.endorsements && formik.errors["endorsements"]
            }
            options={endorsers}
            value={formik.values.endorsements.map(
              (selected) => selected?.endorser
            )}
            onChange={(_event: any, selectedValues: any | null) => {
              handleEndorserChange(selectedValues);
            }}
            onKeyDown={goBackToNav}
          />
          <TextField
            onFocus={() => onFocus("endorsementId")}
            placeholder="-"
            required
            disabled={!canEdit || !endorsementIdRequired}
            label="Endorsement #"
            id="endorsementId"
            inputProps={{
              "data-testid": "endorsement-number-input",
              "aria-required": "true",
            }}
            helperText={
              (formik.touched["endorsementId"] ||
                focusedField === "endorsementId") &&
              formikErrorHandler("endorsementId", true)
            }
            data-testid="endorsement-number-text-field"
            size="small"
            onKeyDown={goBackToNav}
            error={
              formik.touched.endorsements && Boolean(formik.errors.endorsements)
            }
            {...formik.getFieldProps("endorsementId")}
            onBlur={() => {
              onBlur("endorsementId");
            }}
          />
          <div />
          <div />
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
