import React from "react";
import "twin.macro";
import "styled-components/macro";
import { MadieAlert } from "@madie/madie-design-system";
import { useFeatureFlags } from "@madie/madie-util";
interface MeasureGroupAlertsTypes {
  type?: string;
  message?: string;
  canClose?: boolean;
}

const MeasureGroupAlerts = (props: MeasureGroupAlertsTypes) => {
  const dataTestId = props.type === "error" ? "error-alerts" : "success-alerts";
  const featureflags = useFeatureFlags();
  return (
    <div tw="mx-8 my-4">
      {props.message && (
        <MadieAlert
          type={props.type}
          content={
            <p aria-live="polite" data-testid={dataTestId}>
              {props.message}
            </p>
          }
          canClose={props.canClose}
          copyButton={true}
          minimizeAlerts={featureflags?.MinimizeAlerts}
        />
      )}
    </div>
  );
};

export default MeasureGroupAlerts;
