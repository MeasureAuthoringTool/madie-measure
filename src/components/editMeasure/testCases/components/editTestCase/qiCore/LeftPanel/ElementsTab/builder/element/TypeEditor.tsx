import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { getIn, useFormikContext } from "formik";
import ExtensionComponent from "./types/ExtensionComponent";
import ExtensionNormalizer from "./ExtensionNormalizer";
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
  TYPE_CODE_NOT_USED,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import CodingComponent from "./types/CodingComponent";
import { useRequiredFields } from "./RequiredFieldsContext";
import CodeableConceptComponent from "./types/CodeableConceptComponent";
import PeriodDateTimeComponent from "./types/PeriodDateTimeComponent";
import ChoiceType from "./ChoiceType";
import QuantityComponent from "./types/QuantityComponent";
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
import { ElementDefinition } from "fhir/r4";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";
import RatioComponent from "./types/RatioComponent";

const TYPE_EDITOR_EXCLUDED_TYPES = new Set(
  TYPE_CODE_NOT_USED.map((code) => code.toLowerCase())
);

export const formikErrorHandler = (name: string, formik) => {
  const touched = getNestedProperty(formik.touched, name);
  const errors = getNestedProperty(formik.errors, name);
  if (touched && errors) {
    return errors;
  }
};
export const wrapWithSection = (
  title: string,
  node: React.ReactElement,
  isRoot?: boolean,
  noWrap?: boolean,
  required?: boolean,
  opts?: { key?: React.Key; fieldPath?: string }
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
      required={required}
      fieldPath={opts?.fieldPath ?? title}
    >
      {node}
    </ElementSectionQiCore>
  );
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
}: TypeEditorProps): JSX.Element | null => {
  const formik = useFormikContext();
  // Ref to track formik.values for use in closures (prevents stale state issues when rapidly clicking Add)
  const valuesRef = useRef<object>(formik.values as object);
  valuesRef.current = formik.values as object;
  // Per-child-path deletion counter. Used in row keys so a delete forces
  // surviving rows to remount (clearing stale inner state), while an add
  // leaves keys for existing rows untouched (so their formik state is not
  // disturbed by a remount).
  const [deletionTicks, setDeletionTicks] = useState<Record<string, number>>(
    {}
  );

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

  const handleAddComplexElement = useCallback(
    (path: string) => {
      const currentValue = _.get(formik.values, path) || [{}];

      const updatedValue = [
        ...currentValue,
        _.cloneDeep(_.mapValues(currentValue[0], () => {})),
      ];

      formik.setFieldValue(path, updatedValue);
    },
    [formik]
  );

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

  // Memoize extension element definitions to keep a stable reference across renders.
  // Without this, getEditableExtensionSubElements creates a new array each render,
  // which would cause ExtensionNormalizer's useEffect to fire every render.
  const extensionElementDefinitions: ElementDefinition[] = useMemo(() => {
    return extensionProfileDef
      ? getEditableExtensionSubElements(extensionProfileDef)
      : null;
  }, [extensionProfileDef]);

  // For top-level choice types, always render the ChoiceType selector by path
  // so UI does not depend on whichever concrete type happens to be selected.
  const isChoiceTypePath = _.endsWith(structureDefinition?.id, "[x]");
  const shouldRenderChoiceType = isChoiceTypePath && label?.includes("[x]");

  if (shouldRenderChoiceType) {
    const filteredStructureDefinition = {
      ...structureDefinition,
      type: (structureDefinition?.type || []).filter(
        (typeItem) =>
          !TYPE_EDITOR_EXCLUDED_TYPES.has(typeItem.code.toLowerCase())
      ),
    };

    return (
      <ChoiceType
        childDef={filteredStructureDefinition}
        resource={resource}
        parentStructureDefinition={parentStructureDefinition}
        canEdit={canEdit}
        label={label}
      />
    );
  }

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

              // For extensions, use onBlur to avoid triggering on every keystroke
              const isExtensionContext =
                parentStructureDefinition?.type?.[0]?.code === "Extension";
              const fieldProps = formik.getFieldProps(fieldLabel);

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
                  {...fieldProps}
                  onBlur={
                    isExtensionContext
                      ? (e) => {
                          fieldProps.onBlur(e);
                          if (e.target.value) {
                            onChangeForExtension(e.target.value);
                          }
                        }
                      : fieldProps.onBlur
                  }
                />
              );
              return wrapWithSection(
                fieldLabel,
                string,
                isRoot,
                noWrap,
                required,
                {
                  key: index,
                }
              );
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
        return wrapWithSection(label, base64, isRoot, noWrap, required);
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

              // For extensions, use onBlur to avoid triggering on every keystroke
              const isExtensionContext =
                parentStructureDefinition?.type?.[0]?.code === "Extension";
              const fieldProps = formik.getFieldProps(fieldLabel);

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
                  {...fieldProps}
                  onChange={
                    isExtensionContext
                      ? fieldProps.onChange
                      : fieldProps.onChange
                  }
                  onBlur={
                    isExtensionContext
                      ? (e) => {
                          fieldProps.onBlur(e);
                          if (e.target.value) {
                            onChangeForExtension(parseFloat(e.target.value));
                          }
                        }
                      : fieldProps.onBlur
                  }
                />
              );
              return wrapWithSection(
                fieldLabel,
                decimal,
                isRoot,
                noWrap,
                required,
                {
                  key: index,
                }
              );
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
        return wrapWithSection(label, markdown, isRoot, noWrap, required);
      case "Quantity":
        // Show comparator for Quantity types that are NOT SimpleQuantity
        const isSimpleQuantity = structureDefinition?.type?.some(
          ({ code, profile }) =>
            code === "Quantity" &&
            profile?.includes(
              "http://hl7.org/fhir/StructureDefinition/SimpleQuantity"
            )
        );
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
                  showComparator={!isSimpleQuantity}
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
              return wrapWithSection(
                fieldLabel,
                quantity,
                isRoot,
                noWrap,
                required,
                {
                  key: index,
                }
              );
            })}
          </>
        );
      case "Period":
        const period = (
          <PeriodDateTimeComponent
            label={_.capitalize(getLastPart(label))}
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
        return wrapWithSection(label, period, isRoot, noWrap, required);
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
                    if (
                      parentStructureDefinition?.type?.[0]?.code === "Extension"
                    ) {
                      formik.setFieldTouched(fieldLabel);
                      onChangeForExtension(value);
                    } else {
                      formik.setFieldTouched(fieldLabel);
                      formik.setFieldValue(fieldLabel, value);
                    }
                  }}
                  setTouched={() => {
                    formik.setFieldTouched(fieldLabel);
                  }}
                />
              );
              return wrapWithSection(
                fieldLabel,
                dateTime,
                isRoot,
                noWrap,
                required,
                {
                  key: index,
                }
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
              return wrapWithSection(
                fieldLabel,
                time,
                isRoot,
                noWrap,
                required,
                {
                  key: index,
                }
              );
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
        return wrapWithSection(label, instant, isRoot, noWrap, required);
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
              return wrapWithSection(
                fieldLabel,
                integer,
                isRoot,
                noWrap,
                required,
                {
                  key: index,
                }
              );
            })}
          </>
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
                    const boolValue = e.target.value === "true";
                    if (
                      parentStructureDefinition?.type?.[0]?.code === "Extension"
                    ) {
                      onChangeForExtension(boolValue);
                    } else {
                      formik.setFieldValue(fieldLabel, boolValue);
                    }
                  }}
                />
              );
              return wrapWithSection(
                fieldLabel,
                boolean,
                isRoot,
                noWrap,
                required,
                {
                  key: index,
                }
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
              return wrapWithSection(
                fieldLabel,
                uri,
                isRoot,
                noWrap,
                required,
                {
                  key: index,
                }
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
                  onChange={({ target }) => {
                    formik.setFieldTouched(fieldLabel);
                    formik.setFieldValue(fieldLabel, target.value);
                  }}
                />
              );
              return wrapWithSection(
                fieldLabel,
                url,
                isRoot,
                noWrap,
                required,
                {
                  key: index,
                }
              );
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
        return wrapWithSection(label, date, isRoot, noWrap, required);

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
                      if (
                        parentStructureDefinition?.type?.[0]?.code ===
                        "Extension"
                      ) {
                        onChangeForExtension(value);
                      } else {
                        formik.setFieldTouched(fieldLabel);
                        formik.setFieldValue(fieldLabel, value);
                      }
                    }}
                  />
                </>
              );
              return wrapWithSection(
                fieldLabel,
                code,
                isRoot,
                noWrap,
                required,
                {
                  key: index,
                }
              );
            })}
          </>
        );
      case "Range":
        const range = (
          <RangeComponent
            canEdit={canEdit}
            label={label}
            fieldRequired={false}
          />
        );
        return wrapWithSection(label, range, isRoot, noWrap, required);
      case "Ratio":
        const ratio = (
          <RatioComponent
            canEdit={canEdit}
            label={label}
            fieldRequired={false}
          />
        );
        return wrapWithSection(label, ratio, isRoot, noWrap, required);
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
        return wrapWithSection(label, coding, isRoot, noWrap, required);
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
                  onChangeForExtension={
                    parentStructureDefinition?.type?.[0]?.code === "Extension"
                      ? (value) => onChangeForExtension(value)
                      : undefined
                  }
                />
              );
              return wrapWithSection(
                label,
                codeableconcept,
                isRoot,
                noWrap,
                required
              );
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
        return wrapWithSection(label, money, isRoot, noWrap, required);
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
        return wrapWithSection(label, timing, isRoot, noWrap, required);
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
                  resource={resource}
                  {...formik.getFieldProps(fieldLabel)}
                />
              );
              return wrapWithSection(
                fieldLabel,
                reference,
                isRoot,
                noWrap,
                required,
                {
                  key: index,
                }
              );
            })}
          </>
        );
      case "Extension":
        // Every profiled extension such as Slices ( Race, ethnicity, Tribal Affiliation will have its own structure definition
        // This case is hit when we're on a complex extension like race, gender that has children inputs
        if (extensionProfileDef) {
          // Displays only the URL of the Extension example : http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethinicity
          // and the children of the extension that are slices ( example : OMBCategory, text) Any generic extensions are excluded
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
          const resourceExtensions =
            formik?.values?.[resource?.resourceType]?.extension;
          const extensionIndex = Array.isArray(resourceExtensions)
            ? resourceExtensions.findIndex((el) => {
                return el.url === extensionProfileDef.definition.url;
              })
            : -1;

          // If extension not found, it means the parent extension hasn't been initialized yet
          if (extensionIndex === -1) {
            return (
              <div>
                Extension not found in resource. Please ensure the parent
                extension is properly initialized.
              </div>
            );
          }

          const extensionLabel = `${resource?.resourceType}.extension[${extensionIndex}]`;

          //Every Extension should have a url, and the url should not be editable since it determines the structure of the extension.
          return (
            <>
              <ExtensionNormalizer
                extensionLabel={extensionLabel}
                elementDefinitions={extensionElementDefinitions}
              />
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
                    // Create a stable index mapping for each elementDefinition based on its position in the array
                    // This ensures consistent labels regardless of which extensions the user has filled in
                    // e.g., ombCategory is always at index 0, detailed at index 1, text at index 2
                    return extensionElementDefinitions.map(
                      (elementDefinition, reservedIndex) => {
                        let subSlicedExtensionLabel;

                        if (elementDefinition.sliceName) {
                          // Each elementDefinition gets a reserved index based on its position in elementDefinitions array
                          // This ensures the label is always consistent (e.g., text is always extension[2])
                          // regardless of whether other slices have been filled in
                          subSlicedExtensionLabel = `${extensionLabel}.extension[${reservedIndex}]`;
                        } else {
                          // Not a sliced extension - use property path
                          // it's not a slice. It's like...extension.url, extension.id
                          subSlicedExtensionLabel = extensionLabel;
                        }

                        return (
                          <Box
                            key={elementDefinition.id || reservedIndex}
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
                      }
                    );
                  })()}
                </Box>
              </Box>
            </>
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
      return wrapWithSection(label, childDefPeriod, isRoot, noWrap, required);
    }
    return (
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {childDefs?.map((childDef) => {
          // if it's not a component dataType, we should render a header since it will have it's own property paths
          if (_.endsWith(childDef.id, "[x]") && childDef?.type?.length > 1) {
            const filteredChildDef = {
              ...childDef,
              type: childDef.type.filter(
                (typeItem) =>
                  !TYPE_EDITOR_EXCLUDED_TYPES.has(typeItem.code.toLowerCase())
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
            return wrapWithSection(
              childDef.id,
              choiceType,
              isRoot,
              noWrap,
              required
            );
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
            const childIsMultipleCardinality = childDef.max === "*";
            const childDefValues = values?.[childDef.id.split(".").pop()] || [
              {},
            ];
            return (
              <>
                {(childIsMultipleCardinality
                  ? Array.isArray(childDefValues)
                    ? childDefValues
                    : [childDefValues]
                  : [null]
                ).map((el, index) => {
                  return (
                    !(childDef.max === "0" && childDef.min === 0) && (
                      <ElementSectionQiCore
                        key={`${childDef.id}-d${
                          deletionTicks[childDef.id] || 0
                        }-${index}`}
                        title={
                          formatAttributeLabel(childDef.id) +
                          ` ${childDef.max === "*" ? index + 1 : ""}`
                        }
                        elementDefinition={childDef}
                        startOpen={true}
                        fieldPath={
                          childIsMultipleCardinality
                            ? childDef.id + `[${index}]`
                            : childDef.id
                        }
                        handleAddElement={() =>
                          handleAddComplexElement(childDef.id)
                        }
                        handleDeleteElement={() => {
                          const currentValues =
                            _.get(formik.values, childDef.id) || [];
                          formik.setFieldValue(
                            childDef.id,
                            currentValues.filter(
                              (_v: any, i: number) => i !== index
                            )
                          );
                          setDeletionTicks((prev) => ({
                            ...prev,
                            [childDef.id]: (prev[childDef.id] || 0) + 1,
                          }));
                        }}
                        canBeMultipleCardinality={
                          childDef.max === "*" && childDefValues.length > 1
                        }
                        showAddButton={
                          childDef.max === "*" &&
                          childDefValues.length - 1 === index
                        }
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
                              label={
                                childIsMultipleCardinality
                                  ? childDef.id + `[${index}]`
                                  : childDef.id
                              }
                            />
                          </Box>
                        }
                      />
                    )
                  );
                })}
              </>
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
