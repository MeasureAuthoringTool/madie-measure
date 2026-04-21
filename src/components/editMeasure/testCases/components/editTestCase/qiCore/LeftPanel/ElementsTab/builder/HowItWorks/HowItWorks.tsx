import React, { useState } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import { IconButton } from "@mui/material";
import "./HowItWorks.scss";

const HowItWorks = () => {
  const [isOpen, setIsOpen] = useState(false);

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
            To combine profiles from one test case from each component, follow
            the steps below:
          </p>
          <ol>
            <li>Select which measures to choose test case profiles from.</li>
            <li>Select which test case to choose profiles from.</li>
            <li>Select test case profiles.</li>
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
