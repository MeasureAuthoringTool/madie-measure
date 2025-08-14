import React, { useState } from "react";
import { Measure, Model } from "@madie/madie-models";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import "twin.macro";
import "styled-components/macro";
import { FormControlLabel, Checkbox } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import AssociateCmsIdConfirmationDialog from "../associateCmsIdConfirmationDialog/AssociateCmsIdConfirmationDialog";
import "./AssociateCmsIdDialog.scss";

interface PropTypes {
  measures: Measure[];
  onClose: Function;
  open: boolean;
  handleCmsIdAssociationContinueDialog: Function;
}

export default function AssociateCmsIdDialog(props: PropTypes) {
  const { open, onClose, measures, handleCmsIdAssociationContinueDialog } =
    props;
  const [
    associateCmsIdConfirmationDialogOpen,
    setAssociateCmsIdConfirmationDialogOpen,
  ] = useState(false);
  const [copyMetaData, setCopyMetaData] = useState(false);
  const qdmMeasure = measures?.find(
    (measure) => measure.model === Model.QDM_5_6
  );
  const qiCoreMeasure = measures?.find(
    (measure) =>
      measure.model === Model.QICORE || measure.model === Model.QICORE_6_0_0
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
          variant: "outline",
          cancelText: "Cancel",
          "data-testid": "cancel-button",
        }}
        continueButtonProps={{
          variant: "primary",
          continueText: "Associate",
          "data-testid": "associate-cms-id-button",
          onClick: () => setAssociateCmsIdConfirmationDialogOpen(true),
        }}
      >
        <div className="warning-container">
          <WarningIcon className="warning-icon" />
          <p className="warning-text">
            Associate CMS ID will copy the CMS ID from your QDM measure to your
            QI-Core measure. To copy QDM metadata to the QI-Core measure as well
            please select the checkbox below.
          </p>
        </div>

        <div id="associate-cms-id-container">
          <table
            className="associate-cms-id-table"
            data-testid="associate-cms-id-dialog-tbl"
          >
            <thead>
              <tr>
                <th scope="col" className="col-header">
                  Measure
                </th>
                <th scope="col" className="col-header">
                  Version
                </th>
                <th scope="col" className="col-header">
                  Model
                </th>
                <th scope="col" className="col-header">
                  CMS ID
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{qdmMeasure?.measureName}</td>
                <td>{qdmMeasure?.version}</td>
                <td>{qdmMeasure?.model}</td>
                <td>{qdmMeasure?.measureSet?.cmsId}</td>
              </tr>
              <tr>
                <td>{qiCoreMeasure?.measureName}</td>
                <td>{qiCoreMeasure?.version}</td>
                <td>{qiCoreMeasure?.model}</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>

          <div className="copy-metadata-container">
            <FormControlLabel
              control={
                <Checkbox
                  name="cmsId"
                  data-testid="copy-cms-id-checkbox"
                  onChange={(event: any) =>
                    setCopyMetaData(event.target.checked)
                  }
                  sx={{
                    width: 24,
                    height: 24,
                  }}
                />
              }
              label="Copy QDM Metadata to QI-Core measure"
              sx={{
                color: "#515151",
                textTransform: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            />
          </div>
        </div>
      </MadieDialog>

      <AssociateCmsIdConfirmationDialog
        open={associateCmsIdConfirmationDialogOpen}
        onContinue={() => {
          handleCmsIdAssociationContinueDialog(
            qiCoreMeasure?.id,
            qdmMeasure?.id,
            copyMetaData
          ),
            setAssociateCmsIdConfirmationDialogOpen(false);
        }}
        onClose={() => setAssociateCmsIdConfirmationDialogOpen(false)}
        copyMetaData={copyMetaData}
      />
    </>
  );
}
