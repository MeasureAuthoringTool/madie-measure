import React, { useState } from "react";
import { SpeedDial, SpeedDialAction, Tooltip } from "@mui/material";

export interface PropTypes {
  actions?: ActionItemDef[];
  idSuffix?: string;
  target: any;
}

export interface ActionItemDef {
  name: string;
  icon: any;
  onClick: (target: any) => void;
}

const ActionCenter = ({ actions, idSuffix, target }: PropTypes) => {
  const [open, setOpen] = useState(false);
  const suffix = idSuffix ? `-${idSuffix}` : "";

  return (
    <div
      data-testid={`action-center${suffix}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 1,
        position: "relative",
        minWidth: "fit-content",
        paddingRight: 1,
      }}
    >
      <SpeedDial
        ariaLabel="Measure action center"
        data-testid={`action-center-button${suffix}`}
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
            data-testid={`delete-tooltip${suffix}`}
            title={open ? "Close" : "More"}
            placement="top"
            arrow
          >
            <div
              data-testid="action-center-actual-icon"
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
              data-testid={`action-center${suffix}_${action.name.replace(
                /\s/g,
                ""
              )}`}
              onClick={() => {
                setOpen(false);
                action.onClick(target);
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
    </div>
  );
};

export default ActionCenter;
