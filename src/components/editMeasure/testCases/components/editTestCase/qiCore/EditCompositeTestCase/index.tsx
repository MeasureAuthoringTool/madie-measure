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
import {
  AlertProps,
  hasValidationErrorSeverity,
  isEmptyTestCaseJsonString,
} from "../EditTestCase";
import tw, { styled } from "twin.macro";
import "styled-components/macro";
import useExecutionContext from "../../../routes/qiCore/useExecutionContext";
import { Measure } from "@madie/madie-models/dist/Measure";

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
}) => {
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [alert, setAlert] = useState<AlertProps>(null);
  const { executionContextReady } = useExecutionContext();
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

  function shouldDisableRunTestCaseButton(params: {
    measure: Measure | undefined;
    validationErrors: any[];
    editorVal: string;
    executionContextReady: boolean;
  }): boolean {
    const { editorVal, executionContextReady, measure, validationErrors } =
      params;
    const isEmptyJson = isEmptyTestCaseJsonString(editorVal);
    const isNotReady = !executionContextReady;

    const canExecuteInvalidTestCases =
      measure?.testCaseConfiguration?.executeInvalidTestCases;

    // do not check for validation errors if invalid test cases execution is enabled
    const hasValidationErrors = canExecuteInvalidTestCases
      ? false
      : hasValidationErrorSeverity(validationErrors);

    return hasValidationErrors || isEmptyJson || isNotReady;
  }
  return (
    <div className={`allotment-wrapper`}>
      <Allotment ref={allotmentRef} defaultSizes={[48, 48, 4]} vertical={false}>
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
              rightPanelActiveTab={rightPanelActiveTab}
              setRightPanelActiveTab={setRightPanelActiveTab}
              testCaseCanEdit={testCaseCanEdit}
              alert={alert}
              setAlert={setAlert}
              seriesState={seriesState}
            />
          </div>
        </Allotment.Pane>
      </Allotment>

      {/* button wrap in context */}
      <div tw="bg-gray-75 w-full sticky bottom-0 left-0 z-40">
        <div
          tw="w-1/2 flex justify-end py-6 float-right"
          style={{ alignItems: "end" }}
        >
          <Button
            tw="m-2"
            variant="outline"
            data-testid="edit-test-case-discard-button"
            disabled={!isModified()}
            onClick={() => setDiscardDialogOpen(true)}
          >
            Discard Changes
          </Button>
          <Button
            tw="m-2"
            type="button"
            data-testid="run-test-case-button"
            disabled={shouldDisableRunTestCaseButton({
              measure,
              validationErrors,
              editorVal,
              executionContextReady,
            })}
          >
            Run Test Case
          </Button>
          <span>
            <Button
              tw="m-2"
              variant="cyan"
              type="submit"
              data-testid="edit-test-case-save-button"
              disabled={!isModified()}
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
