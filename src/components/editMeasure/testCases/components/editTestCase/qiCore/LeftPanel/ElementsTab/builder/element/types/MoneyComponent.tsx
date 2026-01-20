import React from "react";
import { getIn, useFormikContext } from "formik";
import { TypeComponentProps } from "./TypeComponentProps";
import DecimalInput from "../../../../../../../common/DecimalInput/DecimalInput";
import CodesComponent from "./CodesComponent";
import Box from "@mui/material/Box";
import "./MoneyComponent.scss";
import { getMultipleCardinalityLabel } from "./TypeUtil";

const MoneyComponent = ({
  label,
  canEdit,
  resource,
  fieldRequired,
}: TypeComponentProps) => {
  const formik = useFormikContext();
  const formattedLabel = getMultipleCardinalityLabel(label);

  const valuePath = `${label}.value`;
  const currencyPath = `${label}.currency`;

  return (
    <Box className="money-component">
      {/* Value field */}
      <div className="decimal-input">
        <DecimalInput
          label="Value"
          value={getIn(formik.values, valuePath)}
          handleChange={(val) =>
            formik.setFieldValue(valuePath, val !== "" ? parseFloat(val) : null)
          }
          canEdit={canEdit}
          required={false}
        />
      </div>

      {/* Currency field */}
      <div className="currency-input">
        <CodesComponent
          label="Currency"
          resource={resource}
          structureDefinition={{
            path: label,
            binding: {
              valueSet: "http://hl7.org/fhir/ValueSet/currencies",
              strength: "required",
            },
          }}
          value={getIn(formik.values, currencyPath)}
          onChange={(val) => formik.setFieldValue(currencyPath, val)}
          canEdit={canEdit}
          fieldRequired={fieldRequired}
        />
      </div>
    </Box>
  );
};

export default MoneyComponent;
