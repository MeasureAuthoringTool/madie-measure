import React, { useState } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./CodesSection.scss";
// Tab heading to display weather or not we can see contents

interface CodesSectionProps {
  title: string;
  children?: any;
}

const CodesSection = (props: CodesSectionProps) => {
  const { title, children } = props;
  const [open, setOpen] = useState(true);
  const chevronClass = open ? "chevron-display open" : "chevron-display";
  const growingDivClass = open ? "growing-div open" : "growing-div";

  return (
    <div
      className="cql-editor-tab-heading"
      data-testid={`cql-editor-${props.title}-sub-heading`}
    >
      <div
        onClick={() => {
          setOpen(!open);
        }}
        tabIndex={0}
        role="button"
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            setOpen(!open);
          }
        }}
        className="heading-row"
      >
        <h4 className="header">{props.title}</h4>
        <ChevronRightIcon className={chevronClass} />
      </div>

      <div className={growingDivClass}>
        {open && (
          <div data-testid={`cql-editor-header-content-${title}`}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodesSection;
