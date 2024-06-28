import React from "react";
import { Button } from "@mui/base/Button";
import { styled } from "@mui/system";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material";

const MoreButton = styled(Button)`
  &:hover {
    cursor: pointer;
  }
`;

export const truncateInput = (input, length) => {
  if (input != null && input.trim() !== "" && input.length > length) {
    return input.substring(0, length);
  }
  return input;
};

const TruncateText = ({ text, maxLength = 60, name, dataTestId }) => {
  const theme = useTheme();

  if (text && text.length > maxLength) {
    const displayText = truncateInput(text, maxLength);
    return (
      <div data-testid={`${dataTestId}-content`}>
        {displayText}...
        <Tooltip
          title={text}
          placement="right"
          data-testid={`${dataTestId}-tooltip`}
        >
          <MoreButton
            name={name}
            data-testid={`${dataTestId}-button`}
            sx={{
              color: theme.palette.grey[900],
              textDecoration: "underline",
              textTransform: "lowercase",
              ":hover": {
                cursor: "pointer",
              },
            }}
          >
            more
          </MoreButton>
        </Tooltip>
      </div>
    );
  } else {
    return text;
  }
};

export default TruncateText;
