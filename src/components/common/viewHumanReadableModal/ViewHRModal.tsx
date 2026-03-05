import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MadieDialog,
  MadieSpinner,
} from "@madie/madie-design-system/dist/react";
import { useMeasureServiceApi } from "@madie/madie-util";
import { DialogContent, Typography, Backdrop } from "@mui/material";
import "./ViewHRModal.scss";
interface ModalProps {
  open;
  onClose;
  exportMeasure;
  measureId;
}

export default function ViewHRModal(props: ModalProps) {
  const { open, onClose, exportMeasure, measureId } = props;
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [loading, setLoading] = useState(true);
  const [hr, setHr] = useState<string>();
  const [error, setError] = useState<string>();

  const getHumanReadable = useCallback(
    async (measureId, open) => {
      if (open) {
        setLoading(true);
        if (!measureId) {
          setLoading(false);
          return null;
        } else {
          try {
            setHr(await measureServiceApi.fetchHumanReadable(measureId));
            setLoading(false);
            setError("");
          } catch (e) {
            setHr("");
            setLoading(false);
            setError(
              "The human readable file is not available for this measure.  Contact Help Desk for additional information."
            );
          }
        }
      }
    },
    [measureId, open]
  );

  useEffect(() => {
    getHumanReadable(measureId, open);
  }, [measureId, open]);

  return (
    <MadieDialog
      form
      title="Human Readable"
      sx={{
        "#modal-body": {
          h2: {
            borderTop: "1px solid black",
          },
        },
      }}
      dialogProps={{
        id: "view-hr-modal",
        onClose,
        open,
        maxWidth: "lg",
        fullWidth: true,
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Close",
        "data-testid": "human-readable-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        "data-testid": "human-readable-export-button",
        continueText: "Export",
        hidden: error,
        popoverOptions: [
          {
            label: "Export",
            dataTestId: "export-option",
            toImplementFunction: () => {
              const event = new CustomEvent("export-measure", {
                detail: { elmErrorSeverity: "Info" },
              });
              window.dispatchEvent(event);
              exportMeasure("Info");
            },
          },
          {
            label: "Export for Publishing",
            dataTestId: "export-publishing-option",
            toImplementFunction: () => {
              const event = new CustomEvent("export-measure", {
                detail: { elmErrorSeverity: "Error" },
              });
              window.dispatchEvent(event);
              exportMeasure("Error");
            },
          },
        ],
      }}
    >
      <DialogContent>
        <div data-testid="view-hr-modal" className="hr-modal-container">
          <Typography>
            {!loading && (
              <div>
                <div
                  className="modal-body"
                  dangerouslySetInnerHTML={{
                    __html: hr,
                  }}
                />
              </div>
            )}

            {error && (
              <div>
                <p>{error}</p>
              </div>
            )}
          </Typography>
        </div>
      </DialogContent>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <MadieSpinner style={{ height: 50, width: 50 }} />
      </Backdrop>
    </MadieDialog>
  );
}
