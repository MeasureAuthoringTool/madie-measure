import React from "react";
import { getIn, useFormikContext } from "formik";
import { TypeComponentProps } from "./TypeComponentProps";
import DecimalInput from "../../../../../../../common/DecimalInput/DecimalInput";
import CodesComponent from "./CodesComponent";
import Box from "@mui/material/Box";

const MONEY_FIELD_WIDTH = 148.5;

const MoneyComponent = ({
  label,
  canEdit,
  resource,
  fieldRequired,
}: TypeComponentProps) => {
  const formik = useFormikContext();

  const valuePath = `${label}.value`;
  const currencyPath = `${label}.currency`;

  return (
    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      {/* Value field */}
      <DecimalInput
        label="Value"
        value={getIn(formik.values, valuePath)}
        handleChange={(val) =>
          formik.setFieldValue(valuePath, val !== "" ? parseFloat(val) : null)
        }
        canEdit={canEdit}
        containerStyle={{ width: MONEY_FIELD_WIDTH }}
        required={false}
      />

      {/* Currency field */}
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
        containerStyle={{ width: MONEY_FIELD_WIDTH }}
      />
    </Box>
  );
};

export default MoneyComponent;
