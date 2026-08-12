import React, { useEffect, useState } from "react";
import { useFormik, FormikProvider } from "formik";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import { DialogContent } from "@mui/material";
import { TestCase } from "@madie/madie-models";
import Editor from "../../../editor/Editor";
import ElementsTab from "../LeftPanel/ElementsTab/ElementsTab";
import CreateTestCaseLeftPanelNavTabs from "../../../createTestCase/CreateTestCaseLeftPanelNavTabs";
import CalculatorDialog from "../../calculator/CalculatorDialog";
import { QiCoreResourceProvider } from "../../../../util/QiCorePatientProvider";

interface ViewTestCaseModalProps {
  open: boolean;
  onClose: () => void;
  testCase: TestCase | null;
  isInsertEnabled: boolean;
  onInsert: (testCase: TestCase) => void;
}

function standardizeJson(json: string | undefined | null): string {
  if (!json) {
    return "";
  }

  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch (error) {
    return "";
  }
}

export function getAddedCount(json: string): number {
  if (!json) {
    return 0;
  }

  try {
    const bundle = JSON.parse(json);
    return Array.isArray(bundle?.entry) ? bundle.entry.length : 0;
  } catch (error) {
    return 0;
  }
}

export default function ViewTestCaseModal({
  open,
  onClose,
  testCase,
  isInsertEnabled,
  onInsert,
}: ViewTestCaseModalProps) {
  const [activeTab, setActiveTab] = useState<"added" | "json">("added");
  const [editorVal, setEditorVal] = useState<string>("");
  const [calculationDialogOpen, setCalculationDialogOpen] =
    useState<boolean>(false);
  const [validationSchema, setValidationSchema] = useState({});
  const [initialFormikValuesStu6, setInitialFormikValuesStu6] = useState({});

  const formikStu6Context = useFormik({
    initialValues: initialFormikValuesStu6,
    enableReinitialize: true,
    validationSchema,
    onSubmit: () => {},
  });

  useEffect(() => {
    if (!open) {
      setCalculationDialogOpen(false);
      return;
    }

    setActiveTab("added");
    setEditorVal(standardizeJson(testCase?.json));
  }, [open, testCase]);

  return (
    <MadieDialog
      title={
        testCase?.title ? `View Test Case: ${testCase.title}` : "View Test Case"
      }
      dialogProps={{
        open,
        onClose,
        maxWidth: "lg",
        fullWidth: true,
      }}
      cancelButtonProps={{
        cancelText: "Close",
        "data-testid": "view-test-case-modal-close-button",
      }}
      continueButtonProps={{
        type: "button",
        continueText: "Insert",
        disabled: !testCase || !isInsertEnabled,
        onClick: () => {
          if (testCase && isInsertEnabled) {
            onInsert(testCase);
          }
        },
        "data-testid": "insert-button",
      }}
    >
      <DialogContent>
        <div data-testid="view-test-case-modal" style={{ minHeight: 480 }}>
          <div className="nav-panel">
            <div
              className="tab-container"
              style={{
                backgroundColor: "#ededed",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <CreateTestCaseLeftPanelNavTabs
                leftPanelActiveTab={activeTab}
                setLeftPanelActiveTab={(value) =>
                  setActiveTab(value as "added" | "json")
                }
                isBuilderEnabled={true}
                dirty={false}
                setCalculationDialogOpen={setCalculationDialogOpen}
                canEdit={false}
                addedCount={getAddedCount(editorVal)}
              />
            </div>

            {activeTab === "added" ? (
              <div data-testid="view-test-case-added-panel">
                <FormikProvider value={formikStu6Context}>
                  <QiCoreResourceProvider>
                    <ElementsTab
                      setValidationSchema={setValidationSchema}
                      setInitialFormikValuesStu6={setInitialFormikValuesStu6}
                      setEditorVal={setEditorVal}
                      canEdit={false}
                      editorVal={editorVal}
                      testCase={testCase}
                      activeTab="added"
                    />
                  </QiCoreResourceProvider>
                </FormikProvider>
              </div>
            ) : (
              <div data-testid="view-test-case-json-panel">
                <Editor
                  onChange={(val: string) => setEditorVal(val)}
                  value={editorVal}
                  readOnly={true}
                  height="480px"
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      <CalculatorDialog
        open={calculationDialogOpen}
        onClose={() => setCalculationDialogOpen(false)}
      />
    </MadieDialog>
  );
}
