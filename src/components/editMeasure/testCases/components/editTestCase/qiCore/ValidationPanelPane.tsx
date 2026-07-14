import React, { useState } from "react";
import { Allotment } from "allotment";
import { Button } from "@madie/madie-design-system/dist/react";
import KeyboardTabIcon from "@mui/icons-material/KeyboardTab";
import ValidationPanel from "./ValidationPanel";
import ValidationStatusIcon from "./ValidationStatusIcon";

interface ValidationPanelPaneProps {
  allotmentRef: React.RefObject<any>;
  testCase: any;
  validationErrors: any[];
  isQICore6: boolean;
}

const ValidationPanelPane = ({
  allotmentRef,
  testCase,
  validationErrors,
  isQICore6,
}: ValidationPanelPaneProps) => {
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  return (
    <Allotment.Pane minSize={4}>
      <div
        className={`validation-panel ${
          showValidationErrors ? "open" : "closed"
        }`}
      >
        {showValidationErrors ? (
          <>
            <div className="flex justify-between items-center w-full mb-2">
              <div className="validation-header">
                <div className="header-left">
                  <ValidationStatusIcon
                    validationStatus={testCase?.validationStatus}
                  />
                  <span className="ml-2">
                    Validations (
                    {validationErrors?.filter(
                      (error) => !/^information/.test(error?.severity)
                    ).length || 0}
                    )
                  </span>
                </div>

                <Button
                  variant="action"
                  data-testid="hide-json-validation-errors-button"
                  onClick={() => {
                    setShowValidationErrors(false);
                    setTimeout(() => {
                      allotmentRef.current.resize([48, 48, 4]);
                    }, 0);
                  }}
                  className="validation-panel-toggle-button"
                  title="Close Panel"
                >
                  <KeyboardTabIcon />
                </Button>
              </div>
            </div>
            <div
              className="validation-content"
              data-testid="json-validation-errors-list"
            >
              <ValidationPanel
                testCase={testCase}
                validationErrors={validationErrors}
                isQiCoreV6={isQICore6}
              />
            </div>
          </>
        ) : (
          <div data-testid="closed-json-validation-errors-aside">
            <div className="closed-header">
              <Button
                size="small"
                data-testid="show-json-validation-errors-button"
                onClick={() => {
                  setShowValidationErrors(true);
                  allotmentRef.current.resize([34, 33, 33]);
                }}
                className="validation-panel-toggle-button"
                title={
                  testCase?.validationStatus
                    ? testCase?.validationStatus
                    : "Open Validations"
                }
              >
                <ValidationStatusIcon
                  validationStatus={testCase?.validationStatus}
                />
              </Button>
            </div>
            <div className="closed-body"></div>
          </div>
        )}
      </div>
    </Allotment.Pane>
  );
};

export default ValidationPanelPane;
