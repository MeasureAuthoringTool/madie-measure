import React, { useEffect, useState, useMemo, useRef } from "react";
import * as _ from "lodash";
import { Box, Divider } from "@mui/material";

import StringComponent from "./types/StringComponent";
import PeriodComponent from "./types/PeriodComponent";
import DateTimeComponent from "./types/DateTimeComponent";
import BooleanComponent from "./types/BooleanComponent";
import UriComponent from "./types/UriComponent";
import UrlComponent from "./types/UrlComponent";
import DateComponent from "./types/DateComponent";
import IntegerComponent, { IntegerType } from "./types/IntegerComponent";
import CodesComponent from "./types/CodesComponent";
import InstantComponent from "./types/InstantComponent";
import TimeComponent from "./types/TimeComponent";
import { useFormikContext } from "formik";
import ExtensionComponent from "./types/ExtensionComponent";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";
import {
  isComponentDataType,
  stripAllIndexes,
  getRequired,
  getTopLevelElements,
  getFirstChildren,
  getNestedProperty,
  getIndexFromPath,
  getLastPart,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import CodingComponent from "./types/CodingComponent";
import { useRequiredFields } from "./RequiredFieldsContext";
import ElementSection from "../../../../../../common/ElementSection";
import CodeableConceptComponent from "./types/CodeableConceptComponent";
import PeriodDateTimeComponent from "./types/PeriodDateTimeComponent";
import ChoiceType from "./ChoiceType";
import QuantityComponent from "./types/QuantityComponent";
import IdentifierComponent from "./types/IdentifierComponent";
import QuantityIntervalInput from "../../../../../../common/quantityIntervalInput/QuantityIntervalInput";
import MoneyComponent from "./types/MoneyComponent";
import TimingComponent from "./types/TimingComponent";

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
  const { requiredFields, formInfo } = useRequiredFields();
  let required = getRequired(requiredFields, stripAllIndexes(label));
  const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());
  const currentQuantityRatio = {
    low: {},
    high: {},
  };

  if (typeof label !== "string") {
    console.warn("TypeEditor: label is not a string", label);
    throw new Error("TypeEditor: label is not a string");
  }

  let type: string = structureDefinition?.type?.find((t) =>
    _.toLower(label).includes(_.toLower(t.code))
  )?.code;
  if (!type) {
    type = structureDefinition?.type?.[0]?.code;
  }
  const values = _.get(formik.values, label);
  // is multiple cardinality?
  if (structureDefinition?.max === "*") {
    // is it not already terminated with an index?
    if (!getIndexFromPath(label) && !values?.length) {
      // we are just going to add a zero for now. could be smarter later
      // TO DO: We will eventually need to map inner elements of multiple cardinality based on how many elements are in the form
      // something like Array.From(numOfElementsInForm, _index) =>) had a previous rendition of this guy working in 8500 pr commits
      // https://github.com/MeasureAuthoringTool/madie-measure/pull/901
      label = `${structureDefinition.id}[0]`;
    }
  }
  // Needs to be a memo instead of a useEffect that resets state. This caused a bunch of rerenders, and got stale values from mapping
  // like passing in an incrementing label like name[0], the result would always end up name[maxNumOfElements] because it was an unstable var
  // don't use useEffects unless you absolutely have to. There is almost certainly always another way.

  // DiagnosticReport.presentedForm comes in without the index. We need to map it for multiple cardinality to test stuff.
  const childDefs = useMemo(() => {
    if (!isComponentDataType(type)) {
      const elements = getFirstChildren(stripAllIndexes(label), formInfo);
      if (elements?.length) {
        const updatedElements = elements.map((el) => {
          const lastPart = el.id.split(".").pop();
          const updatedId = `${label}.${lastPart}`;
          return { ...el, id: updatedId };
        });
        return updatedElements; //previously filtered out type === BackboneElement
      }
    }
    return [];
  }, [type, label, getFirstChildren]);

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

  const formikErrorHandler = (name: string) => {
    const touched = getNestedProperty(formik.touched, name);
    const errors = getNestedProperty(formik.errors, name);
    if (touched && errors) {
      return errors;
    }
  };

  const isRoot = structureDefinition?.id?.split?.(".")?.length === 2;
  const canBeMultipleCardinality = structureDefinition?.max === "*";
  const addTitle = structureDefinition?.id
    ? _.startCase(getLastPart(structureDefinition.id))
    : "";
  const showAddAttributeButton = Boolean(!isRoot && canBeMultipleCardinality);
  if (isComponentDataType(type)) {
    switch (type) {
      case "string":
      case "http://hl7.org/fhirpath/System.String":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {showAddAttributeButton && values ? (
              values.map((el, index) => (
                <StringComponent
                  key={index}
                  stringOnly={label?.split(".").pop() !== "id"}
                  label={`${label}[${index}]`}
                  canEdit={canEdit}
                  helperText={formikErrorHandler(`${label}[${index}]`)}
                  error={getNestedProperty(formik.errors, `${label}[${index}]`)}
                  fieldRequired={required}
                  showAddAttributeButton={
                    showAddAttributeButton && index === values.length - 1
                  }
                  addTitle={addTitle}
                  handleAddElement={handleAddElement}
                  {...formik.getFieldProps(`${label}[${index}]`)}
                />
              ))
            ) : (
              <StringComponent
                stringOnly={label?.split(".").pop() !== "id"}
                label={label}
                canEdit={canEdit}
                helperText={formikErrorHandler(label)}
                error={getNestedProperty(formik.errors, label)}
                fieldRequired={required}
                showAddAttributeButton={showAddAttributeButton}
                addTitle={addTitle}
                handleAddElement={handleAddElement}
                {...formik.getFieldProps(label)}
              />
            )}
          </Box>
        );
      case "base64Binary":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <StringComponent
              stringOnly={false}
              label={label}
              canEdit={canEdit}
              helperText={formikErrorHandler(label)}
              error={getNestedProperty(formik.errors, label)}
              fieldRequired={required}
              showAddAttributeButton={showAddAttributeButton}
              addTitle={addTitle}
              {...formik.getFieldProps(label)}
              onChange={({ target }) => {
                formik.setFieldTouched(label);
                formik.setFieldValue(label, target.value);
              }}
            />
          </Box>
        );
      case "markdown":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <StringComponent
              stringOnly={false}
              label={label}
              canEdit={canEdit}
              helperText={formikErrorHandler(label)}
              error={getNestedProperty(formik.errors, label)}
              showAddAttributeButton={showAddAttributeButton}
              addTitle={addTitle}
              fieldRequired={required}
              {...formik.getFieldProps(label)}
            />
          </Box>
        );
      case "Quantity":
        return (
          <QuantityComponent
            canEdit={canEdit}
            label={label}
            structureDefinition={structureDefinition}
            fieldRequired={required}
          />
        );
      case "Period":
        return (
          <PeriodComponent
            label={label}
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            showAddAttributeButton={showAddAttributeButton}
            addTitle={addTitle}
            fieldRequired={required}
          />
        );
      case "dateTime":
      case "http://hl7.org/fhirpath/System.DateTime":
        return (
          <>
            {showAddAttributeButton && values ? (
              values.map((el, index) => (
                <DateTimeComponent
                  key={index}
                  label={`${label}[${index}]`}
                  canEdit={canEdit}
                  helperText={formikErrorHandler(`${label}[${index}]`)}
                  error={getNestedProperty(formik.errors, `${label}[${index}]`)}
                  fieldRequired={required}
                  showAddAttributeButton={
                    showAddAttributeButton && index === values.length - 1
                  }
                  addTitle={addTitle}
                  handleAddElement={handleAddElement}
                  {...formik.getFieldProps(`${label}[${index}]`)}
                  onChange={(value) => {
                    formik.setFieldTouched(`${label}[${index}]`);
                    formik.setFieldValue(`${label}[${index}]`, value);
                  }}
                  setTouched={() => {
                    formik.setFieldTouched(`${label}[${index}]`);
                  }}
                />
              ))
            ) : (
              <DateTimeComponent
                label={label}
                canEdit={canEdit}
                helperText={formikErrorHandler(label)}
                error={getNestedProperty(formik.errors, label)}
                fieldRequired={required}
                showAddAttributeButton={showAddAttributeButton}
                addTitle={addTitle}
                handleAddElement={handleAddElement}
                {...formik.getFieldProps(label)}
                onChange={(value) => {
                  formik.setFieldTouched(label);
                  formik.setFieldValue(label, value);
                }}
                setTouched={() => {
                  formik.setFieldTouched(label);
                }}
              />
            )}
          </>
        );
      // I think this is functionally unreachable code. Cant find any evidence of fhir element type = time
      case "time":
      case "http://hl7.org/fhir/R4/datatypes.html#time":
        return (
          <>
            {showAddAttributeButton && values ? (
              values.map((el, index) => (
                <TimeComponent
                  canEdit={canEdit}
                  fieldRequired={required}
                  label={`${label}[${index}]`}
                  helperText={formikErrorHandler(`${label}[${index}]`)}
                  error={getNestedProperty(formik.errors, `${label}[${index}]`)}
                  showAddAttributeButton={
                    showAddAttributeButton && index === values.length - 1
                  }
                  addTitle={addTitle}
                  handleAddElement={handleAddElement}
                  {...formik.getFieldProps(`${label}[${index}]`)}
                  onChange={(value) => {
                    formik.setFieldTouched(`${label}[${index}]`);
                    formik.setFieldValue(`${label}[${index}]`, value);
                  }}
                />
              ))
            ) : (
              <TimeComponent
                canEdit={canEdit}
                fieldRequired={required}
                label={label}
                helperText={formikErrorHandler(label)}
                error={getNestedProperty(formik.errors, label)}
                showAddAttributeButton={showAddAttributeButton}
                addTitle={addTitle}
                handleAddElement={handleAddElement}
                {...formik.getFieldProps(label)}
                onChange={(value) => {
                  formik.setFieldTouched(label);
                  formik.setFieldValue(label, value);
                }}
              />
            )}
          </>
        );
      case "instant":
      case "http://hl7.org/fhir/R4/datatypes.html#instant":
        return (
          <InstantComponent
            name={label}
            label={label}
            required={required}
            helperText={formikErrorHandler(label)}
            error={getNestedProperty(formik.errors, label)}
            handleDateTimeChange={(value) => {
              formik.setFieldTouched(label);
              formik.setFieldValue(label, value);
            }}
            setTouched={() => {
              formik.setFieldTouched(label);
            }}
            showAddAttributeButton={showAddAttributeButton}
            addTitle={addTitle}
            dateTimeValue={formik.getFieldProps(label).value}
            onBlur={() => formik.setFieldTouched(label)}
          />
        );
      case "http://hl7.org/fhirpath/System.Integer":
      case "integer":
      case "positiveInt":
      case "unsignedInt":
        return (
          <IntegerComponent
            structureDefinition={undefined}
            canEdit={canEdit}
            fieldRequired={required}
            label={label}
            helperText={formikErrorHandler(label)}
            error={getNestedProperty(formik.errors, label)}
            integerType={
              type === "unsignedInt"
                ? IntegerType.UNSIGNED
                : IntegerType.POSITIVE_INT
            }
            showAddAttributeButton={showAddAttributeButton}
            addTitle={addTitle}
            {...formik.getFieldProps(label)}
          />
        );
      case "Identifier":
        return (
          <IdentifierComponent
            label={label}
            canEdit={canEdit}
            resource={resource}
            structureDefinition={structureDefinition}
            fieldRequired={false}
            error={getNestedProperty(formik.errors, label)}
            helperText={formikErrorHandler(label)}
          />
        );
      case "http://hl7.org/fhirpath/System.Boolean":
      case "boolean":
        return (
          <BooleanComponent
            canEdit={canEdit}
            structureDefinition={null}
            fieldRequired={required}
            label={label}
            helperText={formikErrorHandler(label)}
            error={getNestedProperty(formik.errors, label)}
            showAddAttributeButton={showAddAttributeButton}
            addTitle={addTitle}
            {...formik.getFieldProps(label)}
          />
        );
      case "uri":
        return (
          <UriComponent
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            fieldRequired={required}
            label={label}
            helperText={formikErrorHandler(label)}
            showAddAttributeButton={showAddAttributeButton}
            addTitle={addTitle}
            error={getNestedProperty(formik.errors, label)}
            {...formik.getFieldProps(label)}
            onChange={({ target }) => {
              formik.setFieldTouched(label);
              formik.setFieldValue(label, target.value);
            }}
          />
        );
      case "url":
      case "canonical":
        return (
          <UrlComponent
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            fieldRequired={required}
            label={label}
            showAddAttributeButton={showAddAttributeButton}
            addTitle={addTitle}
            {...formik.getFieldProps(label)}
          />
        );
      case "date":
        return (
          <DateComponent
            label={label}
            canEdit={canEdit}
            helperText={formikErrorHandler(label)}
            error={getNestedProperty(formik.errors, label)}
            fieldRequired={required}
            showAddAttributeButton={showAddAttributeButton}
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
            {showAddAttributeButton && values ? (
              values.map((el, index) => (
                <CodesComponent
                  canEdit={canEdit}
                  fieldRequired={required}
                  label={`${label}[${index}]`}
                  resource={resource}
                  structureDefinition={structureDefinition}
                  showAddAttributeButton={
                    showAddAttributeButton && index === values.length - 1
                  }
                  addTitle={addTitle}
                  handleAddElement={handleAddElement}
                  {...formik.getFieldProps(`${label}[${index}]`)}
                  onChange={(value) => {
                    formik.setFieldTouched(`${label}[${index}]`);
                    formik.setFieldValue(`${label}[${index}]`, value);
                  }}
                />
              ))
            ) : (
              <CodesComponent
                canEdit={canEdit}
                fieldRequired={required}
                label={label}
                resource={resource}
                structureDefinition={structureDefinition}
                showAddAttributeButton={showAddAttributeButton}
                addTitle={addTitle}
                handleAddElement={handleAddElement}
                {...formik.getFieldProps(label)}
                onChange={(value) => {
                  if (label.includes(".value[x")) {
                    label = label.replace(".value[x]", ".valueCode");
                  }
                  formik.setFieldTouched(label);
                  formik.setFieldValue(label, value);
                }}
              />
            )}
          </>
        );
      case "Range":
        return (
          <QuantityIntervalInput
            label={label}
            quantityInterval={currentQuantityRatio}
            onQuantityIntervalChange={(val) => {
              formik.setFieldTouched(label);
              formik.setFieldValue(label, val);
            }}
            canEdit={canEdit}
          />
        );
      case "Coding":
        return (
          <CodingComponent
            label={label}
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            showAddAttributeButton={showAddAttributeButton}
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
          <CodeableConceptComponent
            label={label}
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            showAddAttributeButton={showAddAttributeButton}
            addTitle={addTitle}
            {...formik.getFieldProps(label)}
            onChange={(value) => {
              formik.setFieldTouched(label);
              formik.setFieldValue(label, value);
            }}
          />
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
              showAddAttributeButton={showAddAttributeButton}
              addTitle={addTitle}
              label={label}
              canEdit={canEdit}
              {...formik.getFieldProps(label)}
              onChange={() => {}}
              formikHandleChange={formik.handleChange}
              // Being depcreated for a formik handleChange
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
          helperText={formikErrorHandler(label)}
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
              "Quantity",
              "Range",
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
                label={label}
              />
            );
          } else if (!isComponentDataType(childDef?.type?.[0]?.code)) {
            // add additional check for if the type exists because I have no idea what ClaimResponse.item.detail.adjudication is but it has no type.
            // TODO Figure out whats up with ClaimResponse.item.detail.adjudication. Doesn't appear to have children, but a backbone el
            // TODO probably have to map these multiple cardinality elements against the length of the formik.values[propertyPath] if multiple and add index like done in elementEditorChildren.
            return (
              <ElementSection
                title={childDef.id}
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
