import React from "react";
import { IconButton } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

interface PropTypes {
  name: string;
  onClick?: () => void;
}

const AddElementButton = ({ name, onClick }: PropTypes) => {
  return (
    <div
      className="element-add-container"
      id={`element-add-${name}`}
      data-testId={`add-element-${name}`}
    >
      <IconButton
        sx={{
          width: "100%",
          fontSize: "0.875rem",
          textTransform: "none",
          fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
          "&:hover": {
            backgroundColor: "transparent",
          },
          padding: 0,
          color: "#3171C2",
        }}
        data-testid={`add-element-${name}`}
        onClick={onClick}
      >
        <AddCircleOutlineIcon sx={{ marginRight: 1 }} />
        <span>Add {name}</span>
      </IconButton>
    </div>
  );
};

export default AddElementButton;
