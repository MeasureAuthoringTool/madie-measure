import React, { useState } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import { IconButton } from "@mui/material";
import "./HowItWorks.scss";

interface HowItWorksProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const HowItWorks = ({
  isOpen: isOpenProp,
  onOpenChange,
}: HowItWorksProps = {}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpenProp !== undefined;
  const isOpen = isControlled ? isOpenProp : internalOpen;
  const setIsOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  if (!isOpen) {
    return (
      <div className="how-it-works-container" data-testid="how-it-works">
        <button
          type="button"
          className="how-it-works-link"
          data-testid="how-it-works-link"
          aria-expanded={false}
          aria-controls="how-it-works-content"
          onClick={() => setIsOpen(true)}
        >
          <PrivacyTipIcon className="how-it-works-privacy-icon" />
          How it works
        </button>
      </div>
    );
  }

  return (
    <div className="how-it-works-container" data-testid="how-it-works">
      <div
        className="how-it-works-info"
        id="how-it-works-content"
        data-testid="how-it-works-content"
        role="region"
        aria-label="How it works information"
      >
        <PrivacyTipIcon className="how-it-works-icon" />
        <div className="how-it-works-body">
          <strong>How it Works</strong>
          <p>
            This workflow allows you to insert all profiles from a selected test
            case into the current test case.
          </p>
          <p>To complete this process:</p>
          <ol>
            <li>
              Select the measure that contains the test case you want to insert.
            </li>
            <li>
              Select the test case you want to insert profiles from.
              <ul className="how-it-works-sub-list">
                <li>
                  You can select View Test Case to review details before
                  proceeding.
                </li>
              </ul>
            </li>
            <li>Select Insert.</li>
          </ol>
        </div>
        <IconButton
          data-testid="how-it-works-close"
          aria-label="Close how it works"
          onClick={() => setIsOpen(false)}
          className="how-it-works-close"
          sx={{
            alignSelf: "stretch",
            borderRadius: 0,
            borderLeft: "1px solid #B0B0B0",
            marginLeft: "auto",
          }}
        >
          <ClearIcon sx={{ color: "#D92F2F" }} />
        </IconButton>
      </div>
    </div>
  );
};

export default HowItWorks;
