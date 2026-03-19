import React, { useState } from "react";
import { SpeedDial, SpeedDialAction } from "@mui/material";

type Action = {
  icon: React.ReactNode;
  name: any;
  onClick?: Function;
  dataTestId?: string;
};
interface MadieSpeedDialProps {
  actions?: Action[];
  dataTestId?: any;
}

const MadieSpeedDial = (props: MadieSpeedDialProps) => {
  const { actions, dataTestId } = props;
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        color: "#0073C8",
      }}
    >
      <SpeedDial
        ariaLabel={dataTestId ? dataTestId : "action-center"}
        data-testId={dataTestId ? dataTestId : "action-center-button"}
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
        }
        direction="right"
        open={open}
        onClick={() => setOpen((prevOpen) => !prevOpen)}
      >
        {actions?.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            data-testid={action?.dataTestId}
            onClick={() => {
              setOpen(false);
              action.onClick();
            }}
            sx={{
              boxShadow: "none",
              transition: "opacity 0s, visibility 0s",
              margin: 0,
              marginRight: 1,
              transitionDelay: "0s",
            }}
            arrow
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
          />
        ))}
      </SpeedDial>
    </div>
  );
};

export default MadieSpeedDial;
