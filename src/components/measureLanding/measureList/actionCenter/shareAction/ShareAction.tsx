import React, { useCallback, useEffect, useState } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import ShareIcon from "../../../../common/ShareIcon";

interface PropTypes {
  measures: Measure[];
  onClick: (option: string) => void;
  isOwner: boolean;
}

export const NOTHING_SELECTED = "Select a measure to share/unshare";
export const INVALID_SHARE_MEASURE =
  "You cannot share/unshare a measure you do not own";
export const VALID_SHARE_MEASURE = "Share/Unshare";

const options = ["Share With", "Unshare"];

export default function ShareAction(props: PropTypes) {
  const { measures, isOwner } = props;
  const [disableShareBtn, setDisableShareBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const validateShareActionState = useCallback(() => {
    setDisableShareBtn(true);

    if (measures?.length === 0) {
      setTooltipMessage(NOTHING_SELECTED);
    } else if (isOwner) {
      setDisableShareBtn(false);
      setTooltipMessage(VALID_SHARE_MEASURE);
    } else {
      setTooltipMessage(INVALID_SHARE_MEASURE);
    }
  }, [measures, isOwner]);

  useEffect(() => {
    validateShareActionState();
  }, [measures, validateShareActionState]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setTooltipMessage(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (option: string) => {
    handleClose();

    props.onClick(option);
  };

  return (
    <Tooltip
      data-testid="share-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateShareActionState}
      placement="top"
      arrow
    >
      <span>
        <IconButton
          onClick={handleClick}
          disabled={disableShareBtn}
          data-testid="share-action-btn"
        >
          <ShareIcon color={disableShareBtn ? "#8C8C8C" : "#0073C8"} />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          data-testid="share-menu"
        >
          {options.map((option) => (
            <MenuItem
              data-testid={`${option}-option`}
              key={option}
              onClick={() => handleMenuItemClick(option)}
            >
              {option}
            </MenuItem>
          ))}
        </Menu>
      </span>
    </Tooltip>
  );
}
