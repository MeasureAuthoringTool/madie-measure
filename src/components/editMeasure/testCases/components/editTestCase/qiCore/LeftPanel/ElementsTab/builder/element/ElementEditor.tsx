import React, {
  useRef,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { Box } from "@mui/material";
import * as _ from "lodash";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";
import ElementEditorChildren from "./ElementEditorChildren";
import "./ElementEditor.scss";
import * as Yup from "yup";
import { getValidation } from "./typesValidations/fhirR4Validations";
import {
  getTopLevelElements,
  updateChildrenPaths,
  getAllChildren,
  stripResourcePath,
  isComponentDataType,
  setNestedValue,
  removeUndefinedAndEmptyObjects,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import {
  useQiCoreResource,
  ResourceActionType,
} from "../../../../../../../util/QiCorePatientProvider";
import { useFormikContext } from "formik";
import { Button } from "@madie/madie-design-system/dist/react";
import useFormikResetOnEvent from "../../../../../../../../../common/useFormikResetOnEvent";

interface ElementEditorProps {
  resource?: any;
  selectedResource?: any;
  selectedResourceID: string;
  elementDefinition: any;
  resourcePath: string;
  value?: any;
  onChange?: (path: string, value: any) => void;
  canEdit: boolean;
  displayedElementsTree: Object;
  setInitialFormikValuesStu6: Dispatch<SetStateAction<Object>>;
  setValidationSchema: Dispatch<SetStateAction<Object>>;
}
/*
  TO DO: We have too many copies of state.
  Need to do away with either resource or selected resource, or both and just pass in definition. We know what resource we have already from the provider.
  Currently working on dateTime and date validations, and only fixing stale state because it will affect the capacity to test it.
*/
const ElementEditor = ({
  selectedResource, // this will always be a stale reference because we set it one time. we need the id and to look at the provider
  selectedResourceID,
  resource,
  elementDefinition,
  resourcePath,
  onChange,
  canEdit,
  displayedElementsTree,
  setInitialFormikValuesStu6,
  setValidationSchema,
}: ElementEditorProps) => {
  const fhirDefinitionsServiceApi = useFhirDefinitionsServiceApi();
  const fhirDefinitionsService = useRef(fhirDefinitionsServiceApi);
  const [loading, setLoading] = useState(true);
  // We want to dispatch an action that contains a payload of our updated selectedResource.entry
  // The resource reducer will in turn update the testcase json string
  const { dispatch, state } = useQiCoreResource();
  const statefulSelectedResource = state.bundle.entry.find(
    (entry) => entry.resource.id === selectedResourceID
  )?.resource;
  // The reducer that we use in the provider always returns a new object. This allows us to use that object as a reference object in use effects
  // Whenever a javascript object changes it's memory address, it will be seen as a new object and rerender. Mutating objects do not trigger downstream rerenders.
  // We need this reference instead of the selectedResource prop since it's being preserved in state only on selection.
  // This means that when we hit apply, the form appears to revert to it's last saved state, since that was the only time it was retrieved
  // Need to simplify this workflow with less copies of state. Will be too heavy later.

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
      const required = +child?.min > 0;
      const elemPath = child?.path;
      const value = _.get(resource, elemPath);
      const builtNode = {
        id: child?.id,
        label: child?.path.split(".").pop(),
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
      const label = child.path.split(".").pop();

      const builtNode = {
        id: child?.id,
        label,
        value,
        type,
        required,
        validation: getValidation(type, required, label),
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
    // we need to only set the nested value here if
    for (const key in formInfo) {
      const { value, type, validation } = formInfo[key];
      // we need to check and see if the key has a basepath that exists within the displayed elements tree.
      const splitPath: Array<string> = key.split(".");
      //it's a base path, we want it
      if (splitPath.length === 1) {
        setNestedValue(initialValuesObject, key, value);
        setNestedValue(validationSchemaObject, key, validation);
      } else {
        // it's not a base path we need to compare the first two path entries.
        const firstKey = splitPath[0];
        const secondKey = splitPath[1];
        if (displayedElementsTree?.[firstKey]?.[secondKey]) {
          setNestedValue(initialValuesObject, key, value);
          setNestedValue(validationSchemaObject, key, validation);
        }
      }
    }
    setInitialFormikValuesStu6(initialValuesObject);
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
      statefulSelectedResource
    );
  };
  useEffect(() => {
    if (statefulSelectedResource && Object.keys(displayedElementsTree).length) {
      triggerFormBuilder();
    }
  }, [displayedElementsTree, state, selectedResourceID]);
  const formik = useFormikContext();
  useFormikResetOnEvent(formik);
  // on individual apply
  const handleIndividualElementApplyButtonClick = (e) => {
    // this is wrapped in a form and we need to prevent submit on click with e.prevent
    e.preventDefault();
    if (formik.values && formik.dirty) {
      const { type } = selectedResource?.definition;
      const formikCleanedValues = removeUndefinedAndEmptyObjects(formik.values);
      const { bundleEntry } = selectedResource;
      // need type to access formik values, as well as append to to the resource object so it is not lost.
      bundleEntry.resource = formikCleanedValues[type];
      bundleEntry.resource.resourceType = type;
      dispatch({
        type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
        payload: bundleEntry,
      });
    }
  };
  if (_.isNil(elementDefinition)) {
    return <span>No element selected</span>;
  }

  const currentPath = elementDefinition?.path;
  const allChildren = getAllChildren(selectedResource, currentPath);
  const currentDepth = elementDefinition?.path.split(".").length;
  // <TypeEditor will either render a node or all top level elements if it's not a root. We need to make that check here
  if (!loading) {
    return (
      <Box
        sx={{
          padding: "0 24px 24px",
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
          handleIndividualElementApplyButtonClick={
            handleIndividualElementApplyButtonClick
          }
        />
        <div className="element-editor-submission">
          <Button
            variant="outline"
            id="element-editor-undo-button"
            data-testId="element-editor-undo-button"
            disabled={!formik.dirty}
            onClick={formik.resetForm}
          >
            Undo
          </Button>
          <Button
            variant="submit"
            id="element-editor-submit-button"
            data-testId="element-editor-submit-button"
            disabled={!formik.dirty}
            onClick={handleIndividualElementApplyButtonClick}
          >
            Apply
          </Button>
        </div>
      </Box>
    );
  }
  return <div />;
};
export default ElementEditor;
