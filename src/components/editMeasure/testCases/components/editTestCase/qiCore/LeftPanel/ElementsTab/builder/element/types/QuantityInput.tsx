import React, { useState } from "react";
import * as ucum from "@lhncbc/ucum-lhc";
import { TextField, Select } from "@madie/madie-design-system/dist/react/";
import "twin.macro";
import "styled-components/macro";
import { MenuItem as MuiMenuItem } from "@mui/material";
import {
  ValidationResult,
  validate,
} from "../../../../../../../common/quantityInput/validate";

const comparatorOptions = [
  {
    code: "<",
    display: "Less than",
    definition: "The actual value is less than the given value.",
  },
  {
    code: "<=",
    display: "Less than or Equal to",
    definition: "The actual value is less than or equal to the given value.",
  },
  {
    code: ">=",
    display: "Greater or Equal to",
    definition: "The actual value is greater than or equal to the given value.",
  },
  {
    code: ">",
    display: "Greater than",
    definition: "The actual value is greater than the given value.",
  },
];

const QuantityInput = ({ canEdit, label, onChange }) => {
  const [quantity, setQuantity] = useState({
    comparator: comparatorOptions[0],
    value: "",
    unit: "",
  });
  const [error, setError] = useState<boolean>();
  const [helperText, setHelperText] = useState<String>();

  const handleComparatorChange = (e) => {
    const selected = comparatorOptions.find(
      (opt) => opt.code === e.target.value
    );
    const newQuantity = {
      ...quantity,
      comparator: selected || comparatorOptions[0],
    };
    setQuantity(newQuantity);
    onChange(newQuantity);
  };

  const handleQuantityValueChange = (value: string) => {
    const newQuantity = { ...quantity, value };
    setQuantity(newQuantity);
    onChange(newQuantity);
  };

  const handleQuantityUnitChange = (unit: string) => {
    const validationResult: ValidationResult = validate(unit);
    const newQuantity = { ...quantity, unit };
    setQuantity(newQuantity);
    onChange(newQuantity);

    setHelperText(validationResult.helperText);
    setError(validationResult.error);
  };

  return (
    <>
      <>{label}</>

      <div tw="flex flex-row">
        <div tw="w-28 mr-8">
          <Select
            label="Comparator"
            id={`comparator-select`}
            inputProps={{
              "data-testid": `comparator-select-input`,
              id: `comparator-select`,
            }}
            data-testid={`comparator-select-input-comparator`}
            readOnly={!canEdit}
            size="small"
            SelectDisplayProps={{
              "aria-required": "true",
            }}
            options={comparatorOptions.map((opt, i) => (
              <MuiMenuItem key={i} value={opt.code}>
                {opt.code}
              </MuiMenuItem>
            ))}
            onChange={handleComparatorChange}
            value={quantity.comparator?.code || ""}
          />
        </div>

        <div tw="w-28">
          <TextField
            required
            value={quantity.value}
            readOnly={!canEdit}
            placeholder="value"
            label={"Quantity"}
            id={`quantity-input-field-quantity`}
            data-testid={`quantity-input-field-quantity`}
            inputProps={{
              "data-testid": `quantity-input-quantity`,
              "aria-describedby": `quantity-input-helper-text-quantity`,
              id: `quantity-input-quantity`,
              required: true,
            }}
            type="number"
            onWheel={(e) => e.target.blur()}
            onKeyPress={(e) => {
              if (
                (!Number(e.key) &&
                  e.key !== "0" &&
                  e.key !== "." &&
                  e.key !== "-") ||
                (e.target.value.length > 0 && e.key === "-") ||
                (e.target.value.includes(".") && e.key === ".")
              ) {
                e.preventDefault();
              }
            }}
            onChange={(event) => {
              handleQuantityValueChange(event.target.value);
            }}
          />
        </div>
        <div tw="w-56">
          <TextField
            required
            id={`quantity-input-field-unit`}
            readOnly={!canEdit}
            label="Unit(s)"
            error={error}
            helperText={helperText}
            data-testid={`quantity-input-field-unit`}
            placeholder="unit"
            onChange={(e: any) => {
              handleQuantityUnitChange(e.target.value);
            }}
            value={quantity.unit}
          />
        </div>
      </div>
    </>
  );
};

export default QuantityInput;
