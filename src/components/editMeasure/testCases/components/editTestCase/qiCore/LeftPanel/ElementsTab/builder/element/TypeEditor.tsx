import React, { useEffect, useState, useMemo } from "react";
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
import ProfiledExtensionComponent from "./types/ProfiledExtensionComponent";
import {
  isComponentDataType,
  stripAllIndexes,
  getRequired,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import CodingComponent from "./types/CodingComponent";
import { useRequiredFields } from "./RequiredFieldsContext";
import ElementSection from "../../../../../../common/ElementSection";
// onChange is being deprecated as no updates to the resource are tracked.
// Changes directly to the json should be done with a disaptch, this propagates downstream changes in formik.
// any temporary form state should be done through formik.
const TypeEditor = ({
  type,
  resource,
  structureDefinition,
  parentStructureDefinition,
  canEdit,
  label,
}) => {
  const formik = useFormikContext();
  const { requiredFields, formInfo, getFirstChildren, getParentDefinition } = useRequiredFields();
  let required = getRequired(requiredFields, stripAllIndexes(label));
  const getString = (string) => {
    return JSON.stringify(string, null, 2);
  }

  // Needs to be a memo instead of a useEffect that resets state. This caused a bunch of rerenders, and got stale values from mapping
  // like passing in an incrementing label like name[0], the result would always end up name[maxNumOfElements] because it was an unstable var
  // don't use useEffects unless you absolutely have to. There is almost certainly always another way.
  const childDefs = useMemo(() => {
    if (!isComponentDataType(type) && type) {
      const elements = getFirstChildren(stripAllIndexes(label));
      if (elements?.length) {
        const updatedElements = elements.map((el) => {
          const lastPart = el.id.split(".").pop();
          const updatedId = `${label}.${lastPart}`;
          return { ...el, id: updatedId };
        });
          // .filter((el) => el.type !== "BackboneElement"); // was doing this earlier. don't think we need now.

        console.log("updatedElements", getString(updatedElements));
        return updatedElements;
      }
    }
    return [];
  }, [type, label, getFirstChildren]);
  const testParentDefinition = getParentDefinition(stripAllIndexes(label));
  console.log('testPArent',label,  testParentDefinition);
  console.log('formInfo', formInfo)
  // console.log('childTypedefs', childTypeDefs, label)
  const getNestedProperty = (obj, path) => {
    if (!path) return undefined;
    const keys = path.match(/([^[.\]]+)/g); // matches words between dots and brackets
    return keys?.reduce((current, key) => current && current[key], obj);
  };

  const formikErrorHandler = (name: string) => {
    const touched = getNestedProperty(formik.touched, name);
    const errors = getNestedProperty(formik.errors, name);
    if (touched && errors) {
      return errors;
    }
  };
  // console.log('isComponentDataType', getString(label), type)
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
            // label={label}
            structureDefinition={structureDefinition}
          />
        );
      case "Coding":
        return (
          <CodingComponent
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            fieldRequired={required}
          />
        );
      case "Extension":
        // // return <div/>
        // return _.isEmpty(structureDefinition?.type?.[0]?.profile) ? (
        //   <ExtensionComponent
        //     canEdit={canEdit}
        //     // onChange={onChange}
        //     label={label}
        //     onChange={() => {}}
        //     fhirResource={resource}
        //     elementDefinition={structureDefinition}
        //     parentStructureDefinition={parentStructureDefinition}
        //   />
        // ) : (
        //   <ProfiledExtensionComponent
        //     label={label}
        //     canEdit={canEdit}
        //     structureDefinition={structureDefinition}
        //     parentStructureDefinition={parentStructureDefinition}

        //     fieldRequired={false}
        //     resource={resource}
        //   />
        // );
      default:
        return <div>Unsupported Type [{type}]</div>;
    }
  } else if (!_.isEmpty(childDefs)) {
    // console.log('~childDefs', childDefs)
    //  If we have childTypeDefs, we need to check to make weather or not there's an index supplied so we can attach it to the label
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {childDefs?.map((childDef) => {
          required = getRequired(requiredFields, stripAllIndexes(childDef.id));
          // if it's not a component dataType, we should render a header since it will have it's own property paths
          if (!isComponentDataType(childDef?.type && childDef.type)) {
            // add additional check for if the type exists because I have no idea what ClaimResponse.item.detail.adjudication is but it has no type.
            // TODO Figure out whats up with ClaimResponse.item.detail.adjudication. stupid thing
            // console.log("!not", childDef, structureDefinition);
            // TODO probably have to map these multiple cardinality elements against the length of the formik.values[propertyPath] if multiple and add index like done in elementEditorChildren
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
                      type={childDef?.type}
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
                type={childDef?.type}
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
