import React, {
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
  useRef,
} from "react";
import { Box, IconButton } from "@mui/material";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ElementEditor from "../element/ElementEditor";
import * as _ from "lodash";
import {
  ResourceActionType,
  useQiCoreResource,
} from "../../../../../../../util/QiCorePatientProvider";
import { ElementDefinition } from "fhir/r4";
import {
  getTopLevelElements,
  getBasePath,
  stripResourcePath,
  getDisplayedElementsTree,
  getElementName,
  removeUndefinedAndEmptyObjects,
  getNestedProperty,
  stripAllIndexes,
  filterUnusedExtensionsFromElements,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import { useFormikContext } from "formik";
import {
  MadieDiscardDialog,
  Tab,
  Tabs,
} from "@madie/madie-design-system/dist/react";
import AddElementDialog from "./AddElementDialog";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";
import tw from "twin.macro";
import "../../../../../../../../../../styles/VerticalSideBarNav.scss";
import "./ResourceEditor.scss";

const InnerWrapper = tw.div`flex-grow flex flex-col`;

interface ResourceEditorProps {
  onCancel: () => void;
  canEdit: boolean;
  setInitialFormikValuesStu6: Dispatch<SetStateAction<Object>>;
  setValidationSchema: Dispatch<SetStateAction<Object>>;
  selectedResourceID: string;
}

// Determines the resource name to display based on the title and base resource name
// e.g. "QI-Core Condition Encounter Diagnosis" or "US Core Condition Encounter Diagnosis" becomes "Condition Encounter Diagnosis"
export const getResourceName = (title: string, baseResourceType: string) => {
  if (!title) {
    return baseResourceType;
  }
  if (title.includes("QI-Core")) {
    return title.replace("QI-Core", "").trim();
  } else if (title.includes("QICore")) {
    return title.replace("QICore", "").trim();
  } else if (title.includes("US Core")) {
    return title.replace("US Core", "").trim();
  } else {
    return title;
  }
};

const ResourceEditor = ({
  selectedResourceID,
  onCancel,
  canEdit,
  setInitialFormikValuesStu6,
  setValidationSchema,
}: ResourceEditorProps) => {
  const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());
  const { dispatch, state } = useQiCoreResource();
  const { dirty, resetForm, values } = useFormikContext();
  const [activeTab, setActiveTab] = useState(0);
  const [pendingTab, setPendingTab] = useState(0);
  const onContinue = () => {
    setDialogOpen(false);
    setActiveTab(pendingTab);
    resetForm();
  };
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);
  const [displayedElementsTree, setDisplayedElementsTree] = useState({});

  const [allElements, setAllElements] = useState([]); // we don't need this.
  const [selectedResource, setSelectedResource] = useState(null);
  const editingResource = selectedResource?.bundleEntry?.resource;
  // We need to know what extensions are being displayed. We need to look closely at the urls
  const [displayedElements, setDisplayedElements] = useState<
    ElementDefinition[]
  >([]);
  const [lastAddedElemPath, setLastAddedElemPath] = useState(null);
  // Using selectedResourceID fetches the selected resource from test case bundle json and
  // also fetches resourceTree aka structure Definition, combines & sets it to SelectedResource state
  // moved two dependant useEffects into a single one to prevent multiple updates. Using batch updates to prevent excessive rerenders
  useEffect(() => {
    // we need to update activePath here instead.
    if (state && selectedResourceID) {
      const selectedEntry = state.bundle?.entry?.find(
        (entry) => entry.resource.id === selectedResourceID
      );
      // at this point we have a selectedEntry that has the correct attribute, but it's formed incorrectly
      const profile = _.isArray(selectedEntry?.resource?.meta?.profile)
        ? selectedEntry?.resource?.meta?.profile[0]
        : selectedEntry?.resource?.meta?.profile;
      const resourceId = profile
        ? profile.substring(profile.lastIndexOf("/") + 1)
        : selectedEntry?.resource?.resourceType;
      fhirDefinitionsService.current
        .getResourceTree(resourceId)
        .then((resourceTree) => {
          const selectedResource = {
            ...resourceTree,
            bundleEntry: selectedEntry,
          };

          const topElements = getTopLevelElements(selectedResource);
          //the topElements from the selectedResource contains elements from resource.definition.snapshot.element

          const requiredElements = [...topElements.filter((e) => e.min > 0)];
          const elementsWithValues = [
            ...topElements.filter((e) => {
              const elemPath = stripResourcePath(
                selectedResource.definition.type,
                e.path
              );
              //let's look at e.path and see if it is a choice type
              //if e.path ends with [x] then we need to check if the resource has a value for that type
              if (elemPath.endsWith("[x]")) {
                //if it does, then we need to check if the resource has a value for that type
                const type = elemPath.substring(
                  elemPath.lastIndexOf("[") + 1,
                  elemPath.lastIndexOf("]")
                );
                const elemPathWithoutType = elemPath.substring(
                  0,
                  elemPath.lastIndexOf("[")
                );

                //let's appent e.type[0].code to the end of the elemPathWithoutType
                const elemPathType = _.camelCase(
                  elemPathWithoutType + _.upperFirst(e.type[0].code)
                );
                //we're going to have to find elementX if type == e.type[0]

                const elemValue = _.get(
                  selectedResource.bundleEntry.resource,
                  elemPathType
                );
                if (!_.isNil(elemValue)) {
                  return true;
                }
              } else {
                const elemValue = _.get(
                  selectedResource.bundleEntry.resource,
                  elemPath
                );
                return !_.isNil(elemValue);
              }
            }),
          ];

          //somewhere in here we need to match attribute[x] with attribute[type]
          //el.path = attribute[x] and then x will equal the type
          // so if there are multiple types, then an attribute becomes a multiple cardinality (ie., attribute[x] with type=[boolean,integer] results in attribute[boolean] and attribute[integer])

          const uniqueElements = _.uniq(
            _.concat(requiredElements, elementsWithValues)
          );
          const elementsModifiedForCardinality = uniqueElements.flatMap(
            (el) => {
              const path = stripResourcePath(
                selectedEntry.resource.resourceType,
                el.id
              );
              const jsonValuesAtPath = selectedEntry.resource[path];
              if (Array.isArray(jsonValuesAtPath) && jsonValuesAtPath.length) {
                // Return a *new* object for each item, with the id modified to include the index
                return jsonValuesAtPath.map((_, index) => ({
                  ...el,
                  id: `${el.id}[${index}]`,
                }));
              } else if (
                // Return a single object with id `[0]` to represent the first element
                Array.isArray(jsonValuesAtPath)
              ) {
                return [{ ...el, id: `${el.id}[0]` }];
              } else {
                // Return a shallow copy of the original element
                return [{ ...el }];
              }
            }
          );
          setSelectedResource(selectedResource);
          setAllElements(topElements);
          const displayedElements = filterUnusedExtensionsFromElements(
            selectedResource,
            elementsModifiedForCardinality
          );
          setDisplayedElements(displayedElements);
          setDisplayedElementsTree(getDisplayedElementsTree(uniqueElements));
          // this is not the best way to do this, but I'm unsure of a better way without a lot more overhead.
          const index = _.findLastIndex(
            elementsModifiedForCardinality,
            (el) => el.path === lastAddedElemPath
          );
          if (index !== -1) {
            // This is for navigating to most recently added multiple cardinality el
            setActiveTab(index);
            setLastAddedElemPath(null);
          }
        })
        .catch((error) =>
          console.error(
            `An error occurred while loading definition for resourceId [${resourceId}]: `,
            error
          )
        );
    }
  }, [selectedResourceID, state, setActiveTab, setLastAddedElemPath]);

  const saveElements = (newValue: ElementDefinition[] | null) => {
    // removed uncessesary reference to modifying displayedElements.
    // Any updates through dispatch will trickle down child component references accordingly.

    const { type } = selectedResource?.definition;
    const formikCleanedValues = removeUndefinedAndEmptyObjects(values);
    const nextEntry = _.cloneDeep(selectedResource.bundleEntry);
    // Update with formik values
    nextEntry.resource = formikCleanedValues[type];
    nextEntry.resource.resourceType = type;
    // Add empty values for new elements
    newValue?.forEach((element) => {
      let elemPath = stripResourcePath(
        selectedResource.definition.type,
        element.path
      );
      // if elemPath ends with ], then we're going to have to find the resource element that has a correct matching type
      const currentValue = _.get(nextEntry.resource, elemPath);

      if (elemPath.endsWith("]") && !elemPath.endsWith("[x]")) {
        //type = the value between the last [ and ]
        const type = elemPath.substring(
          elemPath.lastIndexOf("[") + 1,
          elemPath.lastIndexOf("]")
        );
        const elemPathWithoutType = elemPath.substring(
          0,
          elemPath.lastIndexOf("[")
        );
        // turn elemPath path[type] into pathType
        elemPath = _.camelCase(elemPathWithoutType + _.upperFirst(type));
      }

      if (_.isNil(currentValue)) {
        if (!elemPath.includes("extension:")) {
          if (element.max == "*" || Number(element.max) > 1) {
            _.set(nextEntry.resource, elemPath, []);
          } else {
            _.set(nextEntry.resource, elemPath, "");
          }
        } else {
          const filtered = allElements.filter((ele) =>
            ele.id.includes(elemPath)
          );
          const extension = {
            url: filtered?.[0]?.type?.[0]?.profile?.[0],
            extension: [],
          };
          let extensions = nextEntry.resource.extension
            ? nextEntry.resource.extension
            : [];
          extensions.push(extension);
          nextEntry.resource.extension = extensions;
        }
      }
    });
    // Update resource state
    // There are matching values choice[x] and choiceX  choice.x has the value.  That value needs moved to choiceX and choice.x has to be removed

    dispatch({
      type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
      payload: nextEntry,
    });
  };

  const resourceBasePath = getBasePath(selectedResource);

  return (
    <Box
      className="resource-container"
      id="tc-builder-resource-editor"
      data-testId="tc-builder-resource-editor"
    >
      {selectedResource && (
        <div className="resource-editor">
          <div className="resource-header">
            <Typography>
              {getResourceName(
                selectedResource?.definition?.title,
                resourceBasePath
              )}
            </Typography>
            <div className="spacer" />
            <Typography sx={{ fontSize: "14px" }}>
              <span style={{ color: "125496", fontWeight: 700 }}>
                ID:&nbsp;&nbsp;
              </span>
              <span style={{ color: "#333333" }}>
                {selectedResource?.bundleEntry?.resource?.id}
              </span>
              <div />
              <span style={{ color: "125496", fontWeight: 700 }}>
                Profile:&nbsp;&nbsp;
              </span>
              <span style={{ color: "#333333" }}>
                {selectedResource?.bundleEntry?.resource?.meta?.profile?.[0]
                  ?.match(/\/(qicore|core)\//)
                  .includes("qicore")
                  ? "QICore"
                  : "US Core"}
              </span>
            </Typography>
            <IconButton
              data-testid="close-resource-editor-button"
              onClick={onCancel}
            >
              <CloseIcon sx={{ color: "#D92F2F" }} />
            </IconButton>
          </div>
          <div className="resource-body">
            <div className="side-bar">
              <Box sx={{ p: 1, borderRight: "1px solid #8C8C8C" }}>
                <IconButton
                  onClick={() => setAddDialogOpen(true)}
                  sx={{
                    width: "100%",
                    fontSize: "0.875rem",
                    textTransform: "none",
                    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
                    "&:hover": {
                      backgroundColor: "transparent",
                    },
                    padding: 0,
                    color: "#3171C2",
                  }}
                  data-testid="add-attribute-dialog-button"
                >
                  <AddCircleOutlineIcon sx={{ marginRight: 1 }} />
                  <div>Add Attribute(s)</div>
                </IconButton>
              </Box>
              <div className={"outer-wrapper"}>
                <InnerWrapper
                  className="vertical-side-nav"
                  id="resource-editor-side-nav"
                >
                  <nav aria-label="Sidebar">
                    <Tabs
                      type="C"
                      orientation="vertical"
                      value={activeTab}
                      onChange={(e, newValue) => {
                        if (dirty) {
                          setPendingTab(newValue);
                          setDialogOpen(true);
                        } else {
                          setActiveTab(newValue);
                        }
                      }}
                      aria-label="Resource element tabs"
                    >
                      {displayedElements.map((element, index) => {
                        const elementName = getElementName(
                          element,
                          resourceBasePath,
                          getNestedProperty(values, stripAllIndexes(element.id))
                        );

                        return (
                          <Tab
                            key={index}
                            label={elementName}
                            type="C"
                            id={elementName}
                            data-testid={elementName}
                          />
                        );
                      })}
                    </Tabs>
                  </nav>
                </InnerWrapper>
              </div>
            </div>
            <ElementEditor
              setLastAddedElemPath={setLastAddedElemPath}
              setInitialFormikValuesStu6={setInitialFormikValuesStu6}
              setValidationSchema={setValidationSchema}
              elementDefinition={displayedElements?.[activeTab]}
              selectedResource={selectedResource}
              selectedResourceID={selectedResourceID}
              resource={editingResource}
              resourcePath={resourceBasePath}
              displayedElementsTree={displayedElementsTree}
              onChange={(path, value) => {
                const nextEntry = _.cloneDeep(selectedResource.bundleEntry);
                _.set(nextEntry.resource, path, value);
                dispatch({
                  type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
                  payload: nextEntry,
                });
              }}
              deleteElement={(
                path: string,
                element: any,
                elementName: string
              ) => {
                //So.. if element is an array, we can remove the element at the index of elementName

                if (Array.isArray(element)) {
                  //This is because the name seems to be " *name 2 ".. got a getter way to get the index?
                  //index is 1-based while array is 0-based,
                  deleteMultipleCardinalityElement(
                    elementName,
                    element,
                    selectedResource,
                    path,
                    dispatch
                  );
                } else {
                  const nextEntry = _.cloneDeep(selectedResource.bundleEntry);

                  const strippedPath = path.includes(".")
                    ? path.substring(path.indexOf(".") + 1)
                    : path;
                  //here resource.path refers to an array, where we should be deleting a selected element, instead we should be deleting a single, selected element
                  //  Need to pass the selected element instead of just the path.

                  if (_.has(nextEntry.resource, strippedPath)) {
                    _.unset(nextEntry.resource, strippedPath);
                  } else if (_.has(nextEntry.resource, elementName)) {
                    // choice types need to be removed by name
                    _.unset(nextEntry.resource, elementName);
                  } else {
                    console.error(`Path not found: ${path}`);
                  }
                  dispatch({
                    type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
                    payload: nextEntry,
                  });
                }
              }}
              canEdit={canEdit}
            />
          </div>
        </div>
      )}
      {/* Keep dialogs outside the conditional render */}
      <AddElementDialog
        open={addDialogOpen}
        basePath={resourceBasePath}
        options={allElements}
        value={displayedElements.filter((el) => !el.id.includes("[x]"))} // avoid adding empty choice elements.
        saveElements={saveElements}
        onClose={() => setAddDialogOpen(false)}
      />
      <MadieDiscardDialog
        open={dialogOpen}
        onContinue={onContinue}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  );
};
export function deleteMultipleCardinalityElement(
  elementName: string,
  element: any[],
  selectedResource: any,
  path: string,
  dispatch: React.Dispatch<any>
) {
  const idx: number = parseInt(elementName.split(" ")[2]) - 1;

  if (!isNaN(idx) && idx >= 0 && idx < element.length) {
    // Remove the element at the index
    element.splice(idx, 1);
    // Update the resource with the modified array
    const nextEntry = _.cloneDeep(selectedResource.bundleEntry);
    _.set(nextEntry.resource, path, element);
    dispatch({
      type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
      payload: nextEntry,
    });
  }
}
export default ResourceEditor;
