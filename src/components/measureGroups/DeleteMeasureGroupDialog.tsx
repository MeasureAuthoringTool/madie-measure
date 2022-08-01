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

export interface DeleteMeasureGroupDialogProps {
  modalType?: String;
  measureGroupNumber?: number;
  open?: boolean;
  onClose?;
  onSubmit?;
}

export default function DeleteMeasureGroupDialog(
  props: DeleteMeasureGroupDialogProps
) {
  const { modalType, measureGroupNumber, open, onClose, onSubmit } = props;
  const classes = useStyles();

  if (modalType === "scoring") {
    return (
      <Dialog
        open={open}
        data-testid="delete-measure-group-dialog"
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <div className={classes.dialogTitle}>
          <DialogTitle className={classes.title}>Change Scoring?</DialogTitle>
          <div>
            <IconButton onClick={onClose}>
              <CloseIcon className={classes.close} />
            </IconButton>
          </div>
        </div>
        <Divider className={classes.dividerBottom} />
        <DialogContent>
          <div>
            <Typography className={classes.info}>
              Your Measure Scoring is about to be saved and updated based on
              these changes. Any expected values on your test cases will be
              cleared for this measure.
            </Typography>

            <Typography className={classes.subText}>
              Are you sure you want to Save Changes?
            </Typography>

            <Typography className={classes.bottomInfo}>
              This action cannot be undone.
            </Typography>
          </div>
        </DialogContent>
        <Divider className={classes.dividerBottom} />
        <DialogActions classes={{ root: classes.actionsRoot }}>
          <Button
            type="button"
            buttonTitle="No, Keep Working"
            variant="white"
            data-testid="update-measure-group-scoring-modal-cancel-btn"
            onClick={onClose}
          />
          <Button
            style={{ background: "#424B5A", marginTop: 0 }}
            type="submit"
            buttonTitle="Yes, Save changes"
            group-form-update-btn
            data-testid="update-measure-group-scoring-modal-update-btn"
            onClick={onSubmit}
          />
        </DialogActions>
      </Dialog>
    );
  } else {
    return (
      <Dialog
        open={open}
        data-testid="delete-measure-group-dialog"
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <div className={classes.dialogTitle}>
          <DialogTitle className={classes.title}>
            Delete Measure Group?
          </DialogTitle>
          <div>
            <IconButton onClick={onClose}>
              <CloseIcon className={classes.close} />
            </IconButton>
          </div>
        </div>
        <DialogContent>
          <div>
            <Typography className={classes.info}>
              Measure Group {measureGroupNumber + 1} will be deleted. Are you
              sure you want to delete this measure group ?
            </Typography>

            <Typography className={classes.bottomInfo}>
              This action cannot be undone.
            </Typography>
          </div>
        </DialogContent>
        <Divider className={classes.dividerBottom} />
        <DialogActions classes={{ root: classes.actionsRoot }}>
          <Button
            type="button"
            buttonTitle="Keep Measure Group"
            variant="white"
            data-testid="delete-measure-group-modal-cancel-btn"
            onClick={onClose}
          />
          <Button
            style={{ background: "#424B5A", marginTop: 0 }}
            type="submit"
            buttonTitle="Yes, Delete Measure Group"
            data-testid="delete-measure-group-modal-delete-btn"
            onClick={onSubmit}
          />
        </DialogActions>
      </Dialog>
    );
  }
}
