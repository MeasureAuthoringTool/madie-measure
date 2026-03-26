import React from "react";
import Search from "@mui/icons-material/Search";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";

const EditorSearch = () => {
  const toggleSearch = () => {
    const event = new CustomEvent("toggleEditorSearchBox");
    window.dispatchEvent(event);
  };

  return (
    <Tooltip
      title="Find in editor"
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
    >
      <IconButton
        data-testid="editor-search-button"
        aria-label="search button"
        style={{
          color: "#0073c8",
        }}
        onClick={toggleSearch}
      >
        <Search />
      </IconButton>
    </Tooltip>
  );
};

export default EditorSearch;
