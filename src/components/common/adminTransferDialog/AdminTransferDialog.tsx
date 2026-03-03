import React, { useRef } from "react";
import {
  MadieDialog,
  TextField,
  FormControlLabel,
  Toast,
} from "@madie/madie-design-system/dist/react";
import { Measure } from "@madie/madie-models";
import { useFormik } from "formik";
import { Checkbox, Divider } from "@mui/material";
import "../transferDialog/TransferDialog.scss";
import * as Yup from "yup";
import { useMeasureServiceApi } from "@madie/madie-util";
import { INITIAL_STATUS_HANDLER } from "../../editMeasure/editor/StatusHandler";
import TransferredMeasuresTable from "../transferDialog/TransferredMeasuresTable";

export const ADMIN_TRANSFER_NOT_IMPLEMENTED =
  "Admin transfer functionality is not yet implemented. Please contact the helpdesk to complete this transfer.";

interface AdminTransferDialogProps {
  measures: Measure[];
  open: boolean;
  onClose: Function;
  setStatusHandler: Function;
}

const AdminTransferDialog = ({
  measures,
  open,
  onClose,
  setStatusHandler,
}: AdminTransferDialogProps) => {
  const measureServiceApi = useRef(useMeasureServiceApi()).current;

  const handleSave = async () => {
    setStatusHandler(INITIAL_STATUS_HANDLER);

    // Show not implemented message
    onClose({
      toastType: "warning",
      toastMessage: ADMIN_TRANSFER_NOT_IMPLEMENTED,
      toastOpen: true,
    });

    // TODO: Implement actual admin transfer when backend is ready (MAT-9545)
    // const measureIds = measures.map((m) => m.id);
    // return measureServiceApi.adminTransferMeasures(
    //   measureIds,
    //   formik.values.harpId,
    //   formik.values.retainShareAccess
    // );
  };

  const formik = useFormik({
    initialValues: {
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
          "data-testid": "admin-transfer-dialog",
        }}
        cancelButtonProps={{
          variant: "outline",
          cancelText: "Cancel",
          "data-testid": "admin-transfer-cancel-button",
        }}
        continueButtonProps={{
          variant: "cyan-primary",
          type: "submit",
          continueText: "Transfer",
          "data-testid": "admin-transfer-save-button",
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
        </div>
        <div data-testid="admin-transferred-measures-list">
          <TransferredMeasuresTable
            measures={measures}
            showOwnerColumn={true}
          />
        </div>
        <div className="owner">Owner</div>
        <Divider sx={{ borderColor: "#8c8c8c", paddingBottom: "16px" }} />

        <div id="admin-transfer-measure">
          <div className="new-owner-field" style={{ maxWidth: "412px" }}>
            <TextField
              label="New Measure Owner"
              id="admin-harp-id-input"
              required={true}
              inputProps={{
                "data-testid": "admin-harp-id-input",
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
                  id="adminRetainShareAccess"
                  data-testid="admin-retainShareAccess"
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

export default AdminTransferDialog;
