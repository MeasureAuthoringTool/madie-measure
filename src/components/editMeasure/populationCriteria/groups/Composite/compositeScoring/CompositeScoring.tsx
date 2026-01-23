import React, { useState } from "react";
import "styled-components/macro";
import "twin.macro";
import "../CompositeComponent.scss";
import { Select, Button } from "@madie/madie-design-system/dist/react";
import { MenuItem, Box } from "@mui/material";
import _ from "lodash";
import AddComponentsDialog from "../addComponents/AddComponentsDialog";

export const compositeScoringOptions = [
  {
    label: "-",
    value: null,
  },
  {
    label: "Opportunity",
    value: "Opportunity",
  },
  {
    label: "All-or-nothing",
    value: "All-or-nothing",
  },
  {
    label: "Linear",
    value: "Linear",
  },
];

const CompositeScoring = ({ canEdit, formik }) => {
  const isCompositeScoringSelected =
    formik.values?.compositeScoring &&
    formik.values.compositeScoring !== "" &&
    formik.values.compositeScoring !== null;

  const [openAddComponentsDialog, setOpenAddComponentsDialog] = useState(false);

  const onAddComponentsClose = () => {
    setOpenAddComponentsDialog(false);
  };

  return (
    <>
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <Box sx={{ width: "23.5%" }}>
          <Select
            placeHolder={{
              name: "Select Composite Scoring",
              value: "",
            }}
            required={true}
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
            error={Boolean(formik.errors.compositeScoring)}
            helperText={formik.errors.compositeScoring}
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
        </Box>
        <Box
          sx={{
            width: "50%",
            display: "flex",
            alignItems: "flex-end",
            marginTop: "24px",
          }}
        >
          <Button
            variant="primary"
            data-testid="add-components-btn"
            disabled={!isCompositeScoringSelected || !canEdit}
            onClick={() => setOpenAddComponentsDialog(true)}
          >
            Add Components
          </Button>
        </Box>
      </Box>

      <AddComponentsDialog
        open={openAddComponentsDialog}
        onClose={onAddComponentsClose}
      />
    </>
  );
};

export default CompositeScoring;
