import React, { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Drawer,
  IconButton,
  Typography,
} from "@mui/material";
import { MessageSquare } from "lucide-react";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Button, RichTextEditor } from "@madie/madie-design-system/dist/react";
import "./CommentsFlyoutPanel.scss";

const COMMENT_SECTIONS = [
  "General",
  "Details",
  "CQL Editor",
  "Population Criteria",
  "Test Cases",
];

interface CommentsFlyoutPanelProps {
  open: boolean;
  onClose: () => void;
  sectionName: string;
}

const CommentsFlyoutPanel = ({
  open,
  onClose,
  sectionName,
}: CommentsFlyoutPanelProps) => {
  const [comment, setComment] = useState("");
  const hasComment =
    comment
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0;

  const handleClose = () => {
    setComment("");
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      data-testid="comments-flyout"
    >
      <Box
        role="dialog"
        aria-label="Comments"
        className="comments-flyout-panel"
      >
        <Box className="comments-flyout-panel-header">
          <Box className="comments-flyout-panel-title-row">
            <MessageSquare color="#0096f4" size={14} />
            <Typography variant="h6" className="comments-flyout-panel-title">
              Comments
            </Typography>
          </Box>
          <IconButton
            aria-label="Close comments"
            data-testid="comments-flyout-close"
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box className="comments-flyout-panel-sections">
          {COMMENT_SECTIONS.map((section) => (
            <Accordion
              key={section}
              disableGutters
              elevation={0}
              className="comments-flyout-panel-accordion"
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                className="comments-flyout-panel-accordion-summary"
              >
                <Typography className="comments-flyout-panel-section-title">
                  {section}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div>-</div>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Box className="comments-flyout-panel-composer">
          <RichTextEditor
            id="comments-flyout-input"
            name="comments-flyout-input"
            data-testid="comments-flyout-input"
            label={`Add a comment to ${sectionName}`}
            content={comment}
            onChange={(value: string) => setComment(value)}
          />
          <Box className="comments-flyout-panel-actions">
            <Button
              variant="outline-secondary"
              disabled={!hasComment}
              onClick={() => setComment("")}
              data-testid="comments-flyout-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="outline-cyan"
              disabled={!hasComment}
              data-testid="comments-flyout-add"
            >
              Add Comment
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CommentsFlyoutPanel;
