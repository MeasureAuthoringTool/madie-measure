import React, { useEffect, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import {
  Button,
  MadieDiscardDialog,
  Toast,
  AutoComplete,
} from "@madie/madie-design-system/dist/react";
import {
  measureStore,
  routeHandlerStore,
  checkUserCanEdit,
} from "@madie/madie-util";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Typography } from "@mui/material";

const asterisk = { color: "#D92F2F", marginRight: 3 };

// Need to have a "-" as placeholder if nothing is selected, but it doesn't have to be an option
// Need to have 2 diff sizes of buttons
interface StewardAndDevelopersProps {
  setErrorMessage: Function;
}
export default function StewardAndDevelopers(props: StewardAndDevelopersProps) {
  const { setErrorMessage } = props;
  const measureServiceApi = useMeasureServiceApi();
  const [organizations, setOrganizations] = useState<string[]>();
  const [measure, setMeasure] = useState<any>(measureStore.state);
  const { updateMeasure } = measureStore;

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

  const canEdit = checkUserCanEdit(measure?.createdBy, measure?.acls);
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      steward: measure?.measureMetaData?.steward || "",
      developers: measure?.measureMetaData?.developers || [],
    },
    validationSchema: Yup.object({
      steward: Yup.string().required("Steward is required"),
      developers: Yup.array().min(1, "At least one developer is required"),
    }),
    onSubmit: (values) => {
      submitForm(values);
    },
  });
  const { resetForm } = formik;

  // Updates the measure in DB, and also the measureStore
  const submitForm = (values) => {
    const submitMeasure = {
      ...measure,
      measureMetaData: {
        ...measure.measureMetaData,
        steward: values.steward,
        developers: values.developers,
      },
    };

    measureServiceApi
      .updateMeasure(submitMeasure)
      .then(() => {
        handleToast(
          "success",
          `Steward and Developers Information Saved Successfully`,
          true
        );
        updateMeasure(submitMeasure);
      })
      .catch(() => {
        const message = `Error updating measure "${measure.measureName}"`;
        setErrorMessage(message);
      });
  };

  const goBackToNav = (e) => {
    if (e.shiftKey && e.keyCode == 9) {
      e.preventDefault();
      document.getElementById("sideNavMeasureSteward").focus();
    }
  };

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Route handle store will give warning message
  // if form is dirty and user ties to navigate across SPAs
  const { updateRouteHandlerState } = routeHandlerStore;
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);

  // fetch organizations DB using measure service and sorts alphabetically
  useEffect(() => {
    measureServiceApi
      .getAllOrganizations()
      .then((response) => {
        const organizationsList = response
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((element) => element.name);
        setOrganizations(organizationsList);
      })
      .catch(() => {
        const message = `Error fetching organizations`;
        setErrorMessage(message);
      });
  }, []);

  return (
    <form
      id="measure-details-form"
      onSubmit={formik.handleSubmit}
      data-testid="measure-steward-developers-form"
    >
      <div className="content">
        <div className="subTitle">
          <h2>Steward & Developers</h2>
          <div className="required">
            <Typography
              style={{ fontSize: 14, fontWeight: 300, fontFamily: "Rubik" }}
            >
              <span style={asterisk}>*</span>
              Indicates required field
            </Typography>
          </div>
        </div>
        {organizations && (
          <>
            <div tw="mb-4 w-1/2">
              <AutoComplete
                id="steward"
                dataTestId="steward"
                label="Steward"
                placeholder="-"
                required={true}
                disabled={!canEdit}
                error={formik.touched.steward && formik.errors["steward"]}
                helperText={formik.touched.steward && formik.errors["steward"]}
                options={organizations}
                {...formik.getFieldProps("steward")}
                onChange={formik.setFieldValue}
                onKeyDown={goBackToNav}
              />
            </div>
            <div tw="mb-4 w-1/2">
              <AutoComplete
                multiple
                id="developers"
                data-testid="developers"
                label="Developers"
                placeholder="-"
                required={true}
                disabled={!canEdit}
                error={formik.touched.developers && formik.errors["developers"]}
                helperText={
                  formik.touched.developers && formik.errors["developers"]
                }
                options={organizations}
                {...formik.getFieldProps("developers")}
                onChange={formik.setFieldValue}
              />
            </div>
          </>
        )}
      </div>
      {canEdit && (
        <div className="form-actions">
          <Button
            variant="outline"
            data-testid="cancel-button"
            disabled={!formik.dirty}
            onClick={() => setDiscardDialogOpen(true)}
            style={{ marginTop: 20, float: "right", marginRight: 32 }}
          >
            Discard Changes
          </Button>
          <Button
            disabled={!(formik.isValid && formik.dirty)}
            type="submit"
            variant="cyan"
            data-testid={`steward-and-developers-save`}
            style={{ marginTop: 20, float: "right" }}
          >
            Save
          </Button>
        </div>
      )}
      <Toast
        toastKey="steward-and-developers-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? `steward-and-developers-error`
            : `steward-and-developers-success`
        }
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={6000}
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
