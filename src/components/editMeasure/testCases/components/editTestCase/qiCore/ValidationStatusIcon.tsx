import React from "react";

import { ValidationStatus } from "@madie/madie-models";
import { MadieSpinner } from "@madie/madie-design-system/dist/react";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

interface ValidationStatusIconProps {
  validationStatus: ValidationStatus;
}

const ValidationStatusIcon = ({
  validationStatus,
}: ValidationStatusIconProps) => {
  return (
    <>
      {[ValidationStatus.PENDING, ValidationStatus.VALIDATING].includes(
        validationStatus
      ) ? (
        <MadieSpinner
          style={{ width: 20, height: 20 }}
          data-testid="validation-header-pending-validating-spinner"
          aria-label="Validation status pending or validating spinner"
        />
      ) : validationStatus === ValidationStatus.INVALID ? (
        <WarningIcon
          color="warning"
          data-testid="validation-header-invalid-icon"
          aria-label="Validation status invalid icon"
        />
      ) : validationStatus === ValidationStatus.VALID ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: "1.5rem",
            width: "1.5rem",
            marginTop: "-0.1rem",
          }}
        >
          <CheckCircleOutlineIcon
            sx={{
              color: "#4CAF50",
            }}
            data-testid="validation-header-valid-icon"
            aria-label="Validation status valid icon"
          />
        </div>
      ) : (
        <WarningIcon
          color="warning"
          data-testid="validation-header-no-status-icon"
          aria-label="Validation status no status icon"
        />
      )}
    </>
  );
};

export default ValidationStatusIcon;
