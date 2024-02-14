import React from "react";
import {
  InputLabel,
  MadieTooltip,
  Button,
  ReadOnlyTextField,
} from "@madie/madie-design-system/dist/react";
import GenerateCmsID from "../../../../icons/GenerateCmsID";

export default function CmsIdentifier({ label, cmsId, model, onClick }) {
  return (
    <div
      style={{
        width: 1,
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        fontFamily: "Rubik",
        lineHeight: "19px",
        fontSize: "16px",
      }}
    >
      {cmsId > 0 ? (
        <ReadOnlyTextField
          label={label}
          tabIndex={0}
          placeholder="CMS ID"
          id="cmsId"
          data-testid="cms-id-text-field"
          inputProps={{ "data-testid": "cms-id-input" }}
          size="small"
          value={model.startsWith("QI-Core") ? `${cmsId}FHIR` : cmsId}
          area-describedby="cms-id-tooltip"
        />
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <InputLabel aria-labelledby="cms-id">{label}</InputLabel>

            {cmsId > 0 ? (
              ""
            ) : (
              <div>
                <MadieTooltip
                  tooltipText="Once a CMS Identifier has been generated it may not be modified or removed for any draft or version of a measure."
                  id={`cms-id-tooltip`}
                />
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            onClick={onClick}
            data-testid="generate-cms-id-button"
            area-describedby="cms-id-tooltip"
            id="cms-id"
            style={{
              border: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <GenerateCmsID />
              <span style={{ marginLeft: "3px", color: "#0073C8" }}>
                Generate ID
              </span>
            </div>
          </Button>
        </>
      )}
    </div>
  );
}
