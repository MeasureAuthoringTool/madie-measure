import React, { useRef, useState } from "react";
import CreateCompositeTestCaseLeftPanelNavTabs from "./CreateCompositeTestCaseLeftPanelNavTabs";
import Editor from "../../../editor/Editor";
import CompositeMeasuresTable from "./CompositeMeasuresTable";
import CompositeTestCasesTable from "./CompositeTestCasesTable";
import useTestCaseServiceApi from "../../../../api/useTestCaseServiceApi";
import { Measure, TestCase } from "@madie/madie-models";
import { MadieSpinner } from "@madie/madie-design-system/dist/react";
import HowItWorks from "../LeftPanel/ElementsTab/builder/HowItWorks/HowItWorks";
import "./CompositeLeftPanelContent.scss";
import { FormikProvider } from "formik";
import ElementsTab from "../LeftPanel/ElementsTab/ElementsTab";

const CompositeLeftPanelContent = ({
  leftPanelActiveTab,
  setLeftPanelActiveTab,
  editorVal,
  setEditorVal,
  compositeMeasures,
  testCaseCanEdit,
  formikStu6Context,
  testCase,
  setValidationSchema,
  setInitialFormikValuesStu6,
}) => {
  const testCaseService = useRef(useTestCaseServiceApi());
  const [selectedMeasure, setSelectedMeasure] = useState<Measure | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [completedMeasureCount, setCompletedMeasureCount] = useState(0);

  const handleSelectTestCase = async (measure: Measure) => {
    setLoadingTestCases(true);
    setSelectedMeasure(measure);
    try {
      const cases = await testCaseService.current.getTestCasesByMeasureId(
        measure.id
      );
      setTestCases(cases);
    } catch (error) {
      console.error("Failed to fetch test cases:", error);
      setTestCases([]);
    } finally {
      setLoadingTestCases(false);
    }
  };

  const handleBackToMeasures = () => {
    setSelectedMeasure(null);
    setTestCases([]);
  };

  return (
    <>
      <div className="tab-container">
        <CreateCompositeTestCaseLeftPanelNavTabs
          leftPanelActiveTab={leftPanelActiveTab}
          setLeftPanelActiveTab={setLeftPanelActiveTab}
          testCaseCanEdit={testCaseCanEdit}
        />
      </div>
      {leftPanelActiveTab === "create" && (
        <div className="panel-content" data-testid="create-panel">
          <div id="elements-panel">
            <HowItWorks />
            {loadingTestCases ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: 40,
                }}
              >
                <MadieSpinner style={{ height: 50, width: 50 }} />
              </div>
            ) : selectedMeasure ? (
              <CompositeTestCasesTable
                testCases={testCases}
                selectedMeasure={selectedMeasure}
                onBackToMeasures={handleBackToMeasures}
              />
            ) : (
              <>
                <div className="elements-panel-header">
                  <h3>
                    Select Which Measures to choose Test Case Profiles from:
                  </h3>
                  <div>
                    {compositeMeasures.length > 0 && (
                      <p className="sub-heading">
                        {completedMeasureCount} of {compositeMeasures.length}{" "}
                        Measures (Components) complete
                      </p>
                    )}
                  </div>
                </div>
                <CompositeMeasuresTable
                  measures={compositeMeasures}
                  onSelectTestCase={handleSelectTestCase}
                />
              </>
            )}
          </div>
        </div>
      )}
      {leftPanelActiveTab === "added" && (
        <div className="panel-content" data-testid="added-panel">
          <FormikProvider value={formikStu6Context}>
            <ElementsTab
              setValidationSchema={setValidationSchema}
              setInitialFormikValuesStu6={setInitialFormikValuesStu6}
              setEditorVal={setEditorVal}
              // currently locking to readOnly MAT-9905
              canEdit={false}
              editorVal={editorVal}
              testCase={testCase}
              activeTab={leftPanelActiveTab}
            />
          </FormikProvider>
        </div>
      )}
      {leftPanelActiveTab === "json" && (
        <Editor
          onChange={(val: string) => setEditorVal(val)}
          value={editorVal}
          readOnly={true}
          height="100%"
        />
      )}
    </>
  );
};

export default CompositeLeftPanelContent;
