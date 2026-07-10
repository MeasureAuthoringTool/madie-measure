import React, { useEffect, useState } from "react";
import { Measure } from "@madie/madie-models";
import {
  MadieDialog,
  RichTextEditor,
} from "@madie/madie-design-system/dist/react";
import { Divider, FormControlLabel, Switch } from "@mui/material";

interface ReviewDialogProps {
  open: boolean;
  measure?: Measure;
  onClose: () => void;
}

export default function ReviewDialog({
  open,
  measure,
  onClose,
}: ReviewDialogProps) {
  const [markAsReady, setMarkAsReady] = useState(false);
  const [comments, setComments] = useState("");

  // useEffect(() => {
  //   if (open) {
  //     // TODO: Once the Measure model includes reviewStatus enum, update this logic
  //     // to check if measure?.reviewStatus === ReviewStatus.READY (or equivalent)
  //     // For now, we default to false and clear comments
  //     const isReady = measure?.reviewStatus === "READY";
  //     setMarkAsReady(isReady);
  //     setComments("");
  //   }
  // }, [open, measure?.reviewStatus]);

  const isSaveDisabled = !markAsReady;

  return (
    <MadieDialog
      title="Mark Measure Ready for Review"
      dialogProps={{
        open,
        onClose,
        maxWidth: "md",
        fullWidth: true,
        "data-testid": "review-dialog",
      }}
      cancelButtonProps={{
        variant: "outline",
        cancelText: "Cancel",
        onClick: onClose,
        "data-testid": "review-dialog-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        continueText: "Save",
        disabled: isSaveDisabled,
        onClick: () => {
          // Save behavior is intentionally out of scope for this story.
        },
        "data-testid": "review-dialog-save-button",
      }}
    >
      <div data-testid="review-dialog-content">
        <Divider sx={{ mb: 2 }} />
        <FormControlLabel
          label="Mark as Ready"
          control={
            <Switch
              data-testid="review-dialog-mark-ready-switch"
              checked={markAsReady}
              onChange={(event) => setMarkAsReady(event.target.checked)}
              slotProps={{
                input: {
                  "aria-label": "Mark as Ready",
                },
              }}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#0073C8",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#0073C8",
                },
              }}
            />
          }
          sx={{
            "& .MuiFormControlLabel-label": {
              color: "#515151 !important",
            },
          }}
        />
        <div style={{ marginTop: 16 }}>
          <RichTextEditor
            id="review-comments"
            name="reviewComments"
            label="Comments"
            content={comments}
            onChange={(value: string) => setComments(value)}
          />
        </div>
        <Divider sx={{ mt: 2 }} />
      </div>
    </MadieDialog>
  );
}
