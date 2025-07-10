import React, { useState } from "react";
import { SpeedDial, SpeedDialAction, Tooltip } from "@mui/material";
import { MadieDeleteDialog } from "@madie/madie-design-system";

export interface PropTypes {
  actions?: ActionItemDef[];
  testId: string;
  target: any;
}

export interface ActionItemDef {
  name: string;
  icon: any;
  onClick: (target: any) => void;
}

const ActionCenter = ({ actions, testId, target }: PropTypes) => {
  const [open, setOpen] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [deleteAction, setDeleteAction] = useState<ActionItemDef>();

  return (
    <div data-testid={`action-center-${testId}`}>
      <SpeedDial
        ariaLabel="Action center"
        data-testid={`action-center-button-${testId}`}
        sx={{
          pointerEvents: "all",
          "& .MuiSpeedDial-fab": {
            width: 40,
            height: 40,
            backgroundColor: "white",
            color: "grey",
            border: "solid 1px #0073C8",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#f0f0f0",
            },
          },
        }}
        icon={
          <Tooltip
            data-testid={`action-center-tooltip-${testId}`}
            title={open ? "Close" : "More"}
            placement="top"
            arrow
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.3s",
                transform: open ? "rotate(90deg)" : "none",
              }}
            >
              <div style={{ margin: "0 2px", color: "#0073C8" }}>•</div>
              <div style={{ margin: "0 2px", color: "#0073C8" }}>•</div>
              <div style={{ margin: "0 2px", color: "#0073C8" }}>•</div>
            </div>
          </Tooltip>
        }
        direction="left"
        open={open}
        onClick={() => setOpen((prevOpen) => !prevOpen)}
      >
        {open &&
          actions?.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              slotProps={{
                tooltip: {
                  title: action.name,
                },
              }}
              data-testid={`action-center-${testId}_${action.name.replace(
                /\s/g,
                ""
              )}`}
              onClick={() => {
                setOpen(false);
                if (action.name === "Delete") {
                  setOpenConfirmDialog(true);
                  setDeleteAction(action);
                } else {
                  action.onClick(target);
                }
              }}
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
        open={openConfirmDialog}
        onContinue={() => {
          deleteAction.onClick(target);
          setOpenConfirmDialog(false);
        }}
        onClose={() => {
          setOpenConfirmDialog(false);
        }}
        dialogTitle="Delete Element"
        name={target.resource?.resourceType}
        hideWarning={true}
      />
    </div>
  );
};

export default ActionCenter;
