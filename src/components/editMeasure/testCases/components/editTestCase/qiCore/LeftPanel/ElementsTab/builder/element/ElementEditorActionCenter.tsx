import React, { useState, useEffect } from "react";
import { SpeedDial, SpeedDialAction } from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { blue, red } from "@mui/material/colors";

interface PropTypes {
  //coming soon
}

const ElementEditorActionCenter = (props: PropTypes) => {
  const [open, setOpen] = useState(false);

  const actions = [
    { name: "Copy", icon: <ContentCopyIcon sx={{ color: blue[500] }} /> },
    { name: "Add", icon: <AddCircleOutlineIcon sx={{ color: blue[500] }} /> },
    { name: "Delete", icon: <DeleteOutlinedIcon sx={{ color: red[500] }} /> },
  ];

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
            outlineColor: "#2196f3",
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
            <div style={{ margin: "0 2px", color: "#2196f3" }}>•</div>
            <div style={{ margin: "0 2px", color: "#2196f3" }}>•</div>
            <div style={{ margin: "0 2px", color: "#2196f3" }}>•</div>
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
            data-testid={`elements-${action.name.replace(/\s/g, "")}`}
            onClick={() => {
              setOpen(false);
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

export default ElementEditorActionCenter;
