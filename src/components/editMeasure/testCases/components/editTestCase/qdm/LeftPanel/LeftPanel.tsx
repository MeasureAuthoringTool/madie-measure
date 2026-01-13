import React, { useState } from "react";
import "twin.macro";
import "styled-components/macro";
import LeftPanelNavTabs from "./LeftPanelNavTabs";
import ElementsTab from "./ElementsTab/ElementsTab";
import { QdmPatientProvider } from "../../../../util/QdmPatientContext";
import { useFormikContext } from "formik";
import Editor from "../../../editor/Editor";
import { DataElement } from "cqm-models";
import EditorCalculator from "../../calculator/EditorCalculator";
import { useFeatureFlags } from "@madie/madie-util";
import CalculatorDialog from "../../calculator/CalculatorDialog";

const LeftPanel = (props: {
  canEdit: boolean;
  handleTestCaseErrors: Function;
  handleTestCaseWarnings: Function;
  handleMissingDataElements: Function;
  selectedDataElement: DataElement;
  setSelectedDataElement: Function;
}) => {
  const {
    canEdit,
    handleTestCaseErrors,
    handleTestCaseWarnings,
    handleMissingDataElements,
    selectedDataElement,
    setSelectedDataElement,
  } = props;
  const [activeTab, setActiveTab] = useState<string>("elements");
  const [calculationDialogOpen, setCalculationDialogOpen] = useState(false);
  const formik: any = useFormikContext();
  const featureFlags = useFeatureFlags();

  return (
    <div className="left-panel">
      <div className="tab-container">
        <LeftPanelNavTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <div tw="ml-auto mr-2">
          <EditorCalculator onClick={() => setCalculationDialogOpen(true)} />
        </div>
      </div>
      <div className="panel-content">
        <QdmPatientProvider>
          {activeTab === "elements" && (
            <ElementsTab
              canEdit={canEdit}
              handleTestCaseErrors={handleTestCaseErrors}
              handleTestCaseWarnings={handleTestCaseWarnings}
              handleMissingDataElements={handleMissingDataElements}
              selectedDataElement={selectedDataElement}
              setSelectedDataElement={setSelectedDataElement}
            />
          )}
          {activeTab === "json" && (
            <Editor
              value={
                formik.values?.json
                  ? JSON.stringify(JSON.parse(formik.values?.json), null, 2)
                  : ""
              }
              height="100%"
              readOnly={true}
            />
          )}
        </QdmPatientProvider>
      </div>
      <CalculatorDialog
        open={calculationDialogOpen}
        onClose={() => setCalculationDialogOpen(false)}
      />
    </div>
  );
};

export default LeftPanel;
