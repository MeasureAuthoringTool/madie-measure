import React, { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "twin.macro";
import "styled-components/macro";
import { RichTextEditor } from "@madie/madie-design-system/dist/react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import { blue, red } from "@mui/material/colors";
import { Tooltip } from "@mui/material";
import DOMPurify from "dompurify";
import "./MeasureMetaDataRow.scss";
interface MeasureMetaDataRowProps {
  name: string;
  description: string;
  id?: string;
  handleClick?: Function;
  canEdit?: boolean;
  type?: string;
}

const MeasureMetaDataRow = (props: MeasureMetaDataRowProps) => {
  const { name, description, id, handleClick, canEdit, type } = props;

  return (
    <>
      <tr>
        <td id={`${id}-label`}>{name}</td>
        <td>
          <RichTextEditor
            id={name}
            readOnly
            content={description}
            data-testid={`measure-${type}-${id}-description`}
          />
        </td>

        {id && canEdit && (
          <td style={{ width: 160 }}>
            <Tooltip
              data-testid="delete-tooltip"
              title="Delete"
              placement="top"
              arrow
            >
              <DeleteOutlinedIcon
                onClick={() => {
                  handleClick(id, "delete");
                }}
                data-testid={`delete-measure-${type}-${id}`}
                style={{ cursor: "pointer", marginRight: "8px" }}
                sx={{ color: red[500] }}
              />
            </Tooltip>

            <Tooltip
              data-testid="edit-tooltip"
              title="Edit"
              placement="top"
              arrow
            >
              <BorderColorOutlinedIcon
                onClick={() => {
                  handleClick(id, "edit");
                }}
                data-testid={`edit-measure-${type}-${id}`}
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
