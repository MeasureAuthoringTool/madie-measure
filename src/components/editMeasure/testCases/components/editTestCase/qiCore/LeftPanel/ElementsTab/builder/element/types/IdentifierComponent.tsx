import React from "react";
import { getIn, useFormikContext } from "formik";
import { TypeComponentProps } from "./TypeComponentProps";
import StringComponent from "./StringComponent";
import UriComponent from "./UriComponent";
import PeriodDateTimeComponent from "./PeriodDateTimeComponent";
import CodeableConceptComponent from "./CodeableConceptComponent";
import CodesComponent from "./CodesComponent";

const IdentifierComponent = ({
  label,
  canEdit,
  resource,
  structureDefinition,
  fieldRequired,
  helperText,
  error,
}: TypeComponentProps) => {
  const formik = useFormikContext();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <CodesComponent
        label="Use"
        resource={resource}
        structureDefinition={{
          path: label,
          binding: {
            valueSet: "http://hl7.org/fhir/ValueSet/identifier-use",
            strength: "required",
          },
        }}
        value={getIn(formik.values, `${label}.use`)}
        onChange={(value) => formik.setFieldValue(`${label}.use`, value)}
        canEdit={canEdit}
        fieldRequired={fieldRequired}
      />

      <CodeableConceptComponent
        label="Type"
        canEdit={canEdit}
        structureDefinition={{
          path: label,
          binding: {
            valueSet: "http://hl7.org/fhir/ValueSet/identifier-type",
            strength: "extensible",
          },
        }}
        showAddAttributeButton={false}
        addTitle={null}
        value={getIn(formik.values, `${label}.type`)}
        onChange={(value) => {
          formik.setFieldTouched(`${label}.type`);
          formik.setFieldValue(`${label}.type`, value);
        }}
      />

      <UriComponent
        label="System"
        fieldRequired={fieldRequired}
        canEdit={canEdit}
        helperText={helperText}
        error={error}
        {...formik.getFieldProps(`${label}.system`)}
      />

      <StringComponent
        label="Value"
        fieldRequired={fieldRequired}
        canEdit={canEdit}
        helperText={helperText}
        error={error}
        {...formik.getFieldProps(`${label}.value`)}
      />

      <PeriodDateTimeComponent
        label="Period"
        fieldRequired={fieldRequired}
        canEdit={canEdit}
        value={getIn(formik.values, `${label}.period`) || {}}
        onChange={(value) => {
          formik.setFieldTouched(`${label}.period`);
          formik.setFieldValue(`${label}.period`, value);
        }}
        helperText={helperText}
        error={error}
      />

      <StringComponent
        label="Assigner"
        fieldRequired={fieldRequired}
        canEdit={false}
        value="Not supported"
      />
    </div>
  );
};

export default IdentifierComponent;
