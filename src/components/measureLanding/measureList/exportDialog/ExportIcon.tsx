import React from "react";
import { CircularProgress } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
// given loading state, render icon
// success, fail, downloading
const ExportIcon = (props: { downloadState: string }) => {
  const { downloadState } = props;
  let content = (
    <CircularProgress
      sx={{ height: "40px", width: "40px" }}
      data-testid="circular-progress"
    />
  );

  if (downloadState === "success" || downloadState === "warning") {
    content = (
      <CheckCircleOutlineIcon
        sx={{ height: "40px", width: "40px", color: "#4D7E23" }}
      />
    );
  }
  if (downloadState === "failure") {
    content = (
      <CancelOutlinedIcon
        sx={{ height: "40px", width: "40px", color: "#D92F2F" }}
      />
    );
  }
  return content;
};
export default ExportIcon;
