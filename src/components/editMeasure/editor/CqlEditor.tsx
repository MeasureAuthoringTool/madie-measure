import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Allotment } from "allotment";
import MeasureEditor from "./MeasureEditor";
import RightPanel from "./rightPanel/RightPanel";
import "./CqlEditor.scss";
import "allotment/dist/style.css";
import { Button } from "@madie/madie-design-system/dist/react";
import StatusHandler from "./StatusHandler";
import { useFeatureFlags, routeHandlerStore } from "@madie/madie-util";
import tw, { styled } from "twin.macro";
import "styled-components/macro";

export default function CqlEditor(props: { isQDM: boolean; canEdit: boolean }) {
  const { isQDM, canEdit } = props;
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>(null);
  const [outboundAnnotations, setOutboundAnnotations] = useState([]);
  const [success, setSuccess] = useState({
    status: undefined,
    message: undefined,
  });
  const [isCQLUnchanged, setIsCQLUnchanged] = useState<boolean>(true);
  const featureFlags = useFeatureFlags();
  const { updateRouteHandlerState } = routeHandlerStore;
  const [discardDialogOpen, setDiscardDialogOpen]: [
    boolean,
    Dispatch<SetStateAction<boolean>>
  ] = useState(false);
  const [updatingMeasureCql, setUpdatingMeasureCql] = useState<boolean>(false);

  useEffect(() => {
    updateRouteHandlerState({
      canTravel: isCQLUnchanged,
      pendingRoute: "",
    });
  }, [isCQLUnchanged, updateRouteHandlerState]);

  return (
    <>
      <div id="status-handler">
        <StatusHandler
          error={error}
          errorMessage={errorMessage}
          success={success}
          outboundAnnotations={outboundAnnotations}
          hasSubTitle={false}
        />
      </div>

      {featureFlags?.qdmCodeSearch && isQDM ? (
        <div className="allotment-wrapper">
          <Allotment defaultSizes={[175, 125]} vertical={false}>
            <Allotment.Pane>
              <div style={{ borderWidth: "24px", borderColor: "#ededed" }} />
              <MeasureEditor
                setError={setError}
                setErrorMessage={setErrorMessage}
                setSuccess={setSuccess}
                setOutboundAnnotations={setOutboundAnnotations}
                setIsCQLUnchanged={setIsCQLUnchanged}
                isCQLUnchanged={isCQLUnchanged}
                setDiscardDialogOpen={setDiscardDialogOpen}
                discardDialogOpen={discardDialogOpen}
                setUpdatingMeasureCql={setUpdatingMeasureCql}
                updatingMeasureCql={updatingMeasureCql}
                canEdit={canEdit}
              />
            </Allotment.Pane>
            <Allotment.Pane>
              <RightPanel />
            </Allotment.Pane>
          </Allotment>
        </div>
      ) : (
        <div style={{ marginLeft: "32px", marginRight: "32px" }}>
          <MeasureEditor
            setError={setError}
            setErrorMessage={setErrorMessage}
            setSuccess={setSuccess}
            setOutboundAnnotations={setOutboundAnnotations}
            setIsCQLUnchanged={setIsCQLUnchanged}
            isCQLUnchanged={isCQLUnchanged}
            setDiscardDialogOpen={setDiscardDialogOpen}
            discardDialogOpen={discardDialogOpen}
            setUpdatingMeasureCql={setUpdatingMeasureCql}
            updatingMeasureCql={updatingMeasureCql}
            canEdit={canEdit}
          />
        </div>
      )}

      <div className="bottom-row">
        <div className="spacer" />
        {canEdit && (
          <>
            <Button
              variant="outline"
              tw="m-2"
              onClick={() => setDiscardDialogOpen(true)}
              data-testid="reset-cql-btn"
              disabled={isCQLUnchanged}
            >
              Discard Changes
            </Button>
            <Button
              variant="cyan"
              tw="m-2"
              onClick={() => setUpdatingMeasureCql(true)}
              data-testid="save-cql-btn"
              disabled={isCQLUnchanged}
            >
              Save
            </Button>
          </>
        )}
      </div>
    </>
  );
}
