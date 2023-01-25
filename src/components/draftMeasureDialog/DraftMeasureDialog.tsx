import React from "react";
import { DialogContent, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { makeStyles } from "@mui/styles";
import { useFormik } from "formik";
import * as Yup from "yup";
import { MadieDialog, TextField } from "@madie/madie-design-system/dist/react";
import { MeasureNameSchema } from "../../validations/MeasureSchemaValidator";

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
  const classes = useStyles();
  const formik = useFormik({
    initialValues: {
      measureName: measure?.measureName,
    },
    validationSchema: Yup.object().shape({ measureName: MeasureNameSchema }),
    enableReinitialize: true,
    onSubmit: async ({ measureName }) => {
      formik.resetForm();
      return onSubmit(measureName);
    },
  });

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
        <Box>
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
            helperText={formik.errors.measureName}
          />
        </Box>
      </DialogContent>
    </MadieDialog>
  );
};

export default DraftMeasureDialog;
