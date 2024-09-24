import React from "react";
import { DialogContent, MenuItem, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { makeStyles } from "@mui/styles";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  MadieDialog,
  Select,
  TextField,
} from "@madie/madie-design-system/dist/react";
import { MeasureNameSchema } from "../../../../validations/MeasureSchemaValidator";
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

const DraftMeasureDialog = ({ open, onClose, onSubmit, measure }) => {
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
          />
        </Box>
        <>
          {featureFlags?.qiCore6 && !measure?.model.includes("QDM") ? (
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
                SelectDisplayProps={{
                  "aria-required": "true",
                }}
                data-testid="measure-model-select"
                {...formik.getFieldProps("model")}
                error={formik.touched.model && Boolean(formik.errors.model)}
                helperText={formik.touched.model && formik.errors.model}
                size="small"
                options={modelOptions.map((modelKey) => {
                  if (!modelKey.startsWith("QDM")) {
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
    </MadieDialog>
  );
};

export default DraftMeasureDialog;
