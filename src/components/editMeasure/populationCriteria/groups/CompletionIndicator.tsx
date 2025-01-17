import React from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

const CompletionIndicator = ({ isComplete, label }) => {
  return (
    <div>
      {isComplete ? (
        <ErrorIcon
          sx={{
            color: "#AE1C1C",
            marginRight: "10px",
            height: "20px",
            width: "20px",
          }}
        />
      ) : (
        <CheckCircleIcon
          sx={{
            color: "#4D7E23",
            marginRight: "10px",
            height: "20px",
            width: "20px",
          }}
        />
      )}
      {label}
    </div>
  );
};

export default CompletionIndicator;
