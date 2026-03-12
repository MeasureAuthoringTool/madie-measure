import React, { useState, useEffect } from "react";
import { SpeedDial, SpeedDialAction } from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { MadieDeleteDialog } from "@madie/madie-design-system/dist/react";

interface PropTypes {
  rootDefinition: any;
  numElements: number;
  elementValue: any;
  elementName: string;
  handleDelete: (path: string, element: any, elementName: string) => void;
  addElementOfMultipleCardinality: () => void;
}
interface Action {
  name: string;
  icon: JSX.Element;
  onClick?: () => void;
}

const ElementEditorActionCenter = (props: PropTypes) => {
  const [deleteDialogModalOpen, setDeleteDialogModalOpen] =
    useState<boolean>(false);
  const { handleDelete, rootDefinition, elementValue, elementName } = props;
  const [open, setOpen] = useState(false);

  const [actions, setActions] = useState<Array<Action>>([]);
  const addAction = {
    name: "Add",
    icon: <AddCircleOutlineIcon sx={{ color: "#3171C2" }} />,
    onClick: () => {
      props.addElementOfMultipleCardinality();
    },
  };
  const deleteAction = {
    name: "Delete",
    icon: <DeleteOutlinedIcon sx={{ color: "#c83f38" }} />,
    onClick: () => setDeleteDialogModalOpen(true),
  };

  // Attribute Cardinality 	Delete 	Copy 	Add New
  // 0..1 	                X
  // 0..* 	                X 	    X 	    X
  // 1..1
  // 1..* 	                X* 	    X 	    X
  useEffect(() => {
    const localActions: Array<Action> = [];
    const min: string = props.rootDefinition.min;
    const max: string = props.rootDefinition.max;

    if (
      (min == "0" && max == "1") ||
      (min == "0" && max == "*") ||
      (min == "1" && max == "*" && props.numElements > 1)
    ) {
      localActions.push(deleteAction);
    }
    if (max == "*") {
      localActions.push(addAction);
    }
    setActions(localActions);
  }, [props.numElements, props.rootDefinition]);
  if (actions.length > 0) {
    return (
      <div
        data-testid="elements-action-center"
        style={{
          display: "flex",
          alignItems: "center",
          height: 40,
          backgroundColor: open ? "white" : "transparent",
          borderRadius: 25,
        }}
      >
        <SpeedDial
          ariaLabel="Element action center"
          data-testid="elements-action-center-button"
          sx={{
            "& .MuiSpeedDial-fab": {
              width: 40,
              height: 40,
              backgroundColor: "white",
              color: "grey",
              "&:hover": {
                backgroundColor: "#f0f0f0",
              },
              outline: "auto",
              outlineColor: "#3171C2",
              boxShadow: 0,
            },
          }}
          icon={
            <div
              data-testid="elements-action-center-actual-icon"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.3s",
                transform: open ? "rotate(90deg)" : "none",
              }}
            >
              <div style={{ margin: "0 2px", color: "#3171C2" }}>•</div>
              <div style={{ margin: "0 2px", color: "#3171C2" }}>•</div>
              <div style={{ margin: "0 2px", color: "#3171C2" }}>•</div>
            </div>
          }
          direction="left"
          open={open}
          onClick={() => setOpen((prevOpen) => !prevOpen)}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              data-testid={`elements-${action.name
                .replace(/\s/g, "")
                .toLowerCase()}`}
              onClick={() => action?.onClick()}
              sx={{
                boxShadow: "none",
                transition: "opacity 0s, visibility 0s",
                margin: 0,
                marginRight: 1,
                transitionDelay: "0s",
              }}
            />
          ))}
        </SpeedDial>
        <MadieDeleteDialog
          open={deleteDialogModalOpen}
          onContinue={() => {
            handleDelete(rootDefinition?.path, elementValue, elementName);
            setDeleteDialogModalOpen(false);
          }}
          onClose={() => {
            setDeleteDialogModalOpen(false);
          }}
          dialogTitle="Delete Element"
          name={
            rootDefinition?.sliceName
              ? rootDefinition.sliceName
              : rootDefinition.path
          }
          hideWarning={true}
        />
      </div>
    );
  } else {
    return <div></div>;
  }
};

export default ElementEditorActionCenter;
