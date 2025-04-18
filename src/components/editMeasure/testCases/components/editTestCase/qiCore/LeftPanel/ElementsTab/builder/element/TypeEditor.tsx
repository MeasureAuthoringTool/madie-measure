import React, { useEffect, useRef, useState } from "react";
import * as _ from "lodash";
import Box from "@mui/material/Box";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";
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
  getTopLevelElements,
  updateChildrenPaths,
  isComponentDataType,
  getIndexFromPath,
  mergePathWithIndex
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import CodingComponent from "./types/CodingComponent";

// onChange is being deprecated as no updates to the resource are tracked.
// Changes directly to the json should be done with a disaptch, this propagates downstream changes in formik.
// any temporary form state should be done through formik.
const TypeEditor = ({
  type,
  resource,
  required,
  structureDefinition,
  parentStructureDefinition,
  canEdit,
  label,
}) => {
  const formik = useFormikContext();
  const [childTypeDefs, setChildTypeDefs] = useState([]);
  const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());
  useEffect(() => {
    if (!isComponentDataType(type)) {
      if (type) {
        fhirDefinitionsService.current.getResourceTree(type).then((def) => {
          if (def) {
            const elements = getTopLevelElements(def);
            const updatedElements = updateChildrenPaths(
              structureDefinition,
              elements
            );
            const index = getIndexFromPath(label)
            const updatedMappedElements = updatedElements.map((el) => {
              el.id = index ? mergePathWithIndex(label, el.id) : el.id
              return el
            })
            setChildTypeDefs(updatedMappedElements);

          }
        });
      }
    }
  }, [type]);
  // helper needed for nested structures. cannot access with a string alone.
  const getNestedProperty = (obj, path) => {
    return path
      .split(".")
      .reduce((current, key) => current && current[key], obj);
  };

  const formikErrorHandler = (name: string) => {
    const touched = getNestedProperty(formik.touched, name);
    const errors = getNestedProperty(formik.errors, name);
    if (touched && errors) {
      return errors;
    }
  };

  // console.log('label is', label, 'childTypeDEfs', childTypeDefs, 'type is', type, 'isComponentDataType', isComponentDataType(type));

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
      // case "Extension":
      //   return _.isEmpty(structureDefinition?.type?.[0]?.profile) ? (
      //     <ExtensionComponent
      //       canEdit={canEdit}
      //       // onChange={onChange}
      //       onChange={() =>{}}
      //       fhirResource={resource}
      //       elementDefinition={structureDefinition}
      //       parentStructureDefinition={parentStructureDefinition}
      //     />
      //   ) : (
      //     <ProfiledExtensionComponent
      //       label={label}
      //       canEdit={canEdit}
      //       structureDefinition={structureDefinition}
      //       fieldRequired={false}
      //       resource={resource}
      //     />
      //   );
      default:
        return <div>Unsupported Type [{type}]</div>;
    }
  } else if (!_.isEmpty(childTypeDefs)) {


    //  If we have childTypeDefs, we need to check to make weather or not there's an index supplied so we can attach it to the label
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {childTypeDefs?.map((childTypeDef) => {
          const childType = childTypeDef?.type?.[0];
          const childRequired = +childTypeDef.min > 0;
          // console.log('child', childTypeDefs)
          const index = getIndexFromPath(label)
          return (
            // <div />
            <TypeEditor
              type={childType?.code}
              resource={resource}
              structureDefinition={childTypeDef}
              required={childRequired}
              canEdit={canEdit}
              // label={childTypeDef.id}

              // label={index ? mergePathWithIndex(label, childTypeDef.id) : childTypeDef.id}
              label={childTypeDef.id}
              parentStructureDefinition={structureDefinition}
            />
          );
        })}
      </Box>
    );
  } else {
    // should only get here when loading child types..
    return <></>;
  }
};

export default TypeEditor;
