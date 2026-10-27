import styled from "styled-components";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Allotment } from "allotment";
import _ from "lodash";
import { Button } from "@madie/madie-design-system/dist/react";
import CompositeLeftPanelContent from "./CompositeLeftPanelContent";
import CompositeRightPanelContent from "./CompositeRightPanelContent";
import { useMeasureServiceApi } from "@madie/madie-util";
import { AlertProps, shouldDisableRunTestCaseButton } from "../EditTestCase";

import "styled-components/macro";
import useExecutionContext from "../../../routes/qiCore/useExecutionContext";
import { Model } from "@madie/madie-models";
import ValidationPanelPane from "../ValidationPanelPane";
import { parseCompositeScores } from "../../../testCaseLanding/qiCore/compositeScores";

const EditCompositeTestCase = ({
  allotmentRef,
  editorVal,
  setEditorVal,
  testCaseCanEdit,
  seriesState,
  isModified,
  setDiscardDialogOpen,
  measure,
  formikStu6Context,
  testCase,
  setValidationSchema,
  setInitialFormikValuesStu6,
  validationErrors,
  calculateCompositeTestCase,
  compositeCalculationOutput,
}) => {
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [alert, setAlert] = useState<AlertProps>(null);
  const { executionContextReady, executing } = useExecutionContext();
  const [components, setComponents] = useState([]);
  const componentMeasureIds = useMemo(() => {
    if (!measure?.groups?.length) return [];
    const ids = [];
    measure.groups.forEach((group) => {
      group?.components?.forEach((component) => {
        if (component?.measureId) ids.push(component.measureId);
      });
    });

    return _.uniq(ids);
  }, [measure]);

  const fetchMeasuresForComponents = useCallback(async () => {
    if (!componentMeasureIds.length) {
      setComponents([]);
      return;
    }
    try {
      const results = await measureServiceApi.fetchMeasuresByIds(
        componentMeasureIds
      );

      setComponents(results);
    } catch (err) {
      console.error("error retrieving components", err);
    }
  }, [componentMeasureIds, measureServiceApi]);
  useEffect(() => {
    fetchMeasuresForComponents();
  }, [fetchMeasuresForComponents]);

  const [rightPanelActiveTab, setRightPanelActiveTab] =
    useState<string>("actual");
  const [leftPanelActiveTab, setLeftPanelActiveTab] =
    useState<string>("available");

  // Parse the execution results into per-group composite/denominator/numerator
  // scores for display in the right panel
  const compositeScoresByGroup = useMemo(
    () =>
      (measure?.groups ?? []).map((group) => ({
        groupId: group.id,
        displayId: group.displayId,
        scores: parseCompositeScores(
          compositeCalculationOutput,
          group.displayId
        ),
      })),
    [measure?.groups, compositeCalculationOutput]
  );

  return (
    <div className="allotment-wrapper fullvh">
      <Allotment ref={allotmentRef} defaultSizes={[70, 26, 4]} vertical={false}>
        <Allotment.Pane>
          <div className="nav-panel">
            <CompositeLeftPanelContent
              leftPanelActiveTab={leftPanelActiveTab}
              setLeftPanelActiveTab={setLeftPanelActiveTab}
              editorVal={editorVal}
              setEditorVal={setEditorVal}
              compositeMeasures={components}
              testCaseCanEdit={testCaseCanEdit}
              formikStu6Context={formikStu6Context}
              testCase={testCase}
              setValidationSchema={setValidationSchema}
              setInitialFormikValuesStu6={setInitialFormikValuesStu6}
            />
          </div>
        </Allotment.Pane>
        <Allotment.Pane>
          <div className="right-panel">
            <CompositeRightPanelContent
              isTestCaseExecuted={executing === false}
              rightPanelActiveTab={rightPanelActiveTab}
              setRightPanelActiveTab={setRightPanelActiveTab}
              testCaseCanEdit={testCaseCanEdit}
              alert={alert}
              setAlert={setAlert}
              seriesState={seriesState}
              compositeScoresByGroup={compositeScoresByGroup}
            />
          </div>
        </Allotment.Pane>
        <ValidationPanelPane
          allotmentRef={allotmentRef}
          testCase={testCase}
          validationErrors={validationErrors}
          isQICore6={measure?.model === Model.QICORE_6_0_0}
        />
      </Allotment>

      {/* button wrap in context */}
      <div className="mm:bg-gray-75 mm:w-full mm:sticky mm:bottom-0 mm:left-0 mm:z-40">
        <div
          style={{ alignItems: "end" }}
          className="mm:w-1/2 mm:flex mm:justify-end mm:py-6 mm:float-right"
        >
          <Button
            variant="outline"
            data-testid="edit-test-case-discard-button"
            disabled={!isModified()}
            onClick={() => setDiscardDialogOpen(true)}
            className="mm:m-2"
          >
            Discard Changes
          </Button>
          <Button
            type="button"
            data-testid="run-test-case-button"
            onClick={calculateCompositeTestCase}
            disabled={shouldDisableRunTestCaseButton({
              measure,
              validationErrors,
              editorVal,
              executionContextReady,
              executing,
            })}
            className="mm:m-2"
          >
            Run Test Case
          </Button>
          <span>
            <Button
              variant="cyan"
              type="submit"
              data-testid="edit-test-case-save-button"
              disabled={!isModified()}
              className="mm:m-2"
            >
              Save
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
};
export default EditCompositeTestCase;
