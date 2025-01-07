import React, { useRef, useState, useEffect, useCallback } from "react";
import { Box } from "@mui/material";
import * as _ from "lodash";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";
import ElementEditorChildren from "./ElementEditorChildren";
import "./ElementEditor.scss";
import {
  FormikConsumer,
  FormikContext,
  useFormikContext,
  useFormik,
  FormikProvider,
} from "formik";
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
  // const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());
  const fhirDefinitionsServiceApi = useFhirDefinitionsServiceApi();
  const fhirDefinitionsService = useRef(fhirDefinitionsServiceApi);
  console.log("elementDefinition", elementDefinition);
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState({});
  const [validationSchema, setValidationSchema] = useState({});
  console.log("initialvalues are", initialValues);
  console.log("validationSchema", validationSchema);

  const buildNode = async (
    child,
    resourcePath,
    fhirDefinitionsService,
    resource,
    nodeList = []
  ) => {
    const type = child?.type?.[0]?.code;
    if (!fhirDefinitionsService.current.isComponentDataType(type)) {
      // Fetch the resource tree asynchronously
      const def = await fhirDefinitionsService.current.getResourceTree(type);
      const elements = fhirDefinitionsService.current.getTopLevelElements(def);

      // Recursively call buildNode for each element
      for (const element of elements) {
        nodeList = await buildNode(
          element,
          resourcePath,
          fhirDefinitionsService,
          resource,
          nodeList
        );
      }

      return nodeList; // Return the aggregated node list
    } else {
      // It's a single node. Add it to the node list
      const required = +child.min > 0;
      const elemPath = fhirDefinitionsService.current.stripResourcePath(
        resourcePath,
        child.path
      );

      const value = _.get(resource, elemPath);
      const builtNode = {
        id: child?.id,
        label: child.path.split(".").pop(),
        value,
        type,
        required,
      };

      return nodeList.concat(builtNode); // Add the single node to the list
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
    console.log("results are", results);
    buildSchemaAndInitialValues(results);
  };

  // given form info, we're going to make an object of schemas and save it to state for formik.
  const buildSchemaAndInitialValues = (formInfo) => {
    const initialValuesObject = {};
    const validationSchemaObject = {};
    for (const key in formInfo) {
      initialValuesObject[key] = formInfo[key].value; // attach value against id
      // may return undefined if we're missing the validation
      const validation = getValidation(formInfo[key].type);
      if (validation) {
        validationSchemaObject[formInfo[key].id] = validation(
          formInfo[key].required
        );
        console.log("validation", validation);
      }
    }
    console.log("schemaObject", validationSchemaObject);
    setInitialValues(initialValuesObject);
    // formik.setValues(initialValues); // Update formik values dynamically
    setValidationSchema(Yup.object().shape(validationSchemaObject));
    // formik.setValidationSchema(validationSchema); //
    setLoading(false);
  };
  const triggerFormBuilder = async () => {
    const currentPath = elementDefinition?.path;
    const allChildren = fhirDefinitionsService?.current?.getAllChildren(
      selectedResource,
      currentPath
    );
    await buildForm(
      elementDefinition,
      allChildren,
      fhirDefinitionsService,
      resourcePath,
      resource
    );
  };
  useEffect(() => {
    if (elementDefinition) {
      console.log("firing");
      triggerFormBuilder();
    }
  }, [elementDefinition?.id]);

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      console.log("values are", values);
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
