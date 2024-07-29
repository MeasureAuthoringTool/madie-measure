import React, { useState } from "react";
import { Measure, Model } from "@madie/madie-models";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import "twin.macro";
import "styled-components/macro";
import { FormControlLabel, Checkbox } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import AssociateCmsIdConfirmationDialog from "../associateCmsIdConfirmationDialog/AssociateCmsIdConfirmationDialog";

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
        <div style={{ display: "flex", flexDirection: "row" }}>
          <WarningIcon style={{ color: "#ff9800" }} />
          <p style={{ marginLeft: "5px" }}>
            Associate CMS ID will copy the CMS ID from your QDM measure to your
            QI-Core measure. To copy QDM metadate to the QI-Core measure as well
            please select the checkbox below.
          </p>
        </div>
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
                    <Checkbox
                      name="cmsId"
                      data-testid="copy-cms-id-checkbox"
                      onChange={(event: any) =>
                        setCopyMetaData(event.target.checked)
                      }
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
