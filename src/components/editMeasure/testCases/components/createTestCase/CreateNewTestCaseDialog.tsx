import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import queryString from "query-string";
import { TestCase, Measure } from "@madie/madie-models";
import { TestCaseValidator } from "../../validators/TestCaseValidator";
import {
  MadieDialog,
  TextField,
  Toast,
  TextArea,
} from "@madie/madie-design-system/dist/react";
import { Box } from "@mui/system";
import { InputLabel, Typography } from "@mui/material";
import { useFormik } from "formik";
import useTestCaseServiceApi from "../../api/useTestCaseServiceApi";
import TestCaseSeries from "./TestCaseSeries";
import { sanitizeUserInput } from "../../util/Utils";
import { defaultTestCaseJson } from "../../util/QdmTestCaseHelper";
import { defaultQiCoreTestCaseJson } from "../../util/QiCoreTestCaseHelper";
import checkSpecialCharacters from "../../util/checkSpecialCharacters";

interface Toast {
  toastOpen: boolean;
  toastType: string;
  toastMessage: string;
}

interface navigationParams {
  id: string;
  measureId: string;
}

const testCaseSeriesStyles = {
  width: "100%",
  // remove weird line break from legend
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#8c8c8c",
    borderRadius: "3px",
    "& legend": {
      width: 0,
    },
  },
  "& .MuiOutlinedInput-root": {
    padding: 0,
    "&&": {
      borderRadius: "3px",
    },
  },
  // input base selector
  "& .MuiInputBase-input": {
    resize: "vertical",
    minHeight: "23px",
    fontFamily: "Rubik",
    fontSize: 14,
    borderRadius: "3px",
    padding: "9px 14px",
    "&::placeholder": {
      opacity: 1,
      color: "#717171",
      fontFamily: "Rubik",
      paddingLeft: "5px",
    },
  },
};

interface createNewTestCaseDialogProps {
  open: boolean;
  onClose: (boolean) => void;
  measure?: Measure;
  onSuccess: (testCases: TestCase[]) => void;
}

