import React from "react";
import GroupPopulations from "../../../populations/GroupPopulations";

const ExpectedActual = ({
  canEdit,
  groupPopulations,
  onChange,
  onStratificationChange,
  errors,
  isTestCaseExecuted = false,
  clearTestResults,
  groupsStratificationAssociationMap,
  groups,
  observationResources,
}) => {
  return (
    <div
      data-testid="create-test-case-populations"
      id="create-test-case-right-panel"
    >
      <GroupPopulations
        groupsStratificationAssociationMap={groupsStratificationAssociationMap}
        disableExpected={!canEdit}
        groupPopulations={groupPopulations}
        onChange={onChange}
        onStratificationChange={onStratificationChange}
        errors={errors}
        isTestCaseExecuted={isTestCaseExecuted}
        setIsTestCaseExecuted={clearTestResults}
        groups={groups}
        observationResources={observationResources}
      />
    </div>
  );
};

export default ExpectedActual;
