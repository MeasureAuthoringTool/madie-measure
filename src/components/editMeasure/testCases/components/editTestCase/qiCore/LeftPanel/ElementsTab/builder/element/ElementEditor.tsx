import React, {
  useRef,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { Box } from "@mui/material";
import _ from "lodash";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";
import ElementEditorChildren from "./ElementEditorChildren";
import "./ElementEditor.scss";
import { getValidation } from "./typesValidations/fhirR4Validations";
import {
  getTopLevelElements,
  updateChildrenPaths,
  getAllChildren,
  stripResourcePath,
  isComponentDataType,
  removeUndefinedProperties,
  mapElementsRequired,
  buildFullValidationSchema,
  shouldSkip,
  buildPrefixSet,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import {
  useQiCoreResource,
  ResourceActionType,
} from "../../../../../../../util/QiCorePatientProvider";
import { useFormikContext } from "formik";
import {
  Button,
  Toast,
  MadieSpinner,
} from "@madie/madie-design-system/dist/react";
import useFormikResetOnEvent from "../../../../../../../../../common/useFormikResetOnEvent";
import { RequiredFieldsProvider } from "./RequiredFieldsContext";

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
  deleteElement?: (path: string, element: any, elementName: string) => void;
  setLastAddedElemPath: (string) => void;
  applyLoading: boolean;
  setApplyLoading: Dispatch<SetStateAction<boolean>>;
}
/*
  TO DO: We have too many copies of state.
  Need to do away with either resource or selected resource, or both and just pass in definition. We know what resource we have already from the provider.
  Currently working on dateTime and date validations, and only fixing stale state because it will affect the capacity to test it.
*/

export function simplifySnapshotElements(data) {
  return data.map(([path, details]) => [
    path,
    {
      id: details.id,
      label: details.label,
      type: details.type,
      binding: details.binding,
      required: details.required,
      canBeMultipleCardinality: details.max === "*",
      max: details.max,
      min: details.min,
      contentReference: details.contentReference,
    },
  ]);
}
const ElementEditor = ({
  setLastAddedElemPath,
  selectedResource, // this will always be a stale reference because we set it one time. we need the id and to look at the provider
  selectedResourceID,
  resource,
  elementDefinition,
  resourcePath,
  canEdit,
  displayedElementsTree,
  setInitialFormikValuesStu6,
  setValidationSchema,
  deleteElement,
  applyLoading,
  setApplyLoading,
}: ElementEditorProps) => {
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const onToastClose = () => {
    setToastType("danger");
    setToastMessage("");
    setToastOpen(false);
  };
  const fhirDefinitionsServiceApi = useFhirDefinitionsServiceApi();
  const fhirDefinitionsService = useRef(fhirDefinitionsServiceApi);
  const [loading, setLoading] = useState(true);
  // We want to dispatch an action that contains a payload of our updated selectedResource.entry
  // The resource reducer will in turn update the testcase json string
  const { dispatch, state } = useQiCoreResource();
  // const statefulSelectedResource = selectedResource.bundleEntry.resource;
  const selectedResourceOnBundleEntry = selectedResource.bundleEntry.resource;
  // The reducer that we use in the provider always returns a new object. This allows us to use that object as a reference object in use effects
  // Whenever a javascript object changes it's memory address, it will be seen as a new object and rerender. Mutating objects do not trigger downstream rerenders.
  // We need this reference instead of the selectedResource prop since it's being preserved in state only on selection.
  // This means that when we hit apply, the form appears to revert to it's last saved state, since that was the only time it was retrieved
  // Need to simplify this workflow with less copies of state. Will be too heavy later.

  // A collection of all labels with without array indeces to serve as constant time lookup in type editor for weather it's required
  const requiredFields = mapElementsRequired(selectedResource); // this includes stuff like name.
  const [formInfo, setFormInfo] = useState(null);

  const buildNode = async (
    child,
    resourcePath,
    resource,
    nodeList = [],
    ctx
  ) => {
    const type = child?.type?.[0]?.code;

    // Check to see if the prefix has been expanded already from previous entries
    const hasInlineChildren = !!ctx?.prefixSet?.has(child?.id);

    if (!isComponentDataType(type)) {
      // Fetch the resource tree asynchronously
      // nesting these ifs to avoid a crash in deeply nested ClaimResponse.item. Might cause issue elsewhere.
      if (type) {
        // snapshot already has child.id.* nodes, do NOT expand by datatype.
        if (!hasInlineChildren) {
          const def = await fhirDefinitionsService.current.getResourceTree(
            type
          );
          if (def) {
            const elements = getTopLevelElements(def, true);
            const updatedElements = updateChildrenPaths(child, elements);
            if (updatedElements) {
              if (ctx?.skipPrefixes) ctx.skipPrefixes.add(child?.id);

              for (const element of updatedElements) {
                nodeList = await buildNode(
                  element,
                  resourcePath,
                  resource,
                  nodeList,
                  ctx // pass ctx through recursion
                );
              }
            }
            const {
              max,
              min,
              type,
              id,
              // need binding for extensions
              binding,
              // need for extension valueElement. Should probably be depreicated
              definition,
              // need for profiledExtension to map Extension children.
              snapshot,
            } = child;
            return nodeList.concat({
              id,
              type: type,
              max,
              required: min > 0,
              binding,
              definition,
              snapshot,
            });
          }
        }
      }

      // This is the edge case for when we're providing the root of the structure like ClaimResponse as it's not a componentDataType and there is no type
      const required = +child?.min > 0;
      const elemPath = child?.path;
      const value = _.get(resource, elemPath); // we need to update this getter.
      const canBeMultipleCardinality = child?.max === "*";
      const builtNode = {
        id: child?.id,
        binding: child?.binding,
        value,
        type: child?.type,
        required,
        validation: null,
        canBeMultipleCardinality,
        max: child.max,
        min: child.min,
        contentReference: child.contentReference,
      };
      return nodeList.concat(builtNode);
    } else {
      // It's a single node. Add it to the node list
      const required = +child.min > 0;
      const elemPath = stripResourcePath(resourcePath, child.path);
      const canBeMultipleCardinality = child?.max === "*";

      const value = _.get(resource, elemPath);
      const label = child.path.split(".").pop(); // should only be used for validation. dont pass

      const builtNode = {
        id: child?.id,
        binding: child?.binding,
        value,
        type: child?.type,
        required,
        validation: getValidation(type, required, label),
        canBeMultipleCardinality,
        snapshot: child.snapshot,
        max: child.max,
        min: child.min,
      };
      return nodeList.concat(builtNode);
    }
  };

  const buildForm = async () => {
    const formInfo = {};
    const nodeList = [];
    const rootDefinition = selectedResource.definition?.snapshot?.element?.[0];
    const resource = selectedResource.bundleEntry?.resource;
    const currentPath = selectedResource.definition?.type;
    const allChildren = getAllChildren(selectedResource, currentPath);
    const allNodes = [rootDefinition, ...allChildren];

    const ids = allNodes.map((n) => n?.id).filter(Boolean);
    const prefixSet = buildPrefixSet(ids);
    const skipPrefixes = new Set();

    // we want to know when we're matching against previously opened branches
    const ctx = { prefixSet, skipPrefixes };

    for (const node of allNodes) {
      // if we expanded a prefix earlier, skip later snapshot children under it to prevent weird ordering / duplicates
      if (shouldSkip(node?.id, skipPrefixes)) continue;

      nodeList.push(
        ...(await buildNode(node, resourcePath, resource, [], ctx))
      );
    }
    for (const builtNode of nodeList) {
      // associate id with form
      formInfo[builtNode.id] = builtNode;
    }
    buildSchemaAndInitialValues(formInfo, resource);
  };

  // we need to know not only the properties that have values,
  // but also the ones that don't since a user can enter values into those fields
  const buildSchemaAndInitialValues = (formInfo, resource) => {
    setFormInfo(simplifySnapshotElements(Object.entries(formInfo)));
    // Get the correct initial values more simply.
    const correctInitialValues = {}; // set a root
    correctInitialValues[resource.resourceType] = {}; // establish root property so we can add more properties to it
    const entries = Object.entries(resource);
    for (const [key, value] of entries) {
      correctInitialValues[resource.resourceType][key] = value;
    }
    const validationSchemaObject = buildFullValidationSchema(
      formInfo,
      resource.resourceType
    );
    setInitialFormikValuesStu6(correctInitialValues);
    setValidationSchema(validationSchemaObject);
    // need a loading toggle or formikProvider dies violently.
    setLoading(false);
  };

  // Whenever the displayedElements list changes in volume, we need to rebuild the form.
  useEffect(() => {
    if (selectedResource) {
      buildForm();
    }
  }, [selectedResource]); // buildForm is excluded because it only uses stable setState functions

  useEffect(() => {
    if (loading) return;

    const scrollTarget = document.getElementById("tc-builder-resource-editor");

    if (!scrollTarget) return;

    if (typeof scrollTarget.scrollIntoView === "function") {
      scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (typeof scrollTarget.scrollTo === "function") {
      scrollTarget.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      scrollTarget.scrollTop = 0;
    }
  }, [elementDefinition?.id, loading]);
  const formik = useFormikContext();
  useFormikResetOnEvent(formik);
  // on individual apply
  const handleIndividualElementApplyButtonClick = (e) => {
    // this is wrapped in a form and we need to prevent submit on click with e.prevent
    e.preventDefault();

    if (formik.values && formik.dirty) {
      setApplyLoading(true);

      // Use setTimeout to allow the spinner to render before processing
      setTimeout(() => {
        try {
          const { type } = selectedResource?.definition;
          const { bundleEntry } = selectedResource;
          const formikCleanedValues = removeUndefinedProperties(formik.values);
          // Preserve existing metadata (id, meta/profile, etc.) while applying cleaned form values.
          const existingResource = bundleEntry.resource || {};
          const cleanedResource = formikCleanedValues?.[type] || {};
          bundleEntry.resource = {
            ...existingResource,
            ...cleanedResource,
            resourceType: type,
          };

          // @ts-ignore
          const { add_new_resources } = formik.values;
          if (add_new_resources && add_new_resources.length > 0) {
            dispatch({
              type: ResourceActionType.ADD_RESOURCE_BY_REFERENCE,
              payload: { bundleEntry, add_new_resources },
            });
          } else {
            dispatch({
              type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
              payload: bundleEntry,
            });
          }
          setToastType("success");
          setToastMessage(
            `${type} has successfully been applied to the test case. To save your changes please click 'Save'.`
          );
          setToastOpen(true);
        } finally {
          // Add a small delay to ensure UI updates before re-enabling the button
          setTimeout(() => {
            setApplyLoading(false);
          }, 150);
        }
      }, 100);
    }
  };
  if (_.isNil(elementDefinition)) {
    return <span>No element selected</span>;
  }

  const currentDepth = elementDefinition?.path.split(".").length;
  // <TypeEditor will either render a node or all top level elements if it's not a root. We need to make that check here
  if (!loading) {
    // prevent render from happening with no provider values
    return (
      <RequiredFieldsProvider
        requiredFields={requiredFields}
        formInfo={formInfo}
      >
        <Box id="element-editor" data-testid="element-editor">
          {/* we need to render not only the current item, but all children */}
          <ElementEditorChildren //recursive render control
            // stuff we need only at the init root
            resourcePath={resourcePath}
            parentStructureDefinition={
              selectedResource?.definition?.snapshot?.element[0]
            }
            setLastAddedElemPath={setLastAddedElemPath}
            selectedResourceID={selectedResourceID}
            rootDefinition={elementDefinition} // only provided at root for a different render
            currentDepth={currentDepth}
            resource={resource}
            canEdit={canEdit}
            deleteElement={deleteElement}
          />
          {canEdit && (
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
                disabled={
                  !formik.dirty ||
                  !!formik.errors[resourcePath]?.[
                    elementDefinition?.path.split(".")[1]
                  ] ||
                  applyLoading
                }
                onClick={handleIndividualElementApplyButtonClick}
              >
                Apply
              </Button>
            </div>
          )}
        </Box>
        <Toast
          toastKey="testcase-attribute-toast"
          aria-live="polite"
          toastType={toastType}
          testId={
            toastType === "danger"
              ? "edit-attribute-generic-error-text"
              : "edit-attribute-success-text"
          }
          closeButtonProps={{
            "data-testid": "close-toast-button",
          }}
          open={toastOpen}
          message={toastMessage}
          onClose={onToastClose}
          autoHideDuration={6000}
        />
      </RequiredFieldsProvider>
    );
  }
  return (
    <div id="madie-tcbuilder-container">
      <MadieSpinner className="madie-spinner" />
    </div>
  );
};
export default ElementEditor;
