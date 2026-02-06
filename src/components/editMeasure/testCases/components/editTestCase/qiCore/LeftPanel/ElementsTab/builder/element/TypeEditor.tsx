import React, { useEffect, useMemo, useRef, useState } from "react";
import * as _ from "lodash";
import { Box, Divider } from "@mui/material";

import StringComponent from "./types/StringComponent";
import DateTimeComponent from "./types/DateTimeComponent";
import BooleanComponent from "./types/BooleanComponent";
import UriComponent from "./types/UriComponent";
import UrlComponent from "./types/UrlComponent";
import DateComponent from "./types/DateComponent";
import IntegerComponent from "./types/IntegerComponent";
import CodesComponent from "./types/CodesComponent";
import InstantComponent from "./types/InstantComponent";
import TimeComponent from "./types/TimeComponent";
import { useFormikContext } from "formik";
import ExtensionComponent from "./types/ExtensionComponent";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";
import {
  formatAttributeLabel,
  getFirstChildren,
  getIndexFromPath,
  getLastPart,
  getNestedProperty,
  getRequired,
  getTopLevelElements,
  isComponentDataType,
  stripAllIndexes,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import CodingComponent from "./types/CodingComponent";
import { useRequiredFields } from "./RequiredFieldsContext";
import CodeableConceptComponent from "./types/CodeableConceptComponent";
import PeriodDateTimeComponent from "./types/PeriodDateTimeComponent";
import ChoiceType from "./ChoiceType";
import QuantityComponent from "./types/QuantityComponent";
import IdentifierComponent from "./types/IdentifierComponent";
import MoneyComponent from "./types/MoneyComponent";
import TimingComponent from "./types/TimingComponent";
import RangeComponent from "./types/RangeComponent";
import ReferenceComponent from "./types/ReferenceComponent";
import ContentReferenceType from "./contentReferenceType/ContentReferenceType";
import DecimalComponent from "./types/DecimalComponent";
import { IntegerType } from "./typesValidations/FhirNumbers";
import ElementSectionQiCore from "./ElementSectionQiCore";
import { getEmptyValueForType } from "./TypeEditorUtils";

export const formikErrorHandler = (name: string, formik) => {
  const touched = getNestedProperty(formik.touched, name);
  const errors = getNestedProperty(formik.errors, name);
  if (touched && errors) {
    return errors;
  }
};

const getContentReferencePath = (referenceUrl: string) =>
  referenceUrl.split("#").pop();

// onChange is being deprecated as no updates to the resource are tracked.
// Changes directly to the json should be done with a dispatch, this propagates downstream changes in formik.
// any temporary form state should be done through formik.
const TypeEditor = ({
  resource, // should probably deprecate
  structureDefinition,
  parentStructureDefinition,
  canEdit,
  label,
}) => {
  const formik = useFormikContext();
  // Ref to track formik.values for use in closures (prevents stale state issues when rapidly clicking Add)
  const valuesRef = useRef<object>(formik.values as object);
  valuesRef.current = formik.values as object;

  const { requiredFields, formInfo } = useRequiredFields();
  let required = getRequired(requiredFields, stripAllIndexes(label));
  const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());

  let type = structureDefinition?.type?.find((t) =>
    _.toLower(label).includes(_.toLower(t.code))
  )?.code;
  if (!type) {
    type = structureDefinition?.type?.[0]?.code;
  }

  const values = _.get(formik.values, label);
  // is multiple cardinality?
  if (structureDefinition?.max === "*") {
    // is it not already terminated with an index?
    // if (!getIndexFromPath(label) && type !== "BackboneElement") {
    if (!getIndexFromPath(label)) {
      // we are just going to add a zero for now. could be smarter later
      // TO DO: We will eventually need to map inner elements of multiple cardinality based on how many elements are in the form
      // something like Array.From(numOfElementsInForm, _index) =>) had a previous rendition of this guy working in 8500 pr commits
      // https://github.com/MeasureAuthoringTool/madie-measure/pull/901
      // Only add [0] for component data types, not BackboneElements which need to render their structure first
      // previously structureDefinition.id[0] was used, but was breaking in deeply nested elements, by not retaining cardinality
      label = `${label}[0]`;
    }
  }
  // Needs to be a memo instead of a useEffect that resets state. This caused a bunch of rerenders, and got stale values from mapping
  // like passing in an incrementing label like name[0], the result would always end up name[maxNumOfElements] because it was an unstable var
  // don't use useEffects unless you absolutely have to. There is almost certainly always another way.

  // DiagnosticReport.presentedForm comes in without the index. We need to map it for multiple cardinality to test stuff.
  const childDefs = useMemo(() => {
    if (!isComponentDataType(type)) {
      let strippedLabel = stripAllIndexes(label);
      if (structureDefinition?.contentReference) {
        strippedLabel = getContentReferencePath(
          structureDefinition.contentReference
        );
      }
      const elements = getFirstChildren(strippedLabel, formInfo);
      if (elements?.length) {
        return elements.map((el) => {
          const lastPart = el.id.split(".").pop();
          const updatedId = `${label}.${lastPart}`;
          return { ...el, id: updatedId };
        });
      }
    }
    return [];
  }, [type, label, structureDefinition, formInfo]);

  // Given structureDefinition.type[{ code: "sometype", profiles: ["strings", "of", "profiles"]}]
  // we need to look at the get use the profile list to get resource trees so we can render all the children in case Extension.
  // Removed POC ProfiledExtension component.
  const [extensionProfileDef, setExtensionProfileDef] = useState<any[]>(null);
  useEffect(() => {
    // can't be a memo since it's async.
    const fetchProfiles = async () => {
      const type = structureDefinition?.type?.[0];

      if (!_.isEmpty(type?.profile)) {
        const loadProfiles = type.profile.map((profile: string) => {
          const resourceId = profile.split("/").pop();
          return fhirDefinitionsService.current.getResourceTree(resourceId);
        });
        try {
          const profileDefinitions = await Promise.all(loadProfiles);
          if (profileDefinitions) {
            setExtensionProfileDef(profileDefinitions[0]);
          } else {
            setExtensionProfileDef(null);
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log("retrieve profileDefinitions failure", e);
          setExtensionProfileDef(null);
        }
      } else {
        setExtensionProfileDef(null);
      }
    };
    fetchProfiles();
  }, [structureDefinition?.type?.[0], label, fhirDefinitionsService]);

  // add new default value to existing value array
  const handleAddElement = () => {
    formik.setFieldValue(structureDefinition.id, [
      ..._.get(formik.values, structureDefinition.id, [""]),
      "",
    ]);
  };

  // remove element at specific index from value array
  const handleDeleteElement = (index: number, label: string) => {
    // label comes in like Claim.item[0].careTeamSequence[1], need to get Claim.item[0].careTeamSequence
    const rootLabel = label.substring(0, label.lastIndexOf("["));
    const currentValues = _.get(formik.values, rootLabel, []);

    // If there's more than 1 element, remove the element at the index
    if (currentValues.length > 1) {
      const updatedValues = currentValues.filter((_, i) => i !== index);
      formik.setFieldValue(rootLabel, updatedValues);
    } else {
      // If there's only 1 element, clear its value instead of removing the element
      const emptyValue = getEmptyValueForType(type);
      formik.setFieldValue(rootLabel, [emptyValue]);
    }
  };

  const isRoot = structureDefinition?.id?.split?.(".")?.length === 2;
  const canBeMultipleCardinality = structureDefinition?.max === "*";
  const addTitle = structureDefinition?.id
    ? _.startCase(getLastPart(structureDefinition.id))
    : "";
  const showMultipleCardinalityActionCenter = Boolean(
    !isRoot && canBeMultipleCardinality && canEdit
  );
  let isArrayMode = showMultipleCardinalityActionCenter && values;
  const lastIndex = isArrayMode ? values.length - 1 : null;
  const appendedZeroAlready = getIndexFromPath(label);
  if (isComponentDataType(type)) {
    switch (type) {
      case "string":
      case "http://hl7.org/fhirpath/System.String":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              return (
                <StringComponent
                  key={index}
                  label={fieldLabel}
                  canEdit={canEdit}
                  helperText={formikErrorHandler(fieldLabel, formik)}
                  error={getNestedProperty(formik.errors, fieldLabel)}
                  fieldRequired={required}
                  showAddAttributeButton={
                    showMultipleCardinalityActionCenter &&
                    (!isArrayMode || index === lastIndex)
                  }
                  showDeleteButton={showMultipleCardinalityActionCenter}
                  handleDeleteElement={() =>
                    handleDeleteElement(index, fieldLabel)
                  }
                  addTitle={addTitle}
                  handleAddElement={handleAddElement}
                  {...formik.getFieldProps(fieldLabel)}
                />
              );
            })}
          </Box>
        );
      case "base64Binary":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <StringComponent
              label={label}
              canEdit={canEdit}
              helperText={formikErrorHandler(label, formik)}
              error={getNestedProperty(formik.errors, label)}
              fieldRequired={required}
              showAddAttributeButton={showMultipleCardinalityActionCenter}
              showDeleteButton={showMultipleCardinalityActionCenter}
              addTitle={addTitle}
              {...formik.getFieldProps(label)}
              onChange={({ target }) => {
                formik.setFieldTouched(label);
                formik.setFieldValue(label, target.value);
              }}
            />
          </Box>
        );
      /*
        Decimal most commonly appears as a child of different complex types
        that we want to handle inside of different TypeEditor rendered components,
        since they have different rules about information that needs to be supplied aside of a single number.
        Examples:
        Quantity,  -> implemented
        Money, -> implemented
        Timing -> implementedp
        Duration, not supported type
        Range, not supported type
        Ratio, not supported type
        Count, not supported type
        Age, not supported type
        */
      case "decimal":
        // ClaimResponse.attItem[0].factor. This is our primitive case.
        return (
          // primitive multiple cardinality decimal fields are extremely rare, but we're going to cover it anyway.
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              return (
                <DecimalComponent
                  key={`${fieldLabel}-${index}`}
                  label={fieldLabel}
                  canEdit={canEdit}
                  helperText={formikErrorHandler(fieldLabel, formik)}
                  error={Boolean(getNestedProperty(formik.errors, fieldLabel))}
                  required={required}
                  showAddAttributeButton={
                    showMultipleCardinalityActionCenter &&
                    (!isArrayMode || index === lastIndex)
                  }
                  showDeleteButton={showMultipleCardinalityActionCenter}
                  handleDeleteElement={() =>
                    handleDeleteElement(index, fieldLabel)
                  }
                  addTitle={addTitle}
                  handleAddElement={handleAddElement}
                  {...formik.getFieldProps(fieldLabel)}
                />
              );
            })}
          </Box>
        );
      case "markdown":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <StringComponent
              label={label}
              canEdit={canEdit}
              helperText={formikErrorHandler(label, formik)}
              error={getNestedProperty(formik.errors, label)}
              showAddAttributeButton={showMultipleCardinalityActionCenter}
              showDeleteButton={showMultipleCardinalityActionCenter}
              addTitle={addTitle}
              fieldRequired={required}
              {...formik.getFieldProps(label)}
            />
          </Box>
        );
      case "Quantity":
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              return (
                <QuantityComponent
                  key={index}
                  canEdit={canEdit}
                  label={fieldLabel}
                  structureDefinition={structureDefinition}
                  fieldRequired={required}
                  showAddAttributeButton={
                    showMultipleCardinalityActionCenter &&
                    (!isArrayMode || index === lastIndex)
                  }
                  showDeleteButton={showMultipleCardinalityActionCenter}
                  handleDeleteElement={() =>
                    handleDeleteElement(index, fieldLabel)
                  }
                  addTitle={addTitle}
                  handleAddElement={handleAddElement}
                />
              );
            })}
          </>
        );
      case "Period":
        return (
          <PeriodDateTimeComponent
            label={label}
            canEdit={canEdit}
            helperText={formikErrorHandler(label, formik)}
            error={getNestedProperty(formik.errors, label)}
            fieldRequired={required}
            {...formik.getFieldProps(label)}
            onChange={(value) => {
              formik.setFieldTouched(label);
              formik.setFieldValue(label, value);
            }}
          />
        );
      case "dateTime":
      case "http://hl7.org/fhirpath/System.DateTime":
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              return (
                <DateTimeComponent
                  key={index}
                  label={fieldLabel}
                  canEdit={canEdit}
                  helperText={formikErrorHandler(fieldLabel, formik)}
                  error={getNestedProperty(formik.errors, fieldLabel)}
                  fieldRequired={required}
                  showAddAttributeButton={
                    showMultipleCardinalityActionCenter &&
                    (!isArrayMode || index === lastIndex)
                  }
                  showDeleteButton={showMultipleCardinalityActionCenter}
                  handleDeleteElement={() =>
                    handleDeleteElement(index, fieldLabel)
                  }
                  addTitle={addTitle}
                  handleAddElement={handleAddElement}
                  {...formik.getFieldProps(fieldLabel)}
                  onChange={(value) => {
                    formik.setFieldTouched(fieldLabel);
                    formik.setFieldValue(fieldLabel, value);
                  }}
                  setTouched={() => {
                    formik.setFieldTouched(fieldLabel);
                  }}
                />
              );
            })}
          </>
        );
      // I think this is functionally unreachable code. Cant find any evidence of fhir element type = time
      case "time":
      case "http://hl7.org/fhir/R4/datatypes.html#time":
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              return (
                <TimeComponent
                  canEdit={canEdit}
                  fieldRequired={required}
                  label={fieldLabel}
                  helperText={formikErrorHandler(fieldLabel, formik)}
                  error={getNestedProperty(formik.errors, fieldLabel)}
                  showAddAttributeButton={
                    showMultipleCardinalityActionCenter &&
                    (!isArrayMode || index === lastIndex)
                  }
                  showDeleteButton={showMultipleCardinalityActionCenter}
                  handleDeleteElement={() =>
                    handleDeleteElement(index, fieldLabel)
                  }
                  addTitle={addTitle}
                  handleAddElement={handleAddElement}
                  {...formik.getFieldProps(fieldLabel)}
                />
              );
            })}
          </>
        );
      case "instant":
      case "http://hl7.org/fhir/R4/datatypes.html#instant":
        return (
          <InstantComponent
            name={label}
            label={label}
            required={required}
            helperText={formikErrorHandler(label, formik)}
            error={getNestedProperty(formik.errors, label)}
            handleDateTimeChange={(value) => {
              formik.setFieldTouched(label);
              formik.setFieldValue(label, value);
            }}
            setTouched={() => {
              formik.setFieldTouched(label);
            }}
            showAddAttributeButton={showMultipleCardinalityActionCenter}
            addTitle={addTitle}
            dateTimeValue={formik.getFieldProps(label).value}
            onBlur={() => formik.setFieldTouched(label)}
          />
        );
      case "http://hl7.org/fhirpath/System.Integer":
      case "integer":
      case "positiveInt":
      case "unsignedInt":
        let integerType: IntegerType;

        if (type === "unsignedInt") {
          integerType = IntegerType.UNSIGNED;
        } else if (type === "positiveInt") {
          integerType = IntegerType.POSITIVE_INT;
        } else {
          integerType = IntegerType.SIGNED;
        }
        // Example of multiple cardinality ClaimResponse.item.noteNumber
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              return (
                <IntegerComponent
                  key={index}
                  structureDefinition={undefined}
                  canEdit={canEdit}
                  fieldRequired={required}
                  label={fieldLabel}
                  helperText={formikErrorHandler(fieldLabel, formik)}
                  error={getNestedProperty(formik.errors, fieldLabel)}
                  integerType={integerType}
                  showAddAttributeButton={
                    showMultipleCardinalityActionCenter &&
                    (!isArrayMode || index === lastIndex)
                  }
                  showDeleteButton={showMultipleCardinalityActionCenter}
                  handleDeleteElement={() =>
                    handleDeleteElement(index, fieldLabel)
                  }
                  addTitle={addTitle}
                  handleAddElement={handleAddElement}
                  {...formik.getFieldProps(fieldLabel)}
                />
              );
            })}
          </>
        );
      case "Identifier":
        return (
          <IdentifierComponent
            label={label}
            handleAddElement={handleAddElement}
            canEdit={canEdit}
            resource={resource}
            structureDefinition={structureDefinition}
            fieldRequired={false}
            error={getNestedProperty(formik.errors, label)}
            helperText={formikErrorHandler(label, formik)}
          />
        );
      case "http://hl7.org/fhirpath/System.Boolean":
      case "boolean":
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              return (
                <BooleanComponent
                  key={index}
                  structureDefinition={undefined}
                  canEdit={canEdit}
                  fieldRequired={required}
                  label={fieldLabel}
                  helperText={formikErrorHandler(fieldLabel, formik)}
                  error={getNestedProperty(formik.errors, fieldLabel)}
                  showAddAttributeButton={
                    showMultipleCardinalityActionCenter &&
                    (!isArrayMode || index === lastIndex)
                  }
                  showDeleteButton={showMultipleCardinalityActionCenter}
                  handleDeleteElement={() =>
                    handleDeleteElement(index, fieldLabel)
                  }
                  addTitle={addTitle}
                  handleAddElement={handleAddElement}
                  {...formik.getFieldProps(fieldLabel)}
                  onChange={(e) => {
                    formik.setFieldValue(fieldLabel, e.target.value === "true");
                  }}
                />
              );
            })}
          </>
        );
      case "uri":
        //  CarePlan.activity[0].detail.instantiatesUri[0][0]
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              return (
                <UriComponent
                  key={index}
                  canEdit={canEdit}
                  structureDefinition={structureDefinition}
                  fieldRequired={required}
                  label={fieldLabel}
                  helperText={formikErrorHandler(fieldLabel, formik)}
                  error={getNestedProperty(formik.errors, fieldLabel)}
                  showAddAttributeButton={
                    showMultipleCardinalityActionCenter &&
                    (!isArrayMode || index === lastIndex)
                  }
                  showDeleteButton={showMultipleCardinalityActionCenter}
                  handleDeleteElement={() =>
                    handleDeleteElement(index, fieldLabel)
                  }
                  addTitle={addTitle}
                  handleAddElement={handleAddElement}
                  {...formik.getFieldProps(fieldLabel)}
                  onChange={({ target }) => {
                    formik.setFieldTouched(fieldLabel);
                    formik.setFieldValue(fieldLabel, target.value);
                  }}
                />
              );
            })}
          </>
        );
      case "url":
      case "canonical":
        //CarePlan.activity[0].detail.instantiatesCanonical[0]
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              return (
                <UrlComponent
                  key={index}
                  canEdit={canEdit}
                  structureDefinition={structureDefinition}
                  fieldRequired={required}
                  label={fieldLabel}
                  helperText={formikErrorHandler(fieldLabel, formik)}
                  error={getNestedProperty(formik.errors, fieldLabel)}
                  showAddAttributeButton={
                    showMultipleCardinalityActionCenter &&
                    (!isArrayMode || index === lastIndex)
                  }
                  showDeleteButton={showMultipleCardinalityActionCenter}
                  handleDeleteElement={() =>
                    handleDeleteElement(index, fieldLabel)
                  }
                  addTitle={addTitle}
                  handleAddElement={handleAddElement}
                  {...formik.getFieldProps(fieldLabel)}
                />
              );
            })}
          </>
        );
      case "date":
        return (
          <DateComponent
            label={label}
            canEdit={canEdit}
            helperText={formikErrorHandler(label, formik)}
            error={getNestedProperty(formik.errors, label)}
            fieldRequired={required}
            showAddAttributeButton={showMultipleCardinalityActionCenter}
            addTitle={addTitle}
            {...formik.getFieldProps(label)}
            onChange={(value) => {
              formik.setFieldTouched(label);
              formik.setFieldValue(label, value);
            }}
            setTouched={() => {
              formik.setFieldTouched(label);
            }}
          />
        );

      case "code":
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              return (
                <>
                  {/* Observation.category , AuditEvent.type 0..*, but base fhir only. Revisit this render once base fhir is supported. */}
                  <CodesComponent
                    key={index}
                    canEdit={canEdit}
                    structureDefinition={structureDefinition}
                    fieldRequired={required}
                    label={fieldLabel}
                    helperText={formikErrorHandler(fieldLabel, formik)}
                    error={getNestedProperty(formik.errors, fieldLabel)}
                    showAddAttributeButton={
                      showMultipleCardinalityActionCenter &&
                      (!isArrayMode || index === lastIndex)
                    }
                    showDeleteButton={showMultipleCardinalityActionCenter}
                    handleDeleteElement={() =>
                      handleDeleteElement(index, fieldLabel)
                    }
                    addTitle={addTitle}
                    handleAddElement={handleAddElement}
                    {...formik.getFieldProps(fieldLabel)}
                    onChange={(value) => {
                      if (label.includes(".value[x")) {
                        label = label.replace(".value[x]", ".valueCode");
                      }
                      formik.setFieldTouched(label);
                      formik.setFieldValue(label, value);
                    }}
                  />
                </>
              );
            })}
          </>
        );
      case "Range":
        return (
          <RangeComponent
            canEdit={canEdit}
            label={label}
            structureDefinition={structureDefinition}
            fieldRequired={false}
          />
        );
      case "Coding":
        return (
          <CodingComponent
            handleDeleteElement={handleDeleteElement}
            handleAddElement={handleAddElement}
            label={label}
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            showAddAttributeButton={showMultipleCardinalityActionCenter}
            showDeleteButton={showMultipleCardinalityActionCenter}
            addTitle={addTitle}
            {...formik.getFieldProps(label)}
            onChange={(value) => {
              formik.setFieldTouched(label);
              formik.setFieldValue(label, value);
            }}
            includePrev={false}
          />
        );
      case "CodeableConcept":
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              return (
                <CodeableConceptComponent
                  key={index}
                  canEdit={canEdit}
                  structureDefinition={structureDefinition}
                  label={fieldLabel}
                  showAddAttributeButton={
                    showMultipleCardinalityActionCenter &&
                    (!isArrayMode || index === lastIndex)
                  }
                  showDeleteButton={showMultipleCardinalityActionCenter}
                  handleDeleteElement={() =>
                    handleDeleteElement(index, fieldLabel)
                  }
                  addTitle={addTitle}
                  handleAddElement={handleAddElement}
                  {...formik.getFieldProps(fieldLabel)}
                />
              );
            })}
          </>
        );
      case "Money":
        return (
          <MoneyComponent
            label={label}
            canEdit={canEdit}
            resource={resource}
            fieldRequired={false}
          />
        );
      case "Timing":
        return (
          <TimingComponent
            resource={resource}
            structureDefinition={structureDefinition}
            label={label}
            canEdit={canEdit}
            fieldRequired={false}
          />
        );
      case "Reference":
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel;
              if (isArrayMode && !appendedZeroAlready) {
                fieldLabel = `${label}[${index}]`;
              } else if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              } else {
                fieldLabel = label;
              }
              return (
                <ReferenceComponent
                  key={index}
                  index={index}
                  structureDefinition={structureDefinition}
                  label={fieldLabel}
                  canEdit={canEdit}
                  required={required}
                  helperText={formikErrorHandler(fieldLabel, formik)}
                  error={getNestedProperty(formik.errors, fieldLabel)}
                  showAddAttributeButton={
                    showMultipleCardinalityActionCenter &&
                    (!isArrayMode || index === lastIndex)
                  }
                  showDeleteButton={showMultipleCardinalityActionCenter}
                  handleDeleteElement={() =>
                    handleDeleteElement(index, fieldLabel)
                  }
                  addTitle={addTitle}
                  handleAddElement={() => {
                    // Get the base path without trailing index for adding new elements
                    const basePath = fieldLabel.replace(/\[\d+\]$/, "");
                    // Read current values from valuesRef to get the latest values
                    // This avoids stale closure issues when clicking Add multiple times rapidly
                    const currentValues = _.get(
                      valuesRef.current,
                      basePath,
                      []
                    );
                    const newValues = [...currentValues, {}];
                    formik.setFieldValue(basePath, newValues);
                  }}
                  {...formik.getFieldProps(fieldLabel)}
                />
              );
            })}
          </>
        );
      case "Extension":
        // This case is hit when we're on a complex extension like race, gender that has children inputs
        if (extensionProfileDef) {
          const topLevelElements = extensionProfileDef
            ? getTopLevelElements(extensionProfileDef)
            : null;

          //@ts-ignore
          const { definition } = extensionProfileDef;
          let foundIndex = formik?.values?.[
            resource?.resourceType
          ]?.extension?.findIndex((el) => {
            return el.url === definition.url;
          });
          // This is our root label ex: Patient.extension[0]
          let updatedLabel = `${resource?.resourceType}.extension[${foundIndex}]`;
          // couldn't find it, need to change it

          // This work is commented out as it may need to be used later. This is for handling when an extension is not present.
          // It's possible that this will not be possible later with the workflow.
          const foundValue = _.get(formik.values, updatedLabel);
          return extensionProfileDef ? (
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Box>{structureDefinition.short}</Box>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {topLevelElements.map((elementDefinition, index) => {
                  // given updatedLabel = Patient.extension[1],
                  /*
                  and our json string looks like this.., we need to do a find on each one of the elements. to get the name
                    {
                      "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
                      "extension": [
                        {
                          "url": "ombCategory",
                          "valueCoding": {
                            "system": "urn:oid:2.16.840.1.113883.6.238",
                            "code": "2135-2",
                            "display": "Hispanic or Latino",
                            "userSelected": true
                          }
                        },
                        {
                          "url": "text",
                          "valueString": "Hispanic or Latino"
                        }
                      ]
                    }
                  */
                  let updatedLocalLabel = updatedLabel;
                  let localFoundValue = null;
                  // we already have a root extension here that lives in the form
                  if (foundValue) {
                    if (elementDefinition.sliceName) {
                      // This is like.. extension::ethnicity. sliceName is ethnicity
                      let foundIndex = foundValue?.extension?.findIndex(
                        (el) => {
                          return el.url === elementDefinition.sliceName;
                        }
                      );
                      // The case where it exists.
                      if (foundIndex > -1) {
                        updatedLocalLabel = `${updatedLabel}.extension[${foundIndex}]`;
                        localFoundValue = _.get(
                          formik.values,
                          updatedLocalLabel
                        );
                      }
                    } else {
                      // it's not a slice. It's like...extension.url, extension.id
                      updatedLocalLabel =
                        updatedLocalLabel = `${updatedLabel}.${getLastPart(
                          elementDefinition.path
                        )}`;
                      localFoundValue = _.get(formik.values, updatedLocalLabel);
                    }
                  }

                  return (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        marginTop: "10px",
                      }}
                    >
                      <TypeEditor
                        resource={resource}
                        structureDefinition={elementDefinition}
                        // parent structure definition should be structureDefinition, since these are the children
                        parentStructureDefinition={extensionProfileDef} // parent structureDefinition needs snapshot.element
                        canEdit={canEdit}
                        label={updatedLocalLabel} // updated local label based off of a find find matching id or slicename
                        {...formik.getFieldProps(updatedLocalLabel)}
                      />
                      <Divider />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ) : (
            <>Loading Extension...</>
          );
        }
        // baes case for extensions. returns [URL, Value] || [FIXEDUri , value]
        // TODO figure out when NOT to render these components because they can live on anything. Patient.name does not need extensions.
        // if no index, we need to provide one.
        // we could get an object of {url: "somestring", extension: [{url, valueString, etc..}, {}]}
        // from here it may make sense to render each
        // parentStructureDefinition.url can be used to locate the extension index..
        // if (foundValue?.extension?.length) {
        // it's a list.
        // return foundValue?.extension?.map((ext, index) => {
        //   label = `${updatedLabel}.extension[${index}]`
        //   return (
        //     <div></div>
        //   <ExtensionComponent
        //     label={label}
        //     canEdit={canEdit}
        //     {...formik.getFieldProps(label)}
        //     onChange={() => {}}
        //     formikHandleChange={formik.handleChange}
        //     // Being depcreated for a formik handleChange
        //     // label={label} // label will be needed later to hook up to formik.
        //     fhirResource={resource}
        //     elementDefinition={structureDefinition} // id is patient.identifier[0].extension    ;
        //     parentStructureDefinition={parentStructureDefinition} // id: patient.identifier[0]  ;
        //     //   />
        //     );
        //   })
        // }

        // render extension component only if parent structure defintion is Extension type
        if (
          parentStructureDefinition?.type?.[0]?.code === "Extension" ||
          parentStructureDefinition?.definition?.type === "Extension"
        ) {
          return (
            <ExtensionComponent
              showAddAttributeButton={showMultipleCardinalityActionCenter}
              addTitle={addTitle}
              label={label}
              canEdit={canEdit}
              {...formik.getFieldProps(label)}
              onChange={() => {}}
              formikHandleChange={formik.handleChange}
              // Being deprecated for a formik handleChange
              // label={label} // label will be needed later to hook up to formik.
              fhirResource={resource}
              elementDefinition={structureDefinition} // id is patient.identifier[0].extension    ;
              parentStructureDefinition={parentStructureDefinition} // id: patient.identifier[0]  ;
            />
          );
        } else {
          return <></>;
        }
      default:
        return <div>Unsupported Type [{type}]</div>;
    }
  } else if (!_.isEmpty(childDefs)) {
    const isPeriodParent = label.endsWith(".period");
    const hasStart = childDefs.some((def) => def.id.endsWith(".start"));
    const hasEnd = childDefs.some((def) => def.id.endsWith(".end"));

    if (isPeriodParent && hasStart && hasEnd) {
      return (
        <PeriodDateTimeComponent
          label={label}
          canEdit={canEdit}
          helperText={formikErrorHandler(label, formik)}
          error={getNestedProperty(formik.errors, label)}
          fieldRequired={required}
          {...formik.getFieldProps(label)}
          onChange={(value) => {
            formik.setFieldTouched(label);
            formik.setFieldValue(label, value);
          }}
        />
      );
    }
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {childDefs?.map((childDef) => {
          // if it's not a component dataType, we should render a header since it will have it's own property paths
          if (_.endsWith(childDef.id, "[x]") && childDef?.type?.length > 1) {
            const excludedTypes = [
              "base64Binary",
              "markdown",
              "Expression",
              "ParameterDefinition",
              "Annotation",
              "Attachment",
              "Contributor",
              "SampledData",
              "HumanName",
              "RelatedArtifact",
              "TriggerDefinition",
              "UsageContext",
              "Meta",
              "Address",
              "ContactPoint",
              "ContactDetail",
              "DataRequirement",
            ];

            const filteredChildDef = {
              ...childDef,
              type: childDef.type.filter(
                (typeItem) =>
                  !excludedTypes.some(
                    (excluded) =>
                      typeItem.code.toLowerCase() === excluded.toLowerCase()
                  )
              ),
            };
            //Let's render a select that allows us to select the type of childDef we want to render.
            return (
              <ChoiceType
                childDef={filteredChildDef}
                resource={resource}
                parentStructureDefinition={parentStructureDefinition}
                canEdit={canEdit}
                label={filteredChildDef.id}
              />
            );
          } else if (childDef.contentReference) {
            return (
              <ContentReferenceType
                elementDefinition={childDef}
                parentElementDefinition={structureDefinition}
                resource={resource}
                canEdit={canEdit}
              />
            );
          } else if (!isComponentDataType(childDef?.type?.[0]?.code)) {
            return (
              <ElementSectionQiCore
                title={formatAttributeLabel(childDef.id)}
                startOpen={false}
                children={
                  <Box
                    style={{
                      paddingLeft: "16px",
                    }}
                  >
                    <TypeEditor
                      resource={resource}
                      parentStructureDefinition={structureDefinition}
                      structureDefinition={childDef}
                      canEdit={canEdit}
                      label={childDef.id}
                    />
                  </Box>
                }
              />
            );
          } else {
            return (
              <TypeEditor
                resource={resource}
                parentStructureDefinition={structureDefinition}
                structureDefinition={childDef}
                canEdit={canEdit}
                label={childDef.id}
              />
            );
          }
        })}
      </Box>
    );
  } else {
    // should only get here when loading child types..
    return <></>;
  }
};

export default TypeEditor;
