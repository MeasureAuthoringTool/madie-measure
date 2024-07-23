import React, { useState } from "react";
import { Measure, Model } from "@madie/madie-models";
import {
  MadieDialog,
  MadieDiscardDialog,
} from "@madie/madie-design-system/dist/react";
import "twin.macro";
import "styled-components/macro";
import { CheckBox } from "@mui/icons-material";
import { FormControlLabel } from "@mui/material";

interface PropTypes {
  measures: Measure[];
  onClose: Function;
  open: boolean;
}

export default function AssociateCmsIdDialog(props: PropTypes) {
  const { open, onClose, measures } = props;
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const qdmMeasure = measures?.find(
    (measure) => measure.model === Model.QDM_5_6
  );
  const qiCoreMeasure = measures?.find(
    (measure) => measure.model === Model.QICORE
  );
  return (
    <>
      <MadieDialog
        title="Associate CMS ID"
        dialogProps={{
          open,
          onClose: onClose,
          id: "associate-cms-id-dialog",
          maxWidth: "md",
        }}
        cancelButtonProps={{
          cancelText: "Discard Changes",
          "data-testid": "cancel-button",
        }}
        continueButtonProps={{
          continueText: "Associate",
          "data-testid": "associate-cms-id-button",
          onClick: () => {
            setConfirmationDialogOpen(true);
          },
        }}
      >
        <table tw="w-full" data-testid="associate-cms-id-dialog-tbl">
          <thead>
            <tr>
              <th tw="w-1/2 pt-2 pb-2 text-left">Name</th>
              <th tw="text-left">version</th>
              <th tw="text-left">model</th>
              <th tw="text-left">CMS ID</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td tw="pt-2 pb-2">{qdmMeasure?.measureName}</td>
              <td>{qdmMeasure?.version}</td>
              <td>{qdmMeasure?.model}</td>
              <td>{qdmMeasure?.measureSet.cmsId}</td>
            </tr>
            <tr>
              <td tw="pt-2 pb-2">{qiCoreMeasure?.measureName}</td>
              <td>{qiCoreMeasure?.version}</td>
              <td>{qiCoreMeasure?.model}</td>
              <td>{qiCoreMeasure?.measureSet?.cmsId}</td>
            </tr>
            <tr>
              <td colSpan={4} tw="pt-2 pb-2">
                <FormControlLabel
                  control={
                    <CheckBox
                      sx={{
                        color: "#0073C8",
                      }}
                      name="cmsId"
                      data-testid="copy-cms-id-checkbox"
                    />
                  }
                  label="Copy QDM Metadata to QI-Core measure"
                  sx={{
                    color: "#515151",
                    textTransform: "none",
                    marginLeft: "-2px",
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </MadieDialog>
      <MadieDialog
        title="Associate CMS ID"
        dialogProps={{
          open: confirmationDialogOpen,
          onClose: () => setConfirmationDialogOpen(false),
          "data-testid": "associate-cms-id-confirmation-dialog",
        }}
        cancelButtonProps={{
          variant: "secondary",
          cancelText: "Cancel",
          "data-testid": "associate-cms-id-confirmation-dialog-cancel-button",
        }}
        continueButtonProps={{
          variant: "primary",
          "data-testid": "associate-cms-id-confirmation-continue-button",
          continueText: "Yes, Associate",
          onClick: () => {
            onClose();
            setConfirmationDialogOpen(false);
          },
        }}
      >
        <div id="discard-changes-dialog-body">
          <section className="dialog-warning-body">
            <p className="strong">
              Are you sure you wish to associate this CMS ID? Any meta data that
              gets copied over will overwrite existing data in that field.
            </p>
          </section>
          <section className="dialog-warning-action"></section>
        </div>
      </MadieDialog>
    </>
  );
}
