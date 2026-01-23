import React, { useEffect, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import IdentifierInput from "../../../../../../../QDM/Identifier/IdentifierInput";
import cqmModels from "cqm-models";
import StringInput from "../../../../../../../QDM/string/StringInput";
import CodeInput from "../../../../../../../QDM/codeInput/CodeInput";
import _ from "lodash";

export const LOCATION_ATTRIBUTES = ["LocationType"];
export const PRACTITIONER_ATTRIBUTES = ["Role", "Specialty", "Qualification"];
export const CAREPARTNER_ATTRIBUTES = ["Relationship"];
export const ORGANIZATION_ATTRIBUTES = ["OrganizationType"];

const QdmEntity = ({ setAttributeValue, attributeType, valueSets }) => {
  const [identifier, setIdentifier] = useState({
    namingSystem: undefined,
    value: undefined,
  });
  const [id, setId] = useState();
  const [entityAttributes, setEntityAttributes] = useState({});

  // Always construct entity; all fields optional
  useEffect(() => {
    if (!attributeType) return;

    const newAttribute = new cqmModels[attributeType]();

    if (id) newAttribute.id = id;
    if (identifier?.namingSystem || identifier?.value)
      newAttribute.identifier = identifier;

    Object.entries(entityAttributes).forEach(
      ([attributeName, attributeValue]) => {
        if (attributeValue) {
          newAttribute[attributeName] = attributeValue;
        }
      }
    );

    setAttributeValue(newAttribute);
  }, [attributeType, identifier, id, entityAttributes, setAttributeValue]);

  const handleChange = (field, value) => {
    if (field === "identifier") {
      setIdentifier(value);
    } else if (field === "id") {
      setId(value);
    } else {
      setEntityAttributes((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const displayQdmEntityRelatedAttributes = (attributes) =>
    attributes.map((attribute) => (
      <div key={attribute} tw="mt-4">
        <CodeInput
          handleChange={(val) => handleChange(_.camelCase(attribute), val)}
          canEdit={true}
          valueSets={valueSets}
          required={false}
          title={attribute}
        />
      </div>
    ));

  const displayQdmEntity = () => {
    switch (attributeType) {
      case "Location":
        return displayQdmEntityRelatedAttributes(LOCATION_ATTRIBUTES);
      case "Practitioner":
        return displayQdmEntityRelatedAttributes(PRACTITIONER_ATTRIBUTES);
      case "CarePartner":
        return displayQdmEntityRelatedAttributes(CAREPARTNER_ATTRIBUTES);
      case "Organization":
        return displayQdmEntityRelatedAttributes(ORGANIZATION_ATTRIBUTES);
      default:
        return null;
    }
  };

  return (
    <>
      {attributeType && (
        <>
          <div tw="mt-4">
            <IdentifierInput
              onIdentifierChange={(val) => handleChange("identifier", val)}
              canEdit={true}
              identifier={identifier}
            />
          </div>

          <div tw="mt-4">
            <StringInput
              label="Id"
              title="Id"
              canEdit={true}
              fieldValue={id}
              onStringValueChange={(val) => handleChange("id", val)}
            />
          </div>

          {displayQdmEntity()}
        </>
      )}
    </>
  );
};

export default QdmEntity;
