import React from "react";
import { MadieDialog } from "@madie/madie-design-system/dist/react";

interface MakeJsonMatchUiDialogProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  selectedTestCaseCount: number;
}

const MakeJsonMatchUiDialog = ({
  open,
  onClose,
  onContinue,
  selectedTestCaseCount,
}: MakeJsonMatchUiDialogProps) => {
  return (
    <MadieDialog
      title="Are you sure?"
      dialogProps={{
        open,
        onClose,
      }}
      cancelButtonProps={{
        variant: "secondary",
        onClick: onClose,
        cancelText: "Cancel",
        "data-testid": "make-json-match-ui-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        onClick: onContinue,
        continueText: "Yes, Make JSON Match UI",
        "data-testid": "make-json-match-ui-continue-button",
      }}
    >
      <div data-testid="make-json-match-ui-dialog-content">
        <p>
          For each of the selected {selectedTestCaseCount} test cases, you are
          about to:
        </p>
        <ul
          style={{
            marginTop: "8px",
            paddingLeft: "20px",
            listStyleType: "disc",
          }}
        >
          <li>
            Set all "family" fields in the JSON to the <b>group</b> value that
            was entered in the UI
          </li>
          <li>
            Set all "given" fields in the JSON to the <b>title</b> value that
            was entered in the UI
          </li>
        </ul>
        <hr style={{ margin: "16px 0", borderColor: "#8c8c8c" }} />
        <p>
          <b>Are you sure you want to proceed?</b>
        </p>
      </div>
    </MadieDialog>
  );
};

export default MakeJsonMatchUiDialog;
