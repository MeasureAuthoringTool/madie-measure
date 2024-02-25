import React, { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "twin.macro";
import "styled-components/macro";
import {
  TextField,
  Button,
  Popover,
  Toast,
} from "@madie/madie-design-system/dist/react";

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
    console.log("here")
    setOptionsOpen(false);
    setSelectedReferenceId(null);
    setAnchorEl(null);
   // setCanEdit(false);
  };

  return (
    <>
      <tr>
        <td>{name}</td>
        <td>{description}</td>
        {id && (
          // <td>
          //   <Button
          //     variant="outline-secondary"
          //     name="Edit"
          //     onClick={() => {
          //       handleClick(id,'delete');
          //     }}
          //     disabled={!canEdit}
          //     data-testid={`measure-definition-edit-${id}`}
          //     aria-label={`Measure definition ${id}`}
          //     role="button"
          //     tab-index={0}
          //   >
          //     Delete
          //   </Button>
          // </td>
          <td style={{ width: 160 }}>
            <button
              className="action-button"
              onClick={(e) => {
                handleOpen(id, e);
              }}
              tw="text-blue-600 hover:text-blue-900"
              data-testid={`select-action-${name}`}
              aria-label={`select-action-${name}`}
            >
              <div className="action">Select</div>
              <div className="chevron-container">
                <ExpandMoreIcon />
              </div>
            </button>
          </td>
        )}
      </tr>
      {console.log(optionsOpen, anchorEl)}
      {/* {optionsOpen && ( */}
        <Popover
          optionsOpen={optionsOpen}
          anchorEl={anchorEl}
          handleClose={handleClose}
          canEdit={canEdit}
          editViewSelectOptionProps={{
            label: "Edit",
            toImplementFunction: () => handleClick(selectedReferenceId, "edit"),
            dataTestId: `view-measure-${selectedReferenceId}`,
          }}
          otherSelectOptionProps={[
            {
              label: "Delete",
              toImplementFunction: () =>
                handleClick(selectedReferenceId, "delete"),
              dataTestId: `draft-measure-${selectedReferenceId}`,
            },
          ]}
        />
      {/* )} */}
    </>
  );
};
export default MeasureMetaDataRow;
