import React from "react";
import {
  DialogContent,
  Typography,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
} from "@mui/material";
import classNames from "classnames";
import { makeStyles } from "@mui/styles";
import { useFormik } from "formik";
import * as Yup from "yup";
import tw from "twin.macro";
import { MadieDialog } from "@madie/madie-design-system/dist/react";

const useStyles = makeStyles({
  row: {
    display: "flex",
    flexDirection: "row",
  },
  end: {
    justifyContent: "flex-end",
    marginBottom: -23,
  },
  paper: {
    position: "relative",
    overflow: "visible",
    marginTop: -20,
  },
  dialogTitle: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px",
  },
  title: {
    fontFamily: "Rubik",
    fontSize: 24,
    padding: 0,
  },
  close: {
    color: "#242424",
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
  dividerBottom: {
    marginTop: 10,
  },
  actionsRoot: {
    padding: 16,
    "& >:not(:first-of-type)": {
      marginLeft: 16,
    },
  },
  chevron: {
    fontSize: 22,
    margin: "-9px -14px -7px 4px",
  },
});

interface VersionType {
  type: string;
}

const MessageText = tw.p`text-sm font-medium`;

const CreatVersionDialog = ({ open, onClose, onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      type: "",
    } as VersionType,
    validationSchema: Yup.object().shape({
      type: Yup.string().required("A version type is required."),
    }),
    enableReinitialize: true,
    onSubmit: ({ type }) => {
      formik.resetForm();
      return onSubmit(type);
    },
  });

  const classes = useStyles();
  const flexEnd = classNames(classes.row, classes.end);

  return (
    <div data-testid="create-version-dialog">
      <MadieDialog
        form
        title="Create Version"
        dialogProps={{
          onClose,
          open,
          onSubmit: formik.handleSubmit,
        }}
        cancelButtonProps={{
          variant: "secondary",
          cancelText: "Cancel",
          "data-testid": "create-version-cancel-button",
        }}
        continueButtonProps={{
          variant: "cyan",
          type: "submit",
          "data-testid": "create-version-continue-button",
          disabled: !(formik.isValid && formik.dirty),
          continueText: "Continue",
        }}
      >
        <DialogContent>
          <div className={flexEnd}>
            <Typography className={classes.info}>
              <span className={classes.asterisk}>*</span>
              Required field
            </Typography>
          </div>
          <div>
            <FormLabel id="radio-button-dialog">Select a version: </FormLabel>
            <RadioGroup
              aria-labelledby="radio-button-group"
              data-testid="radio-button-group"
              onChange={formik.handleChange}
            >
              <FormControlLabel
                value="major"
                control={<Radio name="type" />}
                label="Major"
              />
              <FormControlLabel
                value="minor"
                control={<Radio name="type" />}
                label="Minor"
              />
              <FormControlLabel
                value="patch"
                control={<Radio name="type" />}
                label="Patch"
              />
            </RadioGroup>
          </div>
        </DialogContent>
      </MadieDialog>
    </div>
  );
};

export default CreatVersionDialog;
