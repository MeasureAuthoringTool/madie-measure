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
import {
  formatAttributeLabel,
  getEditableExtensionSubElements,
  getFirstChildren,
  getIndexFromPath,
  getLastPart,
  getNestedProperty,
  getRequired,
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
import { getMultipleCardinalityLabel } from "./types/TypeUtil";
import { StructureDefinitionDto } from "../../../../../../../api/models/StructureDefinitionDto";
import { ElementDefinition, StructureDefinition } from "fhir/r4";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";

export const formikErrorHandler = (name: string, formik) => {
  const touched = getNestedProperty(formik.touched, name);
  const errors = getNestedProperty(formik.errors, name);
  if (touched && errors) {
    return errors;
  }
};

const getContentReferencePath = (referenceUrl: string) =>
  referenceUrl.split("#").pop();

interface TypeEditorProps {
  resource?: any;
  structureDefinition: any;
  parentStructureDefinition?: any;
  canEdit: boolean;
  label: string;
  noWrap?: boolean;
  onChangeForExtension?: (value: any) => void;
}

// onChange is being deprecated as no updates to the resource are tracked.
// Changes directly to the json should be done with a dispatch, this propagates downstream changes in formik.
// any temporary form state should be done through formik.
const TypeEditor = ({
  resource, // should probably deprecate
  structureDefinition,
  parentStructureDefinition,
  canEdit,
  label,
  noWrap = false,
                      onChangeForExtension,
}: // onChangeForExtension,
TypeEditorProps): JSX.Element | null => {
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
  const [extensionProfileDef, setExtensionProfileDef] =
    useState<StructureDefinitionDto>(null);
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
          console.error("retrieve profileDefinitions failure", e);
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

  // utility function to wrap these

  const wrapWithSection = (
    title: string,
    node: React.ReactElement,
    opts?: { key?: React.Key }
  ): React.ReactElement => {
    // If root, don't wrap
    // choice types fall under root in many cases. we'll also check to see if the label is terminated with an [x]
    if ((isRoot && !title.endsWith("[x]")) || noWrap) {
      return <>{node}</>;
    }

    // Otherwise wrap
    return (
      <ElementSectionQiCore
        key={opts?.key}
        title={getMultipleCardinalityLabel(title)}
        startOpen={true}
      >
        {node}
      </ElementSectionQiCore>
    );
  };

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
              const string = (
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
              return wrapWithSection(fieldLabel, string, { key: index });
            })}
          </Box>
        );
      case "base64Binary":
        const base64 = (
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
        return wrapWithSection(label, base64);
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
              const decimal = (
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
              return wrapWithSection(fieldLabel, decimal, { key: index });
            })}
          </Box>
        );
      case "markdown":
        const markdown = (
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
        return wrapWithSection(label, markdown);
      case "Quantity":
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              const quantity = (
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
              return wrapWithSection(fieldLabel, quantity, { key: index });
            })}
          </>
        );
      case "Period":
        const period = (
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
        return wrapWithSection(label, period);
      case "dateTime":
      case "http://hl7.org/fhirpath/System.DateTime":
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              const dateTime = (
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
              return wrapWithSection(fieldLabel, dateTime, { key: index });
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
              const time = (
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
              return wrapWithSection(fieldLabel, time, { key: index });
            })}
          </>
        );
      case "instant":
      case "http://hl7.org/fhir/R4/datatypes.html#instant":
        const instant = (
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
        return wrapWithSection(label, instant);
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
              const integer = (
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
              return wrapWithSection(fieldLabel, integer, { key: index });
            })}
          </>
        );
      case "Identifier":
        const identifier = (
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
        return wrapWithSection(label, identifier);
      case "http://hl7.org/fhirpath/System.Boolean":
      case "boolean":
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              const boolean = (
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
              return wrapWithSection(fieldLabel, boolean, { key: index });
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
              const uri = (
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
              return wrapWithSection(fieldLabel, uri, { key: index });
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
              const url = (
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
              return wrapWithSection(fieldLabel, url, { key: index });
            })}
          </>
        );
      case "date":
        const date = (
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
        return wrapWithSection(label, date);
      case "code":
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              const code = (
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
              return wrapWithSection(fieldLabel, code, { key: index });
            })}
          </>
        );
      case "Range":
        const range = (
          <RangeComponent
            canEdit={canEdit}
            label={label}
            structureDefinition={structureDefinition}
            fieldRequired={false}
          />
        );
        return wrapWithSection(label, range);
      case "Coding":
        const coding = (
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
              // formik.setFieldTouched(label);
              // formik.setFieldValue(label, value);
              // If the parent is an extension then there should a fixedUri that needed to be added to the value
              if (parentStructureDefinition?.type?.[0]?.code === "Extension") {
                onChangeForExtension(value);
              } else {
                formik.setFieldTouched(label);
                formik.setFieldValue(label, value);
              }
            }}
            includePrev={false}
          />
        );
        return wrapWithSection(label, coding);
      case "CodeableConcept":
        return (
          <>
            {(isArrayMode ? values : [null]).map((el, index) => {
              let fieldLabel = label;
              if (isArrayMode && appendedZeroAlready) {
                fieldLabel = `${label.slice(0, label.length - 3)}[${index}]`;
              }
              const codeableconcept = (
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
              return wrapWithSection(label, codeableconcept);
            })}
          </>
        );
      case "Money":
        const money = (
          <MoneyComponent
            label={label}
            canEdit={canEdit}
            resource={resource}
            fieldRequired={false}
          />
        );
        return wrapWithSection(label, money);
      case "Timing":
        const timing = (
          <TimingComponent
            resource={resource}
            structureDefinition={structureDefinition}
            label={label}
            canEdit={canEdit}
            fieldRequired={false}
          />
        );
        return wrapWithSection(label, timing);
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
              const reference = (
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
              return wrapWithSection(fieldLabel, reference, { key: index });
            })}
          </>
        );
      case "Extension":
        // Every profiled extension such as Slices ( Race, ethnicity, Tribal Affiliation will have its own structure definition
        // This case is hit when we're on a complex extension like race, gender that has children inputs
        if (extensionProfileDef) {
          // Displays only the URL of the Extension example : http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethinicity
          // and the children of the extension that are slices ( example : OMBCategory, text) Any generic extensions are excluded
          const elementDefinitions: ElementDefinition[] = extensionProfileDef
            ? getEditableExtensionSubElements(extensionProfileDef)
            : null;
          /*
               extensionIndex is the index at which the current Extension (ex: race) lies inside the resource. ex: patient.extension is an array.
               extensionLabel This is our root label ex: Patient.extension[0]
               extensionValue is the value of extension example:
               {
                "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
                "extension": [
                  {
                    "url": "ombCategory",
                    "valueCoding": {
                      "system": "urn:oid:2.16.840.1.113883.6.238",
                      "code": "1002-5",
                      "display": "American Indian or Alaska Native",
                      "userSelected": true
                    }
                  },
                  {
                    "url": "text",
                    "valueString": "American Indian or Alaska Native"
                  }
                ]
               }
            */
          const extensionIndex = formik?.values?.[
            resource?.resourceType
          ]?.extension?.findIndex((el) => {
            return el.url === extensionProfileDef.definition.url;
          });
          const extensionLabel = `${resource?.resourceType}.extension[${extensionIndex}]`;
          const extensionValue = _.get(formik.values, extensionLabel);
          //Every Extension should have a url, and the url should not be editable since it determines the structure of the extension.
          return (
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Box>{structureDefinition.short}</Box>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <UriComponent
                  canEdit={false}
                  fieldRequired={true}
                  label={extensionLabel + ".url"}
                  {...formik.getFieldProps(extensionLabel + ".url")}
                />
                {(() => {
                  // Track the next available index for new extensions
                  // We need to assign the next available index to new extensions to avoid overwriting existing extensions when adding new ones
                  let nextAvailableIndex =
                    extensionValue?.extension?.length || 0;

                  return elementDefinitions.map((elementDefinition) => {
                    let subSlicedExtensionLabel;

                    if (elementDefinition.sliceName) {
                      // Find if the form value already has an extension with the same URL as the sliceName (which is the identifier for the slice)
                      const existingIndex =
                        extensionValue?.extension?.findIndex(
                          (ext) => ext?.url === elementDefinition?.sliceName
                        );

                      if (existingIndex > -1) {
                        // Use the existing extension's index
                        subSlicedExtensionLabel = `${extensionLabel}.extension[${existingIndex}]`;
                      } else {
                        // Use the next available index for this new extension
                        subSlicedExtensionLabel = `${extensionLabel}.extension[${nextAvailableIndex}]`;
                        nextAvailableIndex++;
                      }
                    } else {
                      // Not a sliced extension - use property path
                      // it's not a slice. It's like...extension.url, extension.id
                      subSlicedExtensionLabel = `${extensionLabel}.${getLastPart(
                        elementDefinition.path
                      )}`;
                    }

                    return (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <ExtensionComponent
                          showAddAttributeButton={
                            showMultipleCardinalityActionCenter
                          }
                          addTitle={addTitle}
                          label={subSlicedExtensionLabel}
                          canEdit={canEdit}
                          fhirResource={resource}
                          elementDefinition={elementDefinition}
                          extensionProfileDef={extensionProfileDef}
                        />
                        <Divider />
                      </Box>
                    );
                  });
                })()}
              </Box>
            </Box>
          );
        } else {
          return <div>Extension profile definition not found</div>;
        }
      default:
        return <div>Unsupported Type [{type}]</div>;
    }
  } else if (!_.isEmpty(childDefs)) {
    const isPeriodParent = label.endsWith(".period");
    const hasStart = childDefs.some((def) => def.id.endsWith(".start"));
    const hasEnd = childDefs.some((def) => def.id.endsWith(".end"));

    if (isPeriodParent && hasStart && hasEnd) {
      const childDefPeriod = (
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
      return wrapWithSection(label, childDefPeriod);
    }
    return (
      <Box sx={{ display: "flex", flexDirection: "column" }}>
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
            const choiceType = (
              <ChoiceType
                childDef={filteredChildDef}
                resource={resource}
                parentStructureDefinition={parentStructureDefinition}
                canEdit={canEdit}
                label={filteredChildDef.id}
              />
            );
            // return choiceType;
            return wrapWithSection(childDef.id, choiceType);
          } else if (childDef.contentReference) {
            const contentRef = (
              <ContentReferenceType
                elementDefinition={childDef}
                parentElementDefinition={structureDefinition}
                resource={resource}
                canEdit={canEdit}
              />
            );
            return contentRef;
            // return wrapWithSection(childDef.id, contentRef);
          } else if (!isComponentDataType(childDef?.type?.[0]?.code)) {
            return (
              <ElementSectionQiCore
                title={formatAttributeLabel(childDef.id)}
                startOpen={false}
                children={
                  // Start of ClaimResponse.addItem.detail[0]
                  <Box>
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
            const baseCase = (
              <TypeEditor
                resource={resource}
                parentStructureDefinition={structureDefinition}
                structureDefinition={childDef}
                canEdit={canEdit}
                label={childDef.id}
              />
            );
            // return wrapWithSection(childDef.id, baseCase);
            return baseCase;
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
