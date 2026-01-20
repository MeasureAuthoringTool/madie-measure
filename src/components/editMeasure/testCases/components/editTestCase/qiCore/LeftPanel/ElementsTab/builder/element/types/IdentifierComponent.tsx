import React from "react";
import { getIn, useFormikContext } from "formik";
import { TypeComponentProps } from "./TypeComponentProps";
import StringComponent from "./StringComponent";
import UriComponent from "./UriComponent";
import PeriodDateTimeComponent from "./PeriodDateTimeComponent";
import CodeableConceptComponent from "./CodeableConceptComponent";
import CodesComponent from "./CodesComponent";
import { formikErrorHandler } from "../TypeEditor";
import { getNestedProperty } from "../../../../../../../../api/fhirDefinitionServiceUtilities";

const IdentifierComponent = ({
  label,
  canEdit,
  resource,
  structureDefinition,
  fieldRequired,
  helperText,
  error,
  handleAddElement,
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
      {/* clears out on it's own.. */}
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
        handleAddElement={handleAddElement}
        onChange={(value) => {
          formik.setFieldTouched(`${label}.type`);
          formik.setFieldValue(`${label}.type`, value);
        }}
      />

      <UriComponent
        label="System"
        fieldRequired={fieldRequired}
        canEdit={canEdit}
        helperText={formikErrorHandler(label + ".system", formik)}
        error={getNestedProperty(formik.errors, label + ".system")}
        {...formik.getFieldProps(`${label}.system`)}
      />

      <StringComponent
        label="Value"
        fieldRequired={fieldRequired}
        canEdit={canEdit}
        helperText={formikErrorHandler(label + ".value", formik)}
        error={getNestedProperty(formik.errors, label + ".value")}
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
        helperText={formikErrorHandler(label + ".period", formik)}
        error={getNestedProperty(formik.errors, label + ".period")}
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
