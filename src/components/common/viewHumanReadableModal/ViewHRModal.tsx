import React, { useState, useEffect, useRef } from "react";
import { Modal, MadieSpinner } from "@madie/madie-design-system/dist/react";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";
import { Backdrop } from "@mui/material";

interface ModalProps {
  open;
  onClose;
  measureId;
}

export default function ViewHRModal(props: ModalProps) {
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [loading, setLoading] = useState(true);
  const [hr, setHr] = useState<string>();
  const [error, setError] = useState<string>();

  const getHumanReadable = async (measureId) => {
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
  };

  useEffect(() => {
    getHumanReadable(props.measureId);
  }, [props.measureId]);

  return (
    <div data-testid="view-hr-modal">
      <Modal
        useDesignSystem
        width="70rem"
        isOpen={props.open}
        title="Human Readable"
        onRequestClose={props.onClose}
        secondary={{
          title: "Cancel",
          onClick: props.onClose,
        }}
      >
        {loading && (
          <Backdrop
            sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={loading}
          >
            <MadieSpinner style={{ height: 50, width: 50 }} />
          </Backdrop>
        )}

        {!loading && (
          <div>
            <div
              className="modal-body"
              dangerouslySetInnerHTML={{ __html: hr }}
            />
          </div>
        )}

        {error && (
          <div>
            <p>{error}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