const CreateNewTestCaseDialog = ({
  open,
  onClose,
  measure,
  onSuccess,
}: createNewTestCaseDialogProps) => {
  let navigate = useNavigate();
  const { search } = useLocation();
  const values = queryString.parse(search);

  const [toast, setToast] = useState<Toast>({
    toastOpen: false,
    toastType: "danger",
    toastMessage: "",
  });
  const { toastOpen, toastType, toastMessage } = toast;
  const testCaseService = useRef(useTestCaseServiceApi());
  const { measureId } = useParams<keyof navigationParams>() as navigationParams;
  const [seriesState, setSeriesState] = useState<any>({
    loaded: false,
    series: [],
  });

  // style utilities
  const row = {
    display: "flex",
    flexDirection: "row",
  };
  const spaced = {
    marginTop: "23px",
  };
  const formRow = Object.assign({}, row, spaced);

  const INITIAL_VALUES = {
    title: "",
    description: "",
    series: "",
  } as TestCase;

  const formik = useFormik({
    initialValues: { ...INITIAL_VALUES },
    validationSchema: TestCaseValidator,
    onSubmit: async (values: TestCase) => await handleSubmit(values),
  });

  useEffect(() => {
    if (!open) {
      formik.resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (!seriesState.loaded) {
      testCaseService.current
        .getTestCaseSeriesForMeasure(measureId)
        .then((existingSeries) =>
          setSeriesState({ loaded: true, series: existingSeries })
        )
        .catch((error) => {
          console.error(error.message);
          setToast({
            toastOpen: true,
            toastType: "danger",
            toastMessage: error.message,
          });
        });
    }
  }, [measureId, testCaseService, seriesState.loaded]);

  const handleSubmit = async (testCase: TestCase) => {
    setToast({
      toastOpen: false,
      toastType: "danger",
      toastMessage: "",
    });
    testCase.title = sanitizeUserInput(testCase.title);
    testCase.description = sanitizeUserInput(testCase.description);
    testCase.series = sanitizeUserInput(testCase.series);
    //testCase.createdBeforeVersioning = test

    if (measure?.model?.includes("QDM")) {
      testCase = defaultTestCaseJson(testCase);
    } else if (measure?.model?.includes("QI-Core")) {
      testCase = defaultQiCoreTestCaseJson(testCase);
    }

    await createTestCase(testCase);
  };

  const createTestCase = async (testCase: TestCase) => {
    const errorMsg = checkSpecialCharacters(testCase);
    if (errorMsg) {
      setToast({
        toastOpen: true,
        toastType: "danger",
        toastMessage: errorMsg,
      });
      return;
    }
    try {
      const savedTestCase = await testCaseService.current.createTestCase(
        testCase,
        measureId
      );
      handleTestCaseResponse(savedTestCase);
      // go to page 1
      const newPath = `/measures/${measureId}/edit/test-cases/list-page/${
        measure.groups[0].id
      }?filter=${values.filter ? values.filter : ""}&search=${
        values.search ? values.search : ""
      }&page=1&limit=${values.limit ? values.limit : 10}`;
      navigate(newPath);
    } catch (error) {
      setToast({
        toastOpen: true,
        toastType: "danger",
        toastMessage:
          "An error occurred while creating the test case: " + error.message,
      });
    }
  };

  async function handleTestCaseResponse(testCase: TestCase) {
    if (testCase && testCase.id) {
      formik.resetForm();
      setToast({
        toastOpen: false,
        toastType: "danger",
        toastMessage: "",
      });

      onSuccess([testCase]);
      onClose(true);
    }
  }

  function formikErrorHandler(name: string) {
    if (formik.touched[name] && formik.errors[name]) {
      return `${formik.errors[name]}`;
    }
  }
  const isComposite = measure?.measureMetaData?.composite;
  return (
    <div data-testid="create-test-case-dialog">
      <MadieDialog
        form
        title={`Create ${isComposite ? "Composite " : ""}Test Case`}
        dialogProps={{
          onClose,
          open,
          onSubmit: formik.handleSubmit,
        }}
        cancelButtonProps={{
          variant: "secondary",
          cancelText: "Cancel",
          "data-testid": "create-test-case-cancel-button",
        }}
        continueButtonProps={{
          variant: "cyan",
          type: "submit",
          "data-testid": "create-test-case-save-button",
          disabled: !(formik.isValid && formik.dirty),
          continueText: "Save",
        }}
      >
        <>
          <Toast
            toastKey="test-case-create-toast"
            toastType={toastType}
            testId={
              toastType === "danger"
                ? "server-error-alerts"
                : "test-case-create-success-text"
            }
            open={toastOpen}
            message={toastMessage}
            onClose={() => {
              setToast({
                toastOpen: false,
                toastType: "danger",
                toastMessage: "",
              });
            }}
            closeButtonProps={{
              "data-testid": "close-error-button",
            }}
            autoHideDuration={6000}
          />
          <div
            style={{
              marginBottom: -15,
              marginTop: 5,
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <Typography
              style={{ fontSize: 14, fontWeight: 300, fontFamily: "Rubik" }}
            >
              <span
                style={{
                  color: "rgb(174, 28, 28)",
                  marginRight: 3,
                  fontWeight: 400,
                }}
              >
                *
              </span>
              Indicates required field
            </Typography>
          </div>
          <Box sx={formRow}>
            <TextField
              placeholder="Enter Title"
              required
              label="Title"
              id="create-test-case-title"
              inputProps={{
                "data-testid": "create-test-case-title-input",
                "aria-describedby": "create-test-case-title-helper-text",
                "aria-required": true,
                required: true,
              }}
              helperText={formikErrorHandler("title")}
              data-testid="create-test-case-title"
              size="small"
              error={formik.touched.title && Boolean(formik.errors.title)}
              {...formik.getFieldProps("title")}
              maxLength={250}
            />
          </Box>

          <Box sx={formRow}>
            <TextArea
              label="Description"
              required={false}
              name="create-test-case-description"
              id="create-test-case-description"
              inputProps={{
                "data-testid": "create-test-case-description-input",
              }}
              onChange={formik.handleChange}
              value={formik.values.description}
              placeholder="Enter Description"
              data-testid="create-test-case-description"
              {...formik.getFieldProps("description")}
              error={
                formik.touched.description && Boolean(formik.errors.description)
              }
              helperText={formikErrorHandler("description")}
              maxLength={250}
            />
          </Box>
          <TestCaseSeries
            value={formik.values.series}
            error={Boolean(formik.errors.series)}
            onChange={(nextValue) => {
              formik.setFieldTouched("series", true);
              formik.setFieldValue("series", nextValue, true);
            }}
            helperText={formikErrorHandler("series")}
            seriesOptions={seriesState.series}
            sx={testCaseSeriesStyles}
          />
        </>
      </MadieDialog>
    </div>
  );
};

export default CreateNewTestCaseDialog;
