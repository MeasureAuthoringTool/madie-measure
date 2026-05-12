import React, { useEffect } from "react";
import { DialogContent, MenuItem, Typography, Backdrop } from "@mui/material";
import { Box } from "@mui/system";
import { makeStyles } from "@mui/styles";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  MadieDialog,
  Select,
  TextField,
  MadieSpinner,
} from "@madie/madie-design-system/dist/react";
import { MeasureNameSchema } from "../../../validations/MeasureSchemaValidator";
import { Model } from "@madie/madie-models";
import { useFeatureFlags } from "@madie/madie-util";

const useStyles = makeStyles({
  requiredIndicator: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
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

const DraftMeasureDialog = ({ open, onClose, onSubmit, measure, loading }) => {
  let modelOptions = Object.keys(Model);
  const classes = useStyles();
  const featureFlags = useFeatureFlags();

  const formik = useFormik({
    initialValues: {
      measureName: measure?.measureName,
      model: measure?.model,
    },
    validationSchema: Yup.object().shape({ measureName: MeasureNameSchema }),
    enableReinitialize: true,
    onSubmit: async ({ measureName, model }) => {
      formik.resetForm();
      return onSubmit(measureName, model);
    },
  });

  useEffect(() => {
    if (!open) {
      formik.resetForm();
    }
  }, [open]);

  const row = {
    display: "flex",
    flexDirection: "row",
  };
  const spaced = {
    marginTop: "23px",
  };
  const formRow = Object.assign({}, row, spaced);
  const gap = {
    columnGap: "24px",
    "& > * ": {
      flex: 1,
    },
  };
  const formRowGapped = Object.assign({}, formRow, gap);

  return (
    <MadieDialog
      form
      title="Create Draft"
      dialogProps={{
        onClose,
        open,
        onSubmit: formik.handleSubmit,
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Cancel",
        "data-testid": "create-draft-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        "data-testid": "create-draft-continue-button",
        disabled: !formik.isValid,
        continueText: "Continue",
      }}
    >
      <DialogContent>
        <div className={classes.requiredIndicator}>
          <Typography className={classes.info}>
            <span className={classes.asterisk}>*</span>
            Required field
          </Typography>
        </div>
        <Box sx={formRow}>
          <TextField
            {...formik.getFieldProps("measureName")}
            placeholder="Measure Name"
            required
            label="Measure Name"
            id="measureName"
            inputProps={{
              "data-testid": "measure-name-input",
              "aria-describedby": "measureName-helper-text",
            }}
            data-testid="measure-name-field"
            size="small"
            error={
              formik.touched.measureName && Boolean(formik.errors.measureName)
            }
            helperText={
              formik.errors["measureName"] ||
              "Measure Name must contain at least one letter and must not contain '_' (underscores)."
            }
            maxLength={500}
          />
        </Box>
        <>
          {!measure?.model.includes("QDM") ? (
            <Box sx={formRowGapped}>
              <Select
                placeHolder={{ name: "Model", value: "" }}
                required
                label="Update Model Version"
                id="model-select"
                inputProps={{
                  "data-testid": "measure-model-input",
                  id: "model-select",
                  "aria-describedby": "model-select-helper-text",
                  required: true,
                }}
                readOnly={
                  featureFlags?.qiCore7
                    ? measure?.model === "QI-Core v7.0.2"
                    : measure?.model === "QI-Core v6.0.0"
                }
                SelectDisplayProps={{
                  "aria-required": "true",
                }}
                data-testid="measure-model-select"
                {...formik.getFieldProps("model")}
                error={formik.touched.model && Boolean(formik.errors.model)}
                helperText={formik.touched.model && formik.errors.model}
                size="small"
                options={modelOptions
                  // Limit the model options based on the measure's current model
                  .filter((modelKey) => {
                    if (measure?.model === "QI-Core v6.0.0") {
                      return (
                        modelKey === "QICORE_6_0_0" ||
                        modelKey === "QICORE_7_0_2"
                      );
                    } else if (measure?.model === "QI-Core v7.0.2") {
                      return modelKey === "QICORE_7_0_2";
                    }
                    return true; // Include all other cases
                  })
                  .map((modelKey) => {
                    if (
                      !modelKey.startsWith("QDM") &&
                      (featureFlags?.qiCore7 || modelKey != "QICORE_7_0_2")
                    ) {
                      return (
                        <MenuItem
                          key={modelKey}
                          value={Model[modelKey]}
                          data-testid={`measure-model-option-${Model[modelKey]}`}
                        >
                          {Model[modelKey]}
                        </MenuItem>
                      );
                    }
                  })}
              />
            </Box>
          ) : null}
        </>
      </DialogContent>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <MadieSpinner style={{ height: 50, width: 50 }} />
      </Backdrop>
    </MadieDialog>
  );
};

export default DraftMeasureDialog;
