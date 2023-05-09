import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import { Button } from "@madie/madie-components";
import CloseIcon from "@mui/icons-material/Close";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles({
  row: {
    display: "flex",
    flexDirection: "row",
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
    fontSize: 15,
    fontWeight: 300,
    fontFamily: "Rubik",
  },
  subText: {
    fontSize: 13.5,
    fontWeight: "bold",
    marginTop: 13,
  },
  bottomInfo: {
    fontSize: 12,
    color: "red",
    fontWeight: 300,
    marginTop: 20,
  },

  dividerBottom: {
    marginTop: 5,
  },
  actionsRoot: {
    padding: 16,
    "& >:not(:first-of-type)": {
      marginLeft: 16,
    },
  },
});

export interface MeasureGroupsWarningDialogProps {
  modalType?: string;
  measureGroupNumber?: number;
  open?: boolean;
  onClose?;
  onSubmit?;
}

export default function MeasureGroupsWarningDialog(
  props: MeasureGroupsWarningDialogProps
) {
  const { modalType, measureGroupNumber, open, onClose, onSubmit } = props;
  const classes = useStyles();

  const scoringChangeDialogText = {
    title: "Change Scoring?",
    info: "Your Measure Scoring is about to be saved and updated based on these changes. Any expected values on your test cases will be cleared for this measure.",
    subText: "Are you sure you want to Save Changes?",
    bottomInfo: "This action cannot be undone.",
    dataTestId: "update-measure-group-scoring",
    cancelButtonText: "No, Keep Working",
    confirmButtonText: "Yes, Save changes",
  };

  const popBasisChangeDialogText = {
    title: "Change Population Basis?",
    info: "Your Measure Population Basis is about to be saved and updated based on these changes. Any expected values on your test cases will be cleared for this measure group.",
    subText: "Are you sure you want to Save Changes?",
    bottomInfo: "This action cannot be undone.",
    dataTestId: "update-measure-group-pop-basis",
    cancelButtonText: "No, Keep Working",
    confirmButtonText: "Yes, Save changes",
  };

  const deleteMeasureGroupDialogText = {
    title: "Delete Measure Group?",
    info: `Measure Group ${
      measureGroupNumber + 1
    } will be deleted. Are you sure you want to delete this measure group?`,
    subText: "",
    bottomInfo: "This action cannot be undone.",
    dataTestId: "delete-measure-group",
    cancelButtonText: "Keep Measure Group",
    confirmButtonText: "Yes, Delete Measure Group",
  };

  const patientBasisChangeDialogText = {
    title: "Change Patient Basis?",
    info: "Your Measure Patient Basis is about to be saved and updated based on these changes. Any expected values on your test cases will be cleared for this measure.",
    subText: "Are you sure you want to Save Changes?",
    bottomInfo: "This action cannot be undone.",
    dataTestId: "update-measure-group-patient-basis",
    cancelButtonText: "No, Keep Working",
    confirmButtonText: "Yes, Save changes",
  };

  const getDialogText = (modalType) => {
    switch (modalType) {
      case "scoring":
        return scoringChangeDialogText;
      case "popBasis":
        return popBasisChangeDialogText;
      case "patientBasis":
        return patientBasisChangeDialogText;
      default:
        return deleteMeasureGroupDialogText;
    }
  };

  const dialogText = getDialogText(modalType);

  return (
    <Dialog
      open={open}
      data-testid={`${dialogText?.dataTestId}-dialog`}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <div className={classes.dialogTitle}>
        <DialogTitle className={classes.title}>{dialogText?.title}</DialogTitle>
        <div>
          <IconButton onClick={onClose}>
            <CloseIcon className={classes.close} />
          </IconButton>
        </div>
      </div>
      <Divider className={classes.dividerBottom} />
      <DialogContent>
        <div>
          <Typography className={classes.info}>{dialogText?.info}</Typography>
          <Typography className={classes.subText}>
            {dialogText?.subText}
          </Typography>

          <Typography className={classes.bottomInfo}>
            {dialogText?.bottomInfo}
          </Typography>
        </div>
      </DialogContent>
      <Divider className={classes.dividerBottom} />
      <DialogActions classes={{ root: classes.actionsRoot }}>
        <Button
          type="button"
          buttonTitle={dialogText?.cancelButtonText}
          variant="white"
          data-testid={`${dialogText?.dataTestId}-modal-cancel-btn`}
          onClick={onClose}
        />
        <Button
          style={{ background: "#424B5A", marginTop: 0 }}
          type="submit"
          buttonTitle={dialogText?.confirmButtonText}
          group-form-update-btn
          data-testid={`${dialogText?.dataTestId}-modal-agree-btn`}
          onClick={onSubmit}
        />
      </DialogActions>
    </Dialog>
  );
}
