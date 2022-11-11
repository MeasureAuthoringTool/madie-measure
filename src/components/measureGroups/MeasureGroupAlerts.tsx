import React from "react";
import "twin.macro";
import "styled-components/macro";
import { MadieAlert } from "@madie/madie-design-system/dist/react";

interface MeasureGroupAlertsTypes {
  type?: string;
  message?: string;
  canClose?: boolean;
}

const MeasureGroupAlerts = (props: MeasureGroupAlertsTypes) => {
  const dataTestId = props.type === "error" ? "error-alerts" : "success-alerts";
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
        />
      )}
    </div>
  );
};

export default MeasureGroupAlerts;
