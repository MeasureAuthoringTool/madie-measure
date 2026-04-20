import React, { useCallback, useEffect, useRef, useState } from "react";
import { MeasureSearchCriteria, OwnershipType } from "@madie/madie-models";
import { Allotment } from "allotment";
import _ from "lodash";
import { Button } from "@madie/madie-design-system/dist/react";
import CompositeLeftPanelContent from "./CompositeLeftPanelContent";
import CompositeRightPanelContent from "./CompositeRightPanelContent";
import { useMeasureServiceApi } from "@madie/madie-util";
import { AlertProps } from "../EditTestCase";
import tw, { styled } from "twin.macro";
import "styled-components/macro";

const EditCompositeTestCase = ({
  allotmentRef,
  editorVal,
  setEditorVal,
  testCaseCanEdit,
  seriesState,
  isModified,
  setDiscardDialogOpen,
}) => {
  const [compositeMeasures, setCompositeMeasures] = useState([]);
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const abortController = useRef<AbortController | null>(null);
  const [alert, setAlert] = useState<AlertProps>(null);

  abortController.current = new AbortController();

  const requestIdRef = useRef(0);
  // on mount, use searchMeasuresByCriteria
  const retrieveMeasures = useCallback(async () => {
    // Abort any existing request before starting a new one
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    try {
      const currentRequestId = ++requestIdRef.current;

      const modifiedSearchCriteria: MeasureSearchCriteria = {
        // @ts-ignore
        measureMetaData: {
          // @ts-ignore
          composite: true,
        },
      };

      const data = await measureServiceApi.searchMeasuresByCriteria(
        [OwnershipType.ALL],
        1000,
        0,
        "lastModifiedAt",
        "DESC",
        modifiedSearchCriteria,
        abortController.current
      );
      if (currentRequestId === requestIdRef.current) {
        setCompositeMeasures(data.content ?? []);
      }
    } catch (error: any) {
      if (error?.message !== "canceled") {
        console.error("Composite search failed:", {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        });
      }
    }
  }, [measureServiceApi]);
  useEffect(() => {
    retrieveMeasures();
  }, []);
  const [rightPanelActiveTab, setRightPanelActiveTab] =
    useState<string>("actual");
  const [leftPanelActiveTab, setLeftPanelActiveTab] =
    useState<string>("elements");
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
              compositeMeasures={compositeMeasures}
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
            disabled
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
