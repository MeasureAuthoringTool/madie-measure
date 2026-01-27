import React, { useState } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./ElementSectionQiCore.scss";
import { IconButton } from "@mui/material";
// Tab heading to display weather or not we can see contents

interface ElementSectionProps {
  title: any;
  children?: any;
  startOpen?: any;
}

const ElementSectionQiCore = (props: ElementSectionProps) => {
  const { title, children, startOpen = true } = props;
  const [open, setOpen] = useState(startOpen);
  const chevronClass = open ? "chevron-display open" : "chevron-display";
  const growingDivClass = open
    ? "growing-div-qi-core open"
    : "growing-div-qi-core";

  return (
    <div
      className="test-case-tab-headinq-qi-core"
      data-testid={`elements-${props.title}-sub-heading`}
    >
      <div className="heading-row" />

      <div className={growingDivClass}>
        <div
          className="info-row"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <IconButton
            sx={{ "background-color": "rgba(0,0,0, 0.12)" }}
            data-testid={`elements-heading-expansion-button-${title}`}
            onClick={() => {
              setOpen(!open);
            }}
          >
            <ChevronRightIcon className={chevronClass} />
          </IconButton>
          <h4
            className="header"
            style={{ marginBottom: 0, marginLeft: "16px" }}
          >{`${props.title}`}</h4>
        </div>
        {open && (
          <div data-testid={`elements-header-content-${title}`}>{children}</div>
        )}
      </div>
    </div>
  );
};

export default ElementSectionQiCore;
