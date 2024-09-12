import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure, Model } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import useMeasureServiceApi from "../../../../../api/useMeasureServiceApi";
import { Toast } from "@madie/madie-design-system/dist/react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { grey, red } from "@mui/material/colors";
import DeleteDialog from "../../../../editMeasure/DeleteDialog";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
  canEdit: boolean;
}

export const NOTHING_SELECTED = "Select measure to delete";
export const DEL_MEASURE = "Delete measure";


export default function DeleteAction(props: PropTypes) {
  const { measures, canEdit } = props;
  const [disableDeleteBtn, setDisableDeleteBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
const measureServiceApi = useMeasureServiceApi();
  const validateDeleteActionState = useCallback(() => {
    // set button state to disabled by default
    
    setDisableDeleteBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (
      measures?.length === 1 &&
      canEdit &&
      measures[0]?.measureMetaData?.draft
    ) {
      setDisableDeleteBtn(false);
      setTooltipMessage(DEL_MEASURE);
    }
  }, [measures, canEdit]);

  useEffect(() => {
    validateDeleteActionState();
  }, [measures, validateDeleteActionState]);

  const handleToast = (type, message, open) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(open);
  };
  const onToastClose = () => {
    setToastType("danger");
    setToastMessage("");
    setToastOpen(false);
  };

  const deleteMeasure = async () => {
    console.log(measures[0])
    const deletedMeasure: Measure = { ...measures[0], active: false };
    try {
      const result = await measureServiceApi.updateMeasure(deletedMeasure);
      if (result.status === 200) {
        handleToast("success", "Measure successfully deleted", true);
      }
    } catch (e) {
      if (e?.response?.data) {
        const { error, status, message } = e.response.data;
        console.log(e.response)
        const errorMessage = `${status}: ${error} ${message}`;
        handleToast("danger",errorMessage,true);
        setDeleteOpen(false);
      } else {
        handleToast("danger",e.toString(),true)
        setDeleteOpen(false);
      }
    }
  };

  return (
    <Tooltip
      data-testid="delete-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateDeleteActionState}
      arrow
    >
      <span>
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        measureName={measures[0]?.measureName}
        deleteMeasure={deleteMeasure}
      />
                {toastOpen && (
            <Toast
              type="danger"
              toastKey="delete-error-toast"
              testId="delete-error-toast"
              message={
                "Delete Error\n "+toastMessage
                
              }
              closeButtonProps={{
                "data-testid": "delete-error-close-button",
              }}
              canClose={true}
              onClose={onToastClose}
            />
          )}
        <IconButton
          onClick={()=>setDeleteOpen(true)}
          disabled={disableDeleteBtn}
          data-testid="delete-action-btn"
        >
          <DeleteOutlinedIcon
            sx={disableDeleteBtn ? { color: grey[500] } : { color: red[500] }}
          />
        </IconButton>
      </span>
    </Tooltip>
  );
}
