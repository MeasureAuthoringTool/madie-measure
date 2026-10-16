import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { ChevronRight } from "lucide-react";

export interface CommentSubSectionProps {
  title: string;
  children?: React.ReactNode;
  // used when the sub-section manages its own expand/collapse
  defaultExpanded?: boolean;
  // pass both to let the panel own the expanded state instead
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  // marks the selected sub-section with the vertical blue bar and blue title
  highlighted?: boolean;
  "data-testid"?: string;
}

/*
  Shell for the sub-sections listed in the Comments flyout. It lives here rather
  than in @madie/madie-util on purpose: madie-util is loaded at runtime as a
  separate micro-frontend, so importing a brand new export from it would break
  this panel until that app is rebuilt and redeployed. The panel markup belongs
  to this app; only ReviewSubSection, which already shipped, comes from there.
*/
const CommentSubSection = ({
  title,
  children,
  defaultExpanded = true,
  expanded,
  onToggle,
  highlighted = false,
  "data-testid": dataTestId,
}: CommentSubSectionProps) => {
  const expandedProps =
    expanded === undefined ? { defaultExpanded } : { expanded };

  return (
    <Accordion
      disableGutters
      elevation={0}
      {...expandedProps}
      onChange={
        onToggle
          ? (event, isExpanded: boolean) => onToggle(isExpanded)
          : undefined
      }
      className={`comments-flyout-subsection${
        highlighted ? " comments-flyout-subsection--current" : ""
      }`}
      data-testid={dataTestId}
    >
      <AccordionSummary
        expandIcon={<ChevronRight size={18} />}
        className="comments-flyout-subsection-summary"
      >
        <Typography className="comments-flyout-subsection-title">
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails className="comments-flyout-subsection-details">
        {children}
      </AccordionDetails>
    </Accordion>
  );
};

export default CommentSubSection;
