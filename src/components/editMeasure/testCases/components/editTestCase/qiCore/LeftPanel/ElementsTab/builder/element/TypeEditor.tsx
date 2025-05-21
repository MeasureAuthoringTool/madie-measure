import React, { useEffect, useState, useMemo, useRef } from "react";
import * as _ from "lodash";
import Box from "@mui/material/Box";
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
  stripResourcePath,
  getFirstChildren,
  getNestedProperty,
  getIndexFromPath,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import CodingComponent from "./types/CodingComponent";
import { useRequiredFields } from "./RequiredFieldsContext";
import ElementSection from "../../../../../../common/ElementSection";
import { Divider } from "@mui/material";
import CodeableConceptComponent from "./types/CodeableConceptComponent";

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
  const type = structureDefinition?.type?.[0]?.code;
  // is multiple cardinality?
  if (structureDefinition?.max === "*") {
    // is it not already terminated with an index?
    if (!getIndexFromPath(label)) {
      // we Just going to add a zero for now. could be smarter later
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

  const formikErrorHandler = (name: string) => {
    const touched = getNestedProperty(formik.touched, name);
    const errors = getNestedProperty(formik.errors, name);
    if (touched && errors) {
      return errors;
    }
  };
  if (isComponentDataType(type)) {
    switch (type) {
      case "string":
      case "http://hl7.org/fhirpath/System.String":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <StringComponent
              stringOnly={label?.split(".").pop() === "id" ? false : true}
              label={label}
              canEdit={canEdit}
              helperText={formikErrorHandler(label)}
              error={getNestedProperty(formik.errors, label)}
              fieldRequired={required}
              {...formik.getFieldProps(label)}
            />
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
              fieldRequired={required}
              {...formik.getFieldProps(label)}
            />
          </Box>
        );
      case "Period":
        return (
          <PeriodComponent
            label={label}
            canEdit={canEdit}
            structureDefinition={null}
            fieldRequired={false}
          />
        );
      case "dateTime":
      case "http://hl7.org/fhirpath/System.DateTime":
        return (
          <DateTimeComponent
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
            setTouched={() => {
              formik.setFieldTouched(label);
            }}
          />
        );
      // I think this is functionally unreachable code. Cant find any evidence of fhir element type = time
      case "time":
      case "http://hl7.org/fhir/R4/datatypes.html#time":
        return (
          <TimeComponent
            canEdit={canEdit}
            fieldRequired={required}
            label={label}
            helperText={formikErrorHandler(label)}
            error={getNestedProperty(formik.errors, label)}
            {...formik.getFieldProps(label)}
          />
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
            dateTimeValue={formik.getFieldProps(label).value}
            onBlur={() => formik.setFieldTouched(label)}
          />
        );
      case "http://hl7.org/fhirpath/System.Integer":
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
            {...formik.getFieldProps(label)}
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
          <CodesComponent
            canEdit={canEdit}
            fieldRequired={required}
            label={_.capitalize(
              label?.id?.substring(label?.id?.lastIndexOf(".") + 1)
            )}
            structureDefinition={structureDefinition}
            {...formik.getFieldProps(label)}
            onChange={(value) => {
              formik.setFieldTouched(label);
              formik.setFieldValue(label, value);
            }}
          />
        );
      case "Coding":
        return (
          <CodingComponent
            label={label}
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            {...formik.getFieldProps(label)}
            onChange={(value) => {
              formik.setFieldTouched(label);
              formik.setFieldValue(label, value);
            }}
          />
        );
      case "CodeableConcept":
        return (
          <CodeableConceptComponent
            label={label}
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            {...formik.getFieldProps(label)}
            onChange={(value) => {
              formik.setFieldTouched(label);
              formik.setFieldValue(label, value);
            }}
          />
        );
      case "Extension":
        // map when profiles are there
        if (extensionProfileDef) {
          const topLevelElements = extensionProfileDef
            ? getTopLevelElements(extensionProfileDef)
            : null;
          return extensionProfileDef ? (
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Box>{structureDefinition.short}</Box>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {topLevelElements.map((elementDefinition, index) => {
                  const elemPath = stripResourcePath(
                    "Extension",
                    elementDefinition.path
                  );
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
                        label={elemPath} //this is wrong, TODO: figure out what this should be
                        // label={}
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
        return (
          <ExtensionComponent
            canEdit={canEdit}
            onChange={() => {}}
            // Being depcreated for a formik handleChange
            // label={label} // label will be needed later to hook up to formik.
            fhirResource={resource}
            elementDefinition={structureDefinition}
            parentStructureDefinition={parentStructureDefinition}
          />
        );
      default:
        return <div>Unsupported Type [{type}]</div>;
    }
  } else if (!_.isEmpty(childDefs)) {
    //  If we have childTypeDefs, we need to check to make weather or not there's an index supplied so we can attach it to the label
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {childDefs?.map((childDef) => {
          // if it's not a component dataType, we should render a header since it will have it's own property paths
          if (!isComponentDataType(childDef?.type?.[0]?.code)) {
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
