import React from "react";
import CreateCompositeTestCaseLeftPanelNavTabs from "./CreateCompositeTestCaseLeftPanelNavTabs";
import Editor from "../../../editor/Editor";
import _ from "lodash";
import CompositeMeasuresTable from "./CompositeMeasuresTable";
import HowItWorks from "../LeftPanel/ElementsTab/builder/HowItWorks/HowItWorks";
import "./CompositeLeftPanelContent.scss";

const CompositeLeftPanelContent = ({
  leftPanelActiveTab,
  setLeftPanelActiveTab,
  editorVal,
  setEditorVal,
  compositeMeasures,
}) => {
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
