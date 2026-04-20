import React from "react";
import CreateCompositeTestCaseRightPanelTabs from "./CreateCompositeTestCaseRightPanelTabs";
import { TextField, TextArea } from "@madie/madie-design-system/dist/react";
import TestCaseSeries from "../../../createTestCase/TestCaseSeries";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { testCaseSeriesStyles, Alert } from "../EditTestCase";
import { useFormikContext } from "formik";
import tw, { styled } from "twin.macro";
import "styled-components/macro";

export default function CompositeRightPanelContent({
  rightPanelActiveTab,
  setRightPanelActiveTab,
  testCaseCanEdit,
  alert,
  setAlert,
  seriesState,
}) {
  const formik: any = useFormikContext();
  function formikErrorHandler(name: string) {
    if (formik.touched[name] && formik.errors[name]) {
      return `${formik.errors[name]}`;
    }
  }
  return (
    <>
      <div className="tab-container">
        <CreateCompositeTestCaseRightPanelTabs
          rightPanelActiveTab={rightPanelActiveTab}
          setRightPanelActiveTab={setRightPanelActiveTab}
        />
      </div>

      <div className="panel-content">
        {rightPanelActiveTab === "actual" && (
          <div data-testId="composite-actual">
            Composite actual results in progress...
          </div>
        )}
        {rightPanelActiveTab === "details" && (
          <div className="panel-content">
            {alert && (
              <Alert
                status={alert?.status}
                role="alert"
                aria-label="Create Alert"
                data-testid="create-test-case-alert"
              >
                {alert?.message}
                <button
                  data-testid="close-create-test-case-alert"
                  type="button"
                  tw="box-content h-4 p-1 ml-3 mb-1.5"
                  data-bs-dismiss="alert"
                  aria-label="Close Alert"
                  onClick={() => setAlert(null)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </Alert>
            )}

            {/* TODO Replace with re-usable form component
               label, input, and error => single input control component */}

            <div id="details-panel">
              <TextField
                placeholder="Test Case Title"
                required
                readOnly={!testCaseCanEdit}
                label="Title"
                id="test-case-title"
                inputProps={{
                  "data-testid": "test-case-title",
                  "aria-describedby": "title-helper-text",
                  "aria-required": true,
                  required: true,
                }}
                helperText={formikErrorHandler("title")}
                size="small"
                error={formik.touched.title && Boolean(formik.errors.title)}
                {...formik.getFieldProps("title")}
                maxLength={250}
              />
              <div tw="mt-6">
                <TextArea
                  placeholder="Test Case Description"
                  id="test-case-description"
                  data-testid="test-case-description"
                  readOnly={!testCaseCanEdit}
                  {...formik.getFieldProps("description")}
                  label="Description"
                  required={false}
                  inputProps={{
                    "data-testid": "test-case-description",
                    "aria-describedby": "description-helper-text",
                  }}
                  onChange={formik.handleChange}
                  value={formik.values.description}
                  error={
                    formik.touched.description &&
                    Boolean(formik.errors.description)
                  }
                  helperText={formikErrorHandler("description")}
                  maxLength={250}
                />
              </div>

              <div tw="mt-6">
                <TestCaseSeries
                  readOnly={!testCaseCanEdit}
                  value={formik.values.series}
                  onChange={(nextValue) => {
                    formik.setFieldTouched("series", true);
                    formik.setFieldValue("series", nextValue, true);
                  }}
                  error={Boolean(formik.errors.series)}
                  helperText={formikErrorHandler("series")}
                  seriesOptions={seriesState.series}
                  sx={testCaseSeriesStyles}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
