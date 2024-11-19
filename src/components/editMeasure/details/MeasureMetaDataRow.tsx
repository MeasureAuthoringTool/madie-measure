import React, { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "twin.macro";
import "styled-components/macro";
import { Popover } from "@madie/madie-design-system/dist/react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { blue, red } from "@mui/material/colors";
import { Tooltip } from "@mui/material";

interface MeasureMetaDataRowProps {
  name: string;
  description: string;
  id?: string;
  handleClick?: Function;
  canEdit?: boolean;
}

const MeasureMetaDataRow = (props: MeasureMetaDataRowProps) => {
  const { name, description, id, handleClick, canEdit } = props;
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <>
      <tr>
        <td>{name}</td>
        <td>{description}</td>
        {id && canEdit && (
          <td style={{ width: 160 }}>
            <Tooltip
              data-testid="delete-tooltip"
              title={"Delete"}
              placement={"top"}
              arrow
            >
              <DeleteOutlinedIcon
                onClick={(e) => {
                  e.preventDefault();
                  handleClick(id, "delete");
                }}
                data-testid={`delete-measure-reference-${id}`}
                style={{ cursor: "pointer", marginRight: "8px" }}
                sx={{ color: red[500] }}
              />
            </Tooltip>

            <Tooltip
              data-testid="edit-tooltip"
              title={"Edit"}
              placement={"top"}
              arrow
            >
              <EditNoteIcon
                onClick={(e) => {
                  e.preventDefault();
                  handleClick(id, "edit");
                }}
                data-testid={`edit-measure-reference-${id}`}
                style={{ cursor: "pointer" }}
                sx={{ color: blue[500] }}
              />
            </Tooltip>
          </td>
        )}
      </tr>
    </>
  );
};
export default MeasureMetaDataRow;
