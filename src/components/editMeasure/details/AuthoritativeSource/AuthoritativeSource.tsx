import React, { useState, useEffect } from "react";

import {
  Button,
  MadieDiscardDialog,
  TextField,
  Toast,
} from "@madie/madie-design-system/dist/react";
import {
  useMeasureServiceApi,
  measureStore,
  routeHandlerStore,
} from "@madie/madie-util";
import { useFormik } from "formik";
import useFormikResetOnEvent from "../../../common/useFormikResetOnEvent";
import { MeasureLock } from "@madie/madie-models";
import { AuthoritativeSourceValidator } from "./AuthoritativeSourceValidator";

interface AuthoritativeSourceProps {
  setErrorMessage: Function;
  measureCanEdit: boolean;
}

const AuthoritativeSource = (props: AuthoritativeSourceProps) => {
  const { setErrorMessage, measureCanEdit } = props;
  const measureServiceApi = useMeasureServiceApi();
  const { updateMeasure } = measureStore;
  const [measure, setMeasure] = useState<any>(measureStore.state);
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  // Toast utilities
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

  const handleSubmit = ({ authoritativeSource }) => {
    const modifiedMeasure = {
      ...measure,
      measureMetaData: {
        ...measure?.measureMetaData,
        authoritativeSource: authoritativeSource.trim(),
      },
    };
    measureServiceApi
      .updateMeasure(modifiedMeasure)
      .then((res) => {
        //@ts-ignore
        const { status, data } = res;
        if (status === 200) {
          handleToast(
            "success",
            "Measure Authoritative Source Saved Successfully",
            true
          );
          updateMeasure(data);
        }
      })
      .catch((err) => {
        let message = `Error updating Authoritative Source for "${measure.measureName}"`;
        if (err?.status === 423) {
          updateMeasure({
            ...measure,
            measureLock: {
              lockedBy: err?.response?.data?.message?.replace(
                "Unable to update measure. Measure is locked by ",
                ""
              ),
            } as unknown as MeasureLock,
          });
          formik.resetForm();
          message = err?.response?.data?.message.toString();
        }
        handleToast("danger", message, true);
        setErrorMessage(message);
      });
  };

  const formik = useFormik({
    initialValues: {
      authoritativeSource: measure?.measureMetaData?.authoritativeSource || "",
    },
    enableReinitialize: true,
    validationSchema: AuthoritativeSourceValidator,
    onSubmit: async (values) => await handleSubmit(values),
  });
  useFormikResetOnEvent(formik);

  const { updateRouteHandlerState } = routeHandlerStore;
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);

  const goBackToNav = (e) => {
    if (e.shiftKey && e.keyCode === 9) {
      e.preventDefault();
      document.getElementById("sideNavMeasureAuthoritativeSource").focus();
    }
  };

  const hasError =
    formik.touched.authoritativeSource &&
    Boolean(formik.errors.authoritativeSource);

  return (
    <form
      id="measure-details-form"
      onSubmit={formik.handleSubmit}
      data-testid="measure-authoritative-source"
      style={{ minHeight: 539 }}
    >
      <div className="content">
        <div className="subTitle">
          <h2>Authoritative Source</h2>
          {/* spacing element to prevent discrepancy with the other tabs. */}
          <div style={{ height: 15, marginBottom: 6 }} />
        </div>
        <TextField
          label="Authoritative Source"
          id="authoritativeSource"
          readOnly={!measureCanEdit}
          placeholder="Authoritative Source"
          inputProps={{
            "data-testid": "authoritative-source-input",
          }}
          data-testid="authoritative-source-text-field"
          size="small"
          onKeyDown={goBackToNav}
          error={hasError}
          helperText={hasError ? formik.errors.authoritativeSource : undefined}
          {...formik.getFieldProps("authoritativeSource")}
        />
      </div>
      {measureCanEdit && (
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
            disabled={!formik.dirty}
            type="submit"
            variant="cyan"
            data-testid="authoritative-source-save"
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
            ? "measureAuthoritativeSourceError"
            : "measureAuthoritativeSourceSuccess"
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
          formik.resetForm();
          setDiscardDialogOpen(false);
        }}
        onClose={() => setDiscardDialogOpen(false)}
      />
    </form>
  );
};

export default AuthoritativeSource;
