import React, { useRef, useState } from "react";
import CreateCompositeTestCaseLeftPanelNavTabs from "./CreateCompositeTestCaseLeftPanelNavTabs";
import Editor from "../../../editor/Editor";
import CompositeMeasuresTable from "./CompositeMeasuresTable";
import CompositeTestCasesTable from "./CompositeTestCasesTable";
import useTestCaseServiceApi from "../../../../api/useTestCaseServiceApi";
import { Measure, TestCase } from "@madie/madie-models";
import { MadieSpinner } from "@madie/madie-design-system/dist/react";
import "./CompositeLeftPanelContent.scss";

const CompositeLeftPanelContent = ({
  leftPanelActiveTab,
  setLeftPanelActiveTab,
  editorVal,
  setEditorVal,
  compositeMeasures,
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
        />
      </div>
      {leftPanelActiveTab === "elements" && (
        <div className="panel-content">
          <div id="elements-panel">
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
