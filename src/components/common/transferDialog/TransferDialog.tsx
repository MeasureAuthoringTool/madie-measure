import React, { useRef } from "react";
import {
  MadieDialog,
  TextField,
  ReadOnlyTextField,
  FormControlLabel,
} from "@madie/madie-design-system/dist/react";
import { Measure } from "@madie/madie-models";
import { useFormik } from "formik";
import { Checkbox, Divider } from "@mui/material";
import "./TransferDialog.scss";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import * as Yup from "yup";
import { useMeasureServiceApi } from "@madie/madie-util";
import { INITIAL_STATUS_HANDLER } from "../../editMeasure/editor/StatusHandler";
import TransferredMeasuresTable from "./TransferredMeasuresTable";

export const TRANSFER_MEASURE_SUCCESS =
  "The measure(s) were successfully transferred. If you chose to retain share access, you will still be able to edit the measures.";
export const TRANSFER_MEASURE_FAILURE =
  "Unable to transfer the selected measure(s) to the harpId. If the error persists, please contact the help desk.";

interface TransferDialogProps {
  measures: Measure[];
  open: boolean;
  onClose: Function;
  setStatusHandler: Function;
  isAdminTransfer?: boolean;
}

const TransferDialog = ({
  measures,
  open,
  onClose,
  setStatusHandler,
  isAdminTransfer = false,
}: TransferDialogProps) => {
  const measureServiceApi = useRef(useMeasureServiceApi()).current;

  const handleSave = async () => {
    setStatusHandler(INITIAL_STATUS_HANDLER);

    const measureIds = measures.map((m) => m.id);

    const transferPromise = measureServiceApi.transferMeasures(
      measureIds,
      formik.values.harpId,
      formik.values.retainShareAccess
    );

    return transferPromise
      .then((response) => {
        if (response.status === 200) {
          onClose({
            toastType: "success",
            toastMessage: TRANSFER_MEASURE_SUCCESS,
            toastOpen: true,
          });
        } else if (response.status === 207) {
          const failedMeasureIds: string[] = response.data;

          const failedMeasureNames = measures
            .filter((measure) => failedMeasureIds.includes(measure.id))
            .map((measure) => measure.measureName);

          setStatusHandler({
            warning: {
              status: true,
              primaryMessage: `${failedMeasureNames?.length} Measures could not be transferred. Please try again, or contact help desk if the issue persists.`,
              secondaryMessages: failedMeasureNames,
            },
          });

          // Close dialog and refresh the measure list without showing a toast.
          onClose({
            toastType: "success",
            toastOpen: false,
          });
        }
      })
      .catch((error) => {
        console.error("TransferDialog: handleSave: error = ", error);
        onClose({
          toastType: "danger",
          toastMessage: TRANSFER_MEASURE_FAILURE,
          toastOpen: true,
        });
      });
  };

  const formik = useFormik({
    initialValues: {
      currentUser: measures?.[0]?.measureSet?.owner,
      harpId: "",
      retainShareAccess: false,
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      harpId: Yup.string().required("New Measure Owner is required."),
    }),
    onSubmit: handleSave,
  });

  return (
    <>
      <MadieDialog
        form
        title="Transfer Measure Ownership"
        dialogProps={{
          onClose,
          open,
          onSubmit: formik.handleSubmit,
          maxWidth: "lg",
          "data-testid": "transfer-dialog",
        }}
        cancelButtonProps={{
          variant: "outline",
          cancelText: "Cancel",
          "data-testid": "transfer-cancel-button",
        }}
        continueButtonProps={{
          variant: isAdminTransfer ? "cyan-primary" : "danger-primary",
          type: "submit",
          continueText: "Transfer",
          "data-testid": "transfer-save-button",
          disabled: !formik.dirty || !formik.values.harpId,
        }}
      >
        <div className="transfer-dialog-info-text">
          <div>
            You are about to Transfer ownership of the {measures?.length || 0}{" "}
            selected measure(s) below. All versions and drafts will be
            transferred, but only the most recent measure name appears in the
            list below.
          </div>
          {!isAdminTransfer && (
            <div className="warning-message">
              <ErrorOutlineIcon color="error" fontSize="small" />
              This action cannot be undone.
            </div>
          )}
        </div>
        <div data-testid="transferred-measures-list">
          <TransferredMeasuresTable
            measures={measures}
            showOwnerColumn={isAdminTransfer}
          />
        </div>
        <div className="owner">Owner</div>
        <Divider sx={{ borderColor: "#8c8c8c", paddingBottom: "16px" }} />

        <div id="transfer-measure">
          {!isAdminTransfer && (
            <div className="current-owner">
              <ReadOnlyTextField
                label="Current Measure Owner"
                inputProps={{
                  "data-testid": "current-owner",
                }}
                size="large"
                {...formik.getFieldProps("currentUser")}
              />
            </div>
          )}
          <div>
            <TextField
              label="New Measure Owner"
              id="harp-id-input"
              required={true}
              inputProps={{
                "data-testid": "harp-id-input",
              }}
              error={formik.touched.harpId && Boolean(formik.errors.harpId)}
              helperText={formik.touched.harpId && formik.errors.harpId}
              {...formik.getFieldProps("harpId")}
            />
          </div>
          <div className="retainShareAccess">
            <FormControlLabel
              control={
                <Checkbox
                  {...formik.getFieldProps("retainShareAccess")}
                  checked={formik.values.retainShareAccess}
                  name="retainShareAccess"
                  id="retainShareAccess"
                  data-testid="retainShareAccess"
                />
              }
              label="Retain Share Access after Transfer"
            />
          </div>
        </div>
      </MadieDialog>
    </>
  );
};

export default TransferDialog;
