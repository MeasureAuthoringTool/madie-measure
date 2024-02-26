import React, { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "twin.macro";
import "styled-components/macro";
import { Popover } from "@madie/madie-design-system/dist/react";

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
  const [selectedReferenceId, setSelectedReferenceId] = useState<string>(null);

  const handleOpen = (
    selectedId,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setOptionsOpen(true);
    setSelectedReferenceId(selectedId);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setOptionsOpen(false);
    setSelectedReferenceId(null);
    setAnchorEl(null);
  };

  return (
    <>
      <tr>
        <td>{name}</td>
        <td>{description}</td>
        {id && (
          <td style={{ width: 160 }}>
            <button
              className="action-button"
              onClick={(e) => {
                handleOpen(id, e);
              }}
              tw="text-blue-600 hover:text-blue-900"
              data-testid={`select-action-${id}`}
              aria-label={`select-action-${id}`}
            >
              <div className="action">Select</div>
              <div className="chevron-container">
                <ExpandMoreIcon />
              </div>
            </button>
          </td>
        )}
      </tr>
      <Popover
        optionsOpen={optionsOpen}
        anchorEl={anchorEl}
        handleClose={handleClose}
        canEdit={canEdit}
        editViewSelectOptionProps={{
          label: "Edit",
          toImplementFunction: () => {
            handleClick(selectedReferenceId, "edit");
            setOptionsOpen(false);
          },
          dataTestId: `edit-measure-reference-${selectedReferenceId}`,
        }}
        otherSelectOptionProps={[
          {
            label: "Delete",
            toImplementFunction: () => {
              handleClick(selectedReferenceId, "delete");
              setOptionsOpen(false);
            },
            dataTestId: `delete-measure-reference-${selectedReferenceId}`,
          },
        ]}
      />
    </>
  );
};
export default MeasureMetaDataRow;
