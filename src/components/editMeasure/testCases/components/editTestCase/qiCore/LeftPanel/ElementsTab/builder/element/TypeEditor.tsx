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
import { Instant } from "@madie/madie-design-system/dist/react";
import TimeComponent from "./types/TimeComponent";
import { useFormikContext } from "formik";
import ExtensionComponent from "./types/ExtensionComponent";
import ProfiledExtensionComponent from "./types/ProfiledExtensionComponent";
import {
  getTopLevelElements,
  updateChildrenPaths,
  isComponentDataType,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";

const TypeEditor = ({
  type,
  resource,
  required,
  value,
  onChange,
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
      fhirDefinitionsService.current.getResourceTree(type).then((def) => {
        const elements = getTopLevelElements(def);
        const updatedElements = updateChildrenPaths(
          structureDefinition,
          elements
        );
        setChildTypeDefs(updatedElements);
      });
    }
  }, [type]);
  // helper neeeded for nested structures. cannot access with a string alone.
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
  if (isComponentDataType(type)) {
    switch (type) {
      case "string":
      case "http://hl7.org/fhirpath/System.String":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <StringComponent
              label={label}
              canEdit={canEdit}
              helperText={formikErrorHandler(label)}
              error={getNestedProperty(formik.errors, label)}
              structureDefinition={null}
              fieldRequired={required}
              value={value}
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
              structureDefinition={null}
              fieldRequired={required}
              value={value}
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
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            fieldRequired={required}
            label={``}
            onChange={onChange}
            value={value}
          />
        );
      case "time":
      case "http://hl7.org/fhir/R4/datatypes.html#time":
        return (
          <TimeComponent
            canEdit={canEdit}
            structureDefinition={null}
            fieldRequired={false}
            label={label}
            onChange={onChange}
            value={value}
          />
        );
      case "instant":
      case "http://hl7.org/fhir/R4/datatypes.html#instant":
        return (
          <Instant
            disabled={false}
            id="instant"
            label="Date Time"
            canEdit={canEdit}
            required={required}
            dateTimeValue={value}
            handleDateTimeChange={onChange}
          />
        );
      case "boolean":
        return (
          <BooleanComponent
            canEdit={canEdit}
            structureDefinition={null}
            fieldRequired={required}
            label={label}
            onChange={onChange}
            value={value === true ? "True" : "False"}
          />
        );
      case "uri":
        return (
          <UriComponent
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            fieldRequired={required}
            label={label}
            onChange={onChange}
            value={value}
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
            onChange={onChange}
            value={value}
          />
        );
      case "date":
        return (
          <DateComponent
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            fieldRequired={required}
            label={``}
            onChange={onChange}
            value={value}
          />
        );
      case "positiveInt":
        return (
          <IntegerComponent
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            fieldRequired={required}
            label={_.capitalize(
              structureDefinition?.id?.substring(
                structureDefinition?.id?.lastIndexOf(".") + 1
              )
            )}
            onChange={onChange}
            value={value}
            integerType={IntegerType.POSITIVE_INT}
          />
        );
      case "unsignedInt":
        return (
          <IntegerComponent
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            fieldRequired={required}
            label={_.capitalize(
              structureDefinition?.id?.substring(
                structureDefinition?.id?.lastIndexOf(".") + 1
              )
            )}
            onChange={onChange}
            value={value}
            integerType={IntegerType.UNSIGNED}
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
            onChange={onChange}
            value={value}
            structureDefinition={structureDefinition}
          />
        );
      case "Extension":
        return _.isEmpty(structureDefinition?.type?.[0]?.profile) ? (
          <ExtensionComponent
            canEdit={canEdit}
            onChange={onChange}
            fhirResource={resource}
            elementDefinition={structureDefinition}
            parentStructureDefinition={parentStructureDefinition}
          />
        ) : (
          <ProfiledExtensionComponent
            canEdit={canEdit}
            structureDefinition={structureDefinition}
            fieldRequired={false}
            resource={resource}
          />
        );
      default:
        return <div>Unsupported Type [{type}]</div>;
    }
  } else if (!_.isEmpty(childTypeDefs)) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {childTypeDefs?.map((childTypeDef) => {
          const childType = childTypeDef?.type?.[0];
          const childRequired = +childTypeDef.min > 0;
          return (
            <TypeEditor
              type={childType?.code}
              resource={resource}
              onChange={(e) => {}}
              value={null}
              structureDefinition={childTypeDef}
              required={childRequired}
              canEdit={canEdit}
              label={childTypeDef?.id}
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
