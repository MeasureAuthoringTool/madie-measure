import React from "react";
import CreateCompositeTestCaseLeftPanelNavTabs from "./CreateCompositeTestCaseLeftPanelNavTabs";
import Editor from "../../../editor/Editor";
import _ from "lodash";
import CompositeMeasuresTable from "./CompositeMeasuresTable";
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
        <div className="panel-content">
          <div id="elements-panel">
            <HowItWorks />
            <div className="elements-panel-header">
              <h3>Select Which Measures to choose Test Case Profiles from:</h3>

              <div>
                {compositeMeasures.length && (
                  <p className="sub-heading">
                    0 of {compositeMeasures.length} Measures (Components)
                    complete
                  </p>
                )}
              </div>
            </div>
            <CompositeMeasuresTable measures={compositeMeasures} />
          </div>
        </div>
      )}
      {leftPanelActiveTab === "added" && (
        <div className="panel-content">
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
