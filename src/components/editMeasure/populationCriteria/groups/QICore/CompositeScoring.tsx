import React from "react";
import _ from "lodash";
import { Select } from "@madie/madie-design-system/dist/react";
import { MenuItem } from "@mui/material";
import { compositeScoringOptions } from "./QICoreMeasureGroups";

const CompositeScoring = ({ canEdit, formik }) => {
  return (
    <div tw="mb-4 w-1/2">
      <Select
        placeHolder={{
          name: "Select Composite Scoring",
          value: "",
        }}
        label="Composite Scoring"
        id="composite-scoring"
        inputProps={{
          "data-testid": "composite-scoring-input",
        }}
        data-testid="composite-scoring"
        value={formik.values?.compositeScoring ?? ""}
        readOnly={!canEdit}
        size="small"
        SelectDisplayProps={{
          "aria-required": "true",
        }}
        onChange={(e) => {
          formik.setFieldValue("compositeScoring", e.target.value);
        }}
        options={compositeScoringOptions.map((option, i) => (
          <MenuItem
            key={`${option.label}-${i}`}
            data-testid={`${_.camelCase(option.label)}-option`}
            value={option.value}
          >
            {option.label}
          </MenuItem>
        ))}
      />
    </div>
  );
};

export default CompositeScoring;
