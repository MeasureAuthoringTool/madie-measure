import React, { useRef } from "react";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import { TestCase } from "@madie/madie-models";
import _ from "lodash";
import useTestCaseServiceApi from "../../../api/useTestCaseServiceApi";

interface MakeJsonMatchUiDialogProps {
  open: boolean;
  onClose: () => void;
  selectedTestCases: TestCase[];
  measureId: string;
  selectedTestCaseCount: number;
  setUpdateQiCoreJsonWithGroupAndTitleWarning: Function;
  setWarnings: Function;
  setToastMessage: (msg: string) => void;
  setToastType: (type: string) => void;
  setToastOpen: (open: boolean) => void;
}

const MakeJsonMatchUiDialog = ({
  open,
  onClose,
  selectedTestCases,
  measureId,
  selectedTestCaseCount,
  setUpdateQiCoreJsonWithGroupAndTitleWarning,
  setToastMessage,
  setToastType,
  setToastOpen,
}: MakeJsonMatchUiDialogProps) => {
  const testCaseService = useRef(useTestCaseServiceApi());

  const makeJsonMatchUi = async (
    selectedTestCases: TestCase[],
    measureId: string
  ) => {
    if (_.size(selectedTestCases) > 0) {
      const selectedTestCaseIds = selectedTestCases?.map(
        (testCase: TestCase) => testCase.id
      );

      try {
        const response =
          await testCaseService.current.updateQiCoreJsonWithGroupAndTitle(
            selectedTestCaseIds,
            measureId
          );
        const { failed = [], updated = [] } = response;
        const total = selectedTestCaseIds.length;

        if (failed.length === 0 && updated.length === total) {
          setToastType("success");
          setToastMessage(
            "All family and given fields have been set for the selected test cases"
          );
          setUpdateQiCoreJsonWithGroupAndTitleWarning([]);
          setToastOpen(true);
        } else if (failed.length > 0 && updated.length > 0) {
          setUpdateQiCoreJsonWithGroupAndTitleWarning((prevState) => [
            ...prevState,
            ...response.failed,
          ]);
        } else if (failed.length === total) {
          setToastType("danger");
          setToastMessage(
            "The operation could not be completed on the selected test cases.  Review the JSON to make changes manually."
          );
          setToastOpen(true);
        }
      } catch (error) {
        setToastType("danger");
        setToastMessage(
          "not be completed on the selected test cases.  Review the JSON to make changes manually."
        );
        setToastOpen(true);
      } finally {
        onClose();
      }
    }
  };

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
        onClick: () => makeJsonMatchUi(selectedTestCases, measureId),
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
