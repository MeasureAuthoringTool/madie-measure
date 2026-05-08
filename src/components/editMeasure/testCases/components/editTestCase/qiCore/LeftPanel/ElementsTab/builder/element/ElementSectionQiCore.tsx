import React, { useState, useEffect } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./ElementSectionQiCore.scss";
import { IconButton } from "@mui/material";
import AddElementButton from "../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { useExpandCollapse } from "./ExpandCollapseContext";
// Tab heading to display weather or not we can see contents

interface ElementSectionProps {
  title: any;
  elementDefinition?: any;
  children?: any;
  startOpen?: any;
  canBeMultipleCardinality?: boolean;
  handleAddElement?: () => void;
  required?: boolean;
}

const ElementSectionQiCore = (props: ElementSectionProps) => {
  const {
    title,
    children,
    startOpen,
    canBeMultipleCardinality,
    handleAddElement = true,
    required = false,
  } = props;
  const [open, setOpen] = useState(startOpen);
  const expandCollapseCtx = useExpandCollapse();
  useEffect(() => {
    expandCollapseCtx?.registerSection();
    return () => {
      expandCollapseCtx?.unregisterSection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (
      expandCollapseCtx?.command !== null &&
      expandCollapseCtx?.command !== undefined
    ) {
      setOpen(expandCollapseCtx.command.value);
    }
  }, [expandCollapseCtx?.command]);
  const chevronClass = open ? "chevron-display open" : "chevron-display";
  const growingDivClass = open
    ? "growing-div-qi-core open"
    : "growing-div-qi-core";
  const xClass = title.includes("[x]") ? "x-display" : "";
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
          <h4 className="header">
            {props.required && (
              <span style={{ color: "#AE1C1C", marginRight: 4 }}>*</span>
            )}
            {`${props.title}`}
          </h4>
          {props.canBeMultipleCardinality && (
            <div style={{ marginLeft: "auto" }}>
              <AddElementButton
                name="Element"
                onClick={props.handleAddElement}
              />
            </div>
          )}
        </div>
        {open && (
          <div
            className={`elements-header-content ${xClass}`}
            data-testid={`elements-header-content-${title}`}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default ElementSectionQiCore;
