import React, { useRef, useState, useEffect } from "react";
import { Box } from "@mui/material";
import * as _ from "lodash";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";
import ElementEditorChildren from "./ElementEditorChildren";
import "./ElementEditor.scss";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import { getValidation } from "./typesValidations/fhirR4Validations";
import {
  getTopLevelElements,
  updateChildrenPaths,
  getAllChildren,
  stripResourcePath,
  isComponentDataType,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
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
  const fhirDefinitionsServiceApi = useFhirDefinitionsServiceApi();
  const fhirDefinitionsService = useRef(fhirDefinitionsServiceApi);
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState({});
  const [validationSchema, setValidationSchema] = useState({});
  const buildNode = async (
    child,
    resourcePath,
    fhirDefinitionsService,
    resource,
    nodeList = []
  ) => {
    const type = child?.type?.[0]?.code;
    if (!isComponentDataType(type)) {
      // Fetch the resource tree asynchronously
      // nesting these ifs to avoid a crash in deeply nested Claimresponse.item. Might cause issue elsewhere.
      if (type) {
        const def = await fhirDefinitionsService.current.getResourceTree(type);
        if (def) {
          const elements = getTopLevelElements(def);
          const updatedElements = updateChildrenPaths(child, elements);
          if (updatedElements) {
            for (const element of updatedElements) {
              nodeList = await buildNode(
                element,
                resourcePath,
                fhirDefinitionsService,
                resource,
                nodeList
              );
            }
          }
          return nodeList; // Return the aggregated node list
        }
      }
      // This is the edge case for when we're providing the root of the structure like ClaimResponse as it's not a componentDataType and there is no type
      const required = +child.min > 0;
      const elemPath = child.path;
      const value = _.get(resource, elemPath);
      console.log("CHILD IS", child);
      const builtNode = {
        id: child?.id,
        label: child.path.split(".").pop(),
        value,
        type,
        required,
        validation: null,
      };
      return nodeList.concat(builtNode);
    } else {
      // It's a single node. Add it to the node list
      const required = +child.min > 0;
      const elemPath = stripResourcePath(resourcePath, child.path);
      const value = _.get(resource, elemPath);
      const builtNode = {
        id: child?.id,
        label: child.path.split(".").pop(),
        value,
        type,
        required,
        validation: getValidation(type, required),
      };
      return nodeList.concat(builtNode);
    }
  };
  const buildForm = async (
    rootDefinition,
    allChildren,
    fhirDefinitionsService,
    resourcePath,
    resource
  ) => {
    const results = {};
    const nodeList = [];
    const allNodes = [rootDefinition, ...allChildren];
    for (const node of allNodes) {
      nodeList.push(
        ...(await buildNode(
          node,
          resourcePath,
          fhirDefinitionsService,
          resource
        ))
      );
    }
    for (const builtNode of nodeList) {
      // associate id with form
      results[builtNode.id] = builtNode;
    }
    buildSchemaAndInitialValues(results);
  };
  const recursiveAddYupObject = (validationSchema) => {
    // Iterate over each key in the object
    for (const key in validationSchema) {
      const value = validationSchema[key];
      if (!Yup.isSchema(value) && typeof value === "object") {
        // we need to convert this key to a yup object, but we also need to check deeper.
        if (
          validationSchema[key] &&
          typeof validationSchema[key] === "object" &&
          !Array.isArray(validationSchema[key])
        ) {
          recursiveAddYupObject(validationSchema[key]);
        }
        validationSchema[key] = Yup.object(value);
      }
    }
    return validationSchema;
  };
  // given form info, we're going to make an object of schemas and save it to state for formik.
  const buildSchemaAndInitialValues = (formInfo) => {
    const initialValuesObject = {};
    const validationSchemaObject = {};
    const setNestedValue = (obj, path, value) => {
      const keys = path.split(".");
      let currentObj = obj;
      // start nested structure
      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          currentObj[key] = value;
        } else {
          currentObj[key] = currentObj[key] || {};
          currentObj = currentObj[key];
        }
      });
    };
    for (const key in formInfo) {
      const { value, type, validation } = formInfo[key];
      setNestedValue(initialValuesObject, key, value);
      setNestedValue(validationSchemaObject, key, validation);
    }
    setInitialValues(initialValuesObject);
    setValidationSchema(
      Yup.object().shape(recursiveAddYupObject(validationSchemaObject))
    );
    // need a loading toggle or formikProvider dies violently.
    setLoading(false);
  };
  const triggerFormBuilder = async () => {
    const currentPath = selectedResource.definition.type;
    const allChildren = getAllChildren(selectedResource, currentPath);
    await buildForm(
      selectedResource?.definition?.snapshot?.element?.[0],
      allChildren,
      fhirDefinitionsService,
      resourcePath,
      resource
    );
  };
  useEffect(() => {
    if (selectedResource) {
      console.log("elementDefinittion", elementDefinition);
      triggerFormBuilder();
    }
  }, [selectedResource]);
  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {},
  });
  console.log("formik", formik);
  if (_.isNil(elementDefinition)) {
    return <span>No element selected</span>;
  }
  const currentPath = elementDefinition?.path;
  const allChildren = getAllChildren(selectedResource, currentPath);
  const currentDepth = elementDefinition?.path.split(".").length;
  // <TypeEditor will either render a node or all top level elements if it's not a root. We need to make that check here
  if (!loading) {
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
  return <div />;
};
export default ElementEditor;
