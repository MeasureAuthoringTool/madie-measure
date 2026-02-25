import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  MadieDiscardDialog,
  MadieSpinner,
  Toast,
  NumberInput,
} from "@madie/madie-design-system/dist/react";
import { useFormik } from "formik";
import {
  measureStore,
  checkUserCanEdit,
  routeHandlerStore,
} from "@madie/madie-util";
import "../testCaseConfiguration.scss";
import { Typography } from "@mui/material";
import _ from "lodash";
import * as Yup from "yup";
import Tooltip from "@mui/material/Tooltip";
import useTestCaseServiceApi from "../../../api/useTestCaseServiceApi";
import { TestCaseListProps } from "../../testCaseLanding/common/interfaces";

const TestCaseData = (props: TestCaseListProps) => {
  const [measure, setMeasure] = useState<any>(measureStore.state);
  const { updateRouteHandlerState } = routeHandlerStore;
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState();
  const [toastType, setToastType] = useState<string>("danger");
  const testCaseService = useRef(useTestCaseServiceApi());
  const [executing, setExecuting] = useState<boolean>(false);
  const { setShiftTestCaseDatesWarnings } = props;

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls
  );
  const isQdm = measure?.model?.includes("QDM");

  const formik = useFormik({
    initialValues: { shiftTestCaseDates: "" },
    validationSchema: Yup.object().shape({
      shiftTestCaseDates: Yup.string().required(
        "Must be a valid number of years"
      ),
    }),
    enableReinitialize: true,
    onSubmit: async (values) => {
      setExecuting(true);
      await handleSubmit(values);
      // setExecuting(false);
    },
  });
  const { resetForm } = formik;

  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty, updateRouteHandlerState]);

  const onToastClose = () => {
    setToastType("danger");
    // setToastMessage("");
    setToastOpen(false);
  };
  const handleToast = (type, message, open) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(open);
  };

  const handleSubmit = async (values) => {
    //TODO. could we make the APIs return the same structure so we don't need two separate error handlers?
    // sure Greg ...  Tech Debt MAT-8377
    //  OTOH, I think there is ticket for just getting rid of the TestCaseData testShiftCase https://jira.cms.gov/browse/MAT-8379
    if (isQdm) {
      await testCaseService.current
        .shiftAllQdmTestCaseDates(
          measure.id,
          parseInt(formik.values.shiftTestCaseDates)
        )
        .then((response) => {
          if (response.failed.length === 0) {
            handleToast(
              "success",
              `All Test Case dates successfully shifted.`,
              true
            );
          } else {
            setShiftTestCaseDatesWarnings((prevState) => [
              ...prevState,
              ...response.failed,
            ]);
          }
        })
        .catch((err) => {
          handleToast("danger", err.message, true);
        });
    } else {
      testCaseService.current
        .shiftAllQiCoreTestCaseDates(
          measure.id,
          parseInt(formik.values.shiftTestCaseDates)
        )
        .then((response) => {
          if (response.failed.length > 0) {
            setShiftTestCaseDatesWarnings((prevState) => [
              ...prevState,
              ...response.failed,
            ]);
          } else {
            handleToast(
              "success",
              `All Test Case dates successfully shifted.`,
              true
            );
          }
        })
        .catch((err) => {
          handleToast("danger", err.message, true);
        });
    }
    setExecuting(false);
    formik.resetForm();
  };

  return executing ? (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "calc(10% - 40px)",
      }}
    >
      <MadieSpinner style={{ height: 50, width: 50 }} />
    </div>
  ) : (
    <form
      id="test-case-data-form"
      data-testid={`test-case-data-form`}
      className="test-case-config-form"
      onSubmit={formik.handleSubmit}
    >
      <div className="form-title">
        <h2>Test Case Data</h2>
        <Typography>
          <span>*</span>
          Indicates required field
        </Typography>
      </div>
      <span className="helper-info-text">
        Shift dates on all test cases by the number of years being changed.
        Entering a negative number will shift the test cases years backwards.
        Feb 29 in Leap Years - Feb 28 in non Leap Years.
      </span>
      <span className="helper-info-text">
        Note that resulting years prior to 1900 will be set to 1900 and after
        9999 will be set to 9999.
      </span>
      <div className="form-elements">
        <NumberInput
          className="input-field"
          label="Shift Test Case Dates"
          id="shift-test-case-dates"
          placeholder="# of Years"
          readOnly={!canEdit || _.isEmpty(measure?.testCases || executing)}
          {...formik.getFieldProps("shiftTestCaseDates")}
          error={
            formik.touched.shiftTestCaseDates &&
            Boolean(formik.errors.shiftTestCaseDates)
          }
          helperText={
            formik.touched.shiftTestCaseDates &&
            formik.errors.shiftTestCaseDates
          }
          title={_.isEmpty(measure?.testCases) && "No Test Cases Available"}
        />
      </div>
      <div className="form-actions">
        <Button
          variant="outline"
          disabled={!formik.dirty || !canEdit}
          data-testid="cancel-button"
          onClick={() => setDiscardDialogOpen(true)}
          className="cancel-button"
        >
          Discard Changes
        </Button>
        <Tooltip
          title={_.isEmpty(measure?.testCases) && "No Test Cases Available"}
        >
          <span>
            <Button
              variant="cyan"
              disabled={
                !(formik.isValid && formik.dirty) || !canEdit || executing
              }
              data-testid={`test-case-data-save`}
              type="submit"
              className="save-button"
            >
              Save
            </Button>
          </span>
        </Tooltip>
      </div>
      <Toast
        toastKey="shift-all-test-case-dates-toast"
        aria-live="polite"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "shift-all-test-case-dates-generic-error-text"
            : "shift-all-test-case-dates-success-text"
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
        onClose={() => {
          setDiscardDialogOpen(false);
        }}
      />
    </form>
  );
};
export default TestCaseData;
