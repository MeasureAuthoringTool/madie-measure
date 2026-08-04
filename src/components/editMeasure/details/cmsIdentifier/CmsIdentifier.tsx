import { formatCmsId } from "@madie/madie-util";

import React from "react";
import {
  InputLabel,
  MadieTooltip,
  Button,
  ReadOnlyTextField,
} from "@madie/madie-design-system/dist/react";
import GenerateCmsID from "../../../../icons/GenerateCmsID";

export default function CmsIdentifier({
  canEdit,
  label,
  cmsId,
  model,
  onClick,
}) {
  return (
    <div
      style={{
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
          value={formatCmsId(cmsId, model)}
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
                  title="Once a CMS Identifier has been generated it may not be modified or removed for any draft or version of a measure."
                  id={`cms-id-tooltip`}
                />
              </div>
            )}
          </div>

          <Button
            disabled={!canEdit}
            variant="secondary"
            onClick={onClick}
            data-testid="generate-cms-id-button"
            area-describedby="cms-id-tooltip"
            id="cms-id"
            style={{
              border: "none",
              width: "fit-content",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <GenerateCmsID disabled={!canEdit} />
              <span
                style={{
                  marginLeft: "3px",
                  color: canEdit ? "#0073C8" : "#666666",
                }}
              >
                Generate ID
              </span>
            </div>
          </Button>
        </>
      )}
    </div>
  );
}
