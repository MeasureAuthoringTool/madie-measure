import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import ReviewIcon from "../../../../../icons/ReviewIcon";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
  canEdit: boolean;
}

export const SELECT_MEASURE_TO_UPDATE_REVIEW_STATUS =
  "Select a measure to update Review status";
export const REVIEW = "Review";

export default function ReviewAction(props: PropTypes) {
  const { measures, canEdit, onClick } = props;
  const [disableReviewBtn, setDisableReviewBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(
    SELECT_MEASURE_TO_UPDATE_REVIEW_STATUS
  );

  const validateReviewActionState = useCallback(() => {
    const shouldEnableReview = measures?.length === 1 && canEdit;

    setDisableReviewBtn(!shouldEnableReview);
    setTooltipMessage(
      shouldEnableReview ? REVIEW : SELECT_MEASURE_TO_UPDATE_REVIEW_STATUS
    );
  }, [canEdit, measures]);

  useEffect(() => {
    validateReviewActionState();
  }, [validateReviewActionState]);

  return (
    <Tooltip
      data-testid="review-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateReviewActionState}
      arrow
      placement="top"
      slotProps={{
        tooltip: {
          sx: {
            zIndex: 99,
            backgroundColor: "#333",
            "& .MuiTooltip-arrow": {
              color: "#333",
            },
          },
        },
      }}
    >
      <span>
        <IconButton
          onClick={onClick}
          disabled={disableReviewBtn}
          data-testid="review-action-btn"
        >
          <ReviewIcon disabled={disableReviewBtn} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
