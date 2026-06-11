import React, { useState, useEffect } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./ElementSectionQiCore.scss";
import { IconButton } from "@mui/material";
import AddElementButton from "../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { useExpandCollapse } from "./ExpandCollapseContext";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { FormikContext, getIn } from "formik";
import { hasNonEmptyValue } from "./TypeEditorUtils";
// Tab heading to display weather or not we can see contents

interface ElementSectionProps {
  title: any;
  elementDefinition?: any;
  children?: any;
  startOpen?: any;
  canBeMultipleCardinality?: boolean;
  showAddButton?: boolean;
  handleAddElement?: () => void;
  handleDeleteElement?: () => void;
  required?: boolean;
  fieldPath?: string;
}

const ElementSectionQiCore = (props: ElementSectionProps) => {
  const {
    title,
    children,
    startOpen,
    canBeMultipleCardinality,
    showAddButton = canBeMultipleCardinality,
    handleAddElement = true,
    required = false,
    fieldPath,
  } = props;
  const [open, setOpen] = useState(startOpen);
  const expandCollapseCtx = useExpandCollapse();
  // useContext so this works standalone (no Formik provider) in tests.
  const formik = React.useContext(FormikContext) as any;
  useEffect(() => {
    expandCollapseCtx?.registerSection();
    return () => {
      expandCollapseCtx?.unregisterSection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const command = expandCollapseCtx?.command;
    if (command !== null && command !== undefined) {
      if (command.mode === "populated") {
        const value = fieldPath ? getIn(formik?.values, fieldPath) : undefined;
        setOpen(hasNonEmptyValue(value));
      } else {
        setOpen(command.value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          {(showAddButton || canBeMultipleCardinality) && (
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
              }}
            >
              {showAddButton && (
                <AddElementButton
                  name="Element"
                  onClick={props.handleAddElement}
                />
              )}
              {canBeMultipleCardinality && (
                <IconButton
                  data-testid={`elements-delete-button-${title}`}
                  onClick={props.handleDeleteElement}
                  disabled={!props.handleDeleteElement}
                >
                  <DeleteOutlineIcon color="error" />
                </IconButton>
              )}
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
