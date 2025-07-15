import React from "react";
import "../../../../../../styles/DataElementsTable.scss";
import { Button } from "@madie/madie-design-system";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import MadieSpeedDial from "./MadieSpeedDial";
import CloneIcon from "../../../../../../../../../../common/CloneIcon";
import EditIcon from "../../../../../../../../../../common/EditIcon";

type DataElementActionsProps = {
  elementId: string;
  canView: boolean;
  onDelete: Function;
  onView: Function;
  canEdit: boolean;
  onClone: Function;
};

export default function DataElementActions(props: DataElementActionsProps) {
  const { elementId, canView, onDelete, onView, canEdit, onClone } = props;

  return (
    <div>
      {canEdit ? (
        <MadieSpeedDial
          dataTestId={`action-center-${elementId}`}
          actions={[
            {
              icon: <EditIcon color="#0073C8" />,
              name: "Edit element",
              onClick: onView,
              dataTestId: `edit-element-${elementId}`,
            },
            {
              icon: <DeleteOutlinedIcon sx={{ color: "#D92F2F" }} />,
              name: "Delete element",
              onClick: () => {
                onDelete(elementId);
              },
              dataTestId: `delete-element-${elementId}`,
            },
            {
              icon: <CloneIcon color="#0073C8" />,
              name: "Clone element",
              onClick: () => {
                onClone(elementId);
              },
              dataTestId: `clone-element-${elementId}`,
            },
          ]}
        />
      ) : (
        // Case where user can only View.
        <Button
          id={`view-element-btn-${elementId}`}
          data-testid={`view-element-btn-${elementId}`}
          onClick={onView}
          loading={!canView} //disabled state
          variant="primary"
        >
          View
        </Button>
      )}
    </div>
  );
}
