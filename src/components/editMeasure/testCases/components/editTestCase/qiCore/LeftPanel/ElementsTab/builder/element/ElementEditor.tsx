import React, { useRef, useState, useEffect } from "react";
import { Box } from "@mui/material";
import * as _ from "lodash";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";
import ElementEditorChildren from "./ElementEditorChildren";
import "./ElementEditor.scss";
import { FormikConsumer, FormikContext, useFormikContext, useFormik, FormikProvider } from "formik";
// import { elementEditorFormBuilder } from "./ElementEditorFormBuilder";
import * as Yup from "yup";
import { getValidation } from "./typesValidations/fhirR4Validations";

interface ElementEditorProps {
  resource?: any;
  selectedResource?: any;
  elementDefinition: any;
  resourcePath: string;
  value?: any;
  onChange?: (path: string, value: any) => void;
  canEdit: boolean;
}

const ElementEditor = ({
  selectedResource,
  resource,
  elementDefinition,
  resourcePath,
  onChange,
  canEdit,
}: ElementEditorProps) => {
  const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());

  const [intialValues, setInitialValues] = useState({})
  const [validationSchema, setValidationSchema] = useState({})


  const formik = useFormik({
    initialValues: {
      intialValues

    },
    enableReinitialize: true,
    validationSchema: validationSchema,
    onSubmit: values => {
      console.log('values are', values)
    },
  });
  if (_.isNil(elementDefinition)) {
    return <span>No element selected</span>;
  }
  const currentPath = elementDefinition?.path;
  const allChildren = fhirDefinitionsService?.current?.getAllChildren(
    selectedResource,
    currentPath
  );
  
  const getChildTypeDefs = (type) => {
    if (!fhirDefinitionsService.current.isComponentDataType(type)) {
      fhirDefinitionsService.current.getResourceTree(type).then((def) => {
        const elements =
          fhirDefinitionsService.current.getTopLevelElements(def);
        return elements;
      });
    }
    return null;
  }

  
  // <TypeEditor will either render a node or all top level elements if it's not a root. We need to make that check here
  
  const buildNode = (child, resourcePath, fhirDefinitionsService, resource) => {
    // given a child, 
    // is it a single render type? 
    const type = child?.type?.[0].code;
    if (!fhirDefinitionsService.current.isComponentDataType(type)) {
      console.log('!not', child)
      fhirDefinitionsService.current.getResourceTree(type).then((def) => {
        const elements =
          fhirDefinitionsService.current.getTopLevelElements(def);
        console.log('elements from build node are', elements);
      });
    }

    const required = +child.min > 0;
    const elemPath = fhirDefinitionsService.current.stripResourcePath(
      resourcePath,
      child.path
    );
    
    let value = _.get(resource, elemPath);
    return {
      id: child?.id,
      label: child.path.split(".")[child.path.split(".").length - 1],
      value,
      type,
      required
    }
  }
  

  const buildForm = (rootDefinition, allChildren, fhirDefinitionsService, resourcePath, resource) => {
    const results = {}; 
    const node = buildNode(rootDefinition, resourcePath, fhirDefinitionsService, resource);
    results[node.id] = node;
    const childTypeDefs = getChildTypeDefs(node.type);
    if (childTypeDefs){
      for (const ch of childTypeDefs){
        const builtNode = buildNode(ch, resourcePath, fhirDefinitionsService, resource);
        results[builtNode.id] = builtNode;
      }
    }

    for(const child of allChildren){
      // console.log('child is', child)
      const builtNode = buildNode(child, resourcePath, fhirDefinitionsService, resource);
      results[builtNode.id] = builtNode;
    }
    return results;
  }
  const currentDepth = elementDefinition?.path.split(".").length;
  
  const formInfo = buildForm(elementDefinition, allChildren,  fhirDefinitionsService, resourcePath, resource) // useThis to init values and schema
  const form = {};
  const validationSchemaObject = {}
  // const validationSchema = Yup.object().shape({
  //   // key: schema.getSchema
  // });

  for (const key in formInfo){
    form[key] = formInfo[key].value
    const validation = getValidation(formInfo[key].type);
    if (validation){
      validationSchemaObject[formInfo[key].id] = validation(formInfo[key].requried)
    }
  }
  console.log('formInfo is', formInfo);
  console.log('form is', form)
  console.log('vaidationSchemaObject', validationSchemaObject);
  // setInitialValues()

  

  if (formInfo){
    return (
      <FormikProvider value={formik}>
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
        id="element-editor"
      >
        {/* we need to render not only the current item, but all children */}
        <ElementEditorChildren //recursive render control
          // stuff we need only at the init root
          resourcePath={resourcePath}
          fhirDefinitionsService={fhirDefinitionsService}
          rootDefinition={elementDefinition}
          // stuff we need everywhere
          allChildren={allChildren}
          currentDepth={currentDepth}
          resource={resource}
          handleChange={onChange}
          canEdit={canEdit}
        />
      </Box>
      </FormikProvider>
    );
  }
  return null;
};

export default ElementEditor;
