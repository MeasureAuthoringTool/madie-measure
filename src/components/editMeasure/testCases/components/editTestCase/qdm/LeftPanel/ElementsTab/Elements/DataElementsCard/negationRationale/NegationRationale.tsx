import React, { useEffect, useState } from "react";

import "styled-components/macro";
import { Chip } from "@mui/material";
import _ from "lodash";
import { DataElement, CqmMeasure, CQL } from "cqm-models";
import { makeStyles } from "@mui/styles";
import CodeInput from "../../../../../../../QDM/codeInput/CodeInput";
import { Button } from "@madie/madie-design-system/dist/react";

interface NegationRationaleProps {
  handleChange: Function;
  cqmMeasure: CqmMeasure;
  selectedDataElement: DataElement;
  deleteNegationRationale: Function;
  canEdit: boolean;
}

const useStyles = makeStyles({
  customChips: {
    background: "#0073c8",
    color: "#fff",
    "& .MuiChip-deleteIcon": { color: "#fff" },
  },
});

const NegationRationale = ({
  handleChange,
  canEdit,
  cqmMeasure,
  selectedDataElement,
  deleteNegationRationale,
}: NegationRationaleProps) => {
  const classes = useStyles();

  const [negationRationale, setNegationRationale] = useState();
  const [negationRationaleCode, setNegationRationaleCode] =
    useState<CQL.Code>();

  // negationRationaleCode if for the display of the chip
  // If a new code is added/deleted, this will handle the display of updated negation rationale
  useEffect(() => {
    if (!_.isEmpty(selectedDataElement?.negationRationale)) {
      const negationRationale = selectedDataElement?.negationRationale;
      setNegationRationaleCode(negationRationale);
    }
  }, [selectedDataElement]);

  // Deletes the chip & updates JSON
  const handleDeleteNegationRationale = () => {
    setNegationRationaleCode(null);
    deleteNegationRationale();
  };

  const handleNegationRationaleChange = (value) => {
    setNegationRationale(value);
    selectedDataElement.negationRationale = {
      code: value.code,
      system: value.system,
      version: null,
      display: value.display,
    };
  };

  return (
    <>
      <div data-testid="negation-rationale-div" className="mm:flex mm:w-3/4">
        <div className="mm:grow mm:w-3/4">
          <CodeInput
            handleChange={(val) => {
              if (val) {
                handleNegationRationaleChange(val);
              }
            }}
            canEdit={canEdit}
            valueSets={cqmMeasure?.value_sets}
            required={false}
          />
        </div>
        <div className="mm:relative mm:pl-2.5">
          {canEdit && (
            <Button
              data-testid="add-negation-rationale"
              onClick={() => {
                handleChange(negationRationale);
              }}
              disabled={_.isEmpty(negationRationale)}
              className="mm:absolute mm:bottom-0"
            >
              Add
            </Button>
          )}
        </div>
      </div>
      {negationRationaleCode && negationRationaleCode.code && (
        <div className="mm:flex mm:flex-wrap mm:gap-2 mm:pt-4">
          <Chip
            disabled={!canEdit}
            id={`${negationRationaleCode?.system} : ${negationRationaleCode?.code}`}
            data-testid={`${negationRationaleCode?.system} : ${negationRationaleCode?.code}`}
            className={classes.customChips}
            label={`${negationRationaleCode?.system} : ${negationRationaleCode?.code}`}
            onDelete={() => handleDeleteNegationRationale()}
          />
        </div>
      )}
    </>
  );
};

export default NegationRationale;
