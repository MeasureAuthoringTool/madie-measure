import React from "react";
import { InputLabel } from "@madie/madie-design-system/dist/react";

const RiskDefinition = ({ handleDescriptionChange, risk, key }) => {
  return (
    <div className="risk-container" key={key}>
      <InputLabel htlmfor={`${risk.definition}-description`}>
        {risk.definition} - Description
      </InputLabel>
      <textarea
        value={risk.description}
        onChange={(e) => {
          handleDescriptionChange(e.target.value, risk.definition);
        }}
        id={`${risk.definition}-description`}
        data-testid={`${risk.definition}-description`}
        className="risk-description"
      />
    </div>
  );
};

export default RiskDefinition;
