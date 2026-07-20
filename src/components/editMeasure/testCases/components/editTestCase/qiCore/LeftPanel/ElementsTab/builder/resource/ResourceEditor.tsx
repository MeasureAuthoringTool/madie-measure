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
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
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
  getElementName,
  formatAttributeLabel,
  removeUndefinedProperties,
  getNestedProperty,
  stripAllIndexes,
  filterUnusedExtensionsFromElements,
  PRIMITIVE_DEFAULT_VALUES,
  isPrimitiveType,
  stripOutUnusedAttributes,
  isMultiCardinalityElement,
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
import { getHl7ProfileLink } from "../../../../../../../../../../utils/hl7Links";
import { Model } from "@madie/madie-models";

const InnerWrapper = tw.div`flex-grow flex flex-col`;

interface ResourceEditorProps {
  onCancel: () => void;
  canEdit: boolean;
  setInitialFormikValuesStu6: Dispatch<SetStateAction<Object>>;
  setValidationSchema: Dispatch<SetStateAction<Object>>;
  selectedResourceID: string;
  applyLoading: boolean;
  setApplyLoading: Dispatch<SetStateAction<boolean>>;
  measureModel?: Model;
}

// Builds the element path used to access values in the resource JSON, with special handling for choice types and array types
// e.g. choice type "Patient.deceased[x]" with type "boolean" becomes "deceasedBoolean"
// e.g. array type "Patient.contact[0]" becomes "contact"
const buildElementPath = (element: ElementDefinition) => {
  const resourceName = element.path.split(".")[0];
  const elemPath = stripResourcePath(resourceName, element.path);
  // for choice types e.g. Patient.deceased[x]
  if (elemPath.endsWith("[x]")) {
    // becomes 'deceased'
    const cleanPath = elemPath.substring(0, elemPath.lastIndexOf("["));

    // append type to element name so that it will be a valid choice type name e.g. 'deceasedBoolean'
    return _.camelCase(cleanPath + _.upperFirst(element.type[0].code));
  }
  return elemPath;
};

const isChoiceTypeElement = (element: ElementDefinition) =>
  element?.id?.endsWith("[x]") || element?.path?.endsWith("[x]");

const getChoiceTypeDisplayLabel = (
  element: ElementDefinition,
  resourceBasePath: string
) => {
  const strippedPath = stripResourcePath(resourceBasePath, element.path);
  const formattedLabel = formatAttributeLabel(strippedPath);
  return strippedPath.endsWith("[x]") ? `${formattedLabel}[x]` : formattedLabel;
};

const getChoiceTypePaths = (element: ElementDefinition): string[] => {
  const resourceName = element.path.split(".")[0];
  const elemPath = stripResourcePath(resourceName, element.path);
  const cleanPath = elemPath.substring(0, elemPath.lastIndexOf("["));

  return (element?.type || []).map((type) =>
    _.camelCase(cleanPath + _.upperFirst(type.code))
  );
};

const hasElementValue = (
  resource: any,
  element: ElementDefinition
): boolean => {
  if (!isChoiceTypeElement(element)) {
    return !_.isUndefined(_.get(resource, buildElementPath(element)));
  }

  return getChoiceTypePaths(element).some(
    (choicePath) => !_.isUndefined(_.get(resource, choicePath))
  );
};

const consolidateTopLevelChoiceTypes = (
  elements: ElementDefinition[]
): ElementDefinition[] => {
  const consolidated = new Map<string, ElementDefinition>();

  elements.forEach((element) => {
    if (!isChoiceTypeElement(element)) {
      consolidated.set(`${element.id}|${element.path}`, element);
      return;
    }

    const key = `${element.id}|${element.path}`;
    const existing = consolidated.get(key);
    if (!existing) {
      consolidated.set(key, {
        ...element,
        type: [...(element.type || [])],
      });
      return;
    }

    existing.type = _.uniqBy(
      [...(existing.type || []), ...(element.type || [])],
      (type) => type.code
    );
    consolidated.set(key, existing);
  });

  return Array.from(consolidated.values());
};

const getChoiceTypePath = (
  element: ElementDefinition,
  typeCode: string
): string => {
  const resourceName = element.path.split(".")[0];
  const elemPath = stripResourcePath(resourceName, element.path);
  const cleanPath = elemPath.substring(0, elemPath.lastIndexOf("["));
  return _.camelCase(cleanPath + _.upperFirst(typeCode));
};

const getSelectedChoiceTypeCode = (
  resource: any,
  element: ElementDefinition
): string | undefined => {
  if (!isChoiceTypeElement(element) || !element?.type?.length) {
    return undefined;
  }

  const matchedType = element.type.find(
    (type) =>
      !_.isUndefined(_.get(resource, getChoiceTypePath(element, type.code)))
  );
  return matchedType?.code;
};

const prioritizeChoiceTypeByResourceValue = (
  element: ElementDefinition,
  resource: any
): ElementDefinition => {
  if (!isChoiceTypeElement(element) || !element?.type?.length) {
    return element;
  }

  const selectedTypeCode = getSelectedChoiceTypeCode(resource, element);
  if (!selectedTypeCode) {
    return element;
  }

  const selectedType = element.type.find(
    (type) => type.code === selectedTypeCode
  );
  if (!selectedType) {
    return element;
  }

  const reorderedTypes = [
    selectedType,
    ...element.type.filter((type) => type.code !== selectedTypeCode),
  ];

  return {
    ...element,
    type: reorderedTypes,
  };
};

const applyChoiceTypeSelectionOrder = (
  elements: ElementDefinition[],
  resource: any
): ElementDefinition[] => {
  return elements.map((element) =>
    prioritizeChoiceTypeByResourceValue(element, resource)
  );
};

const ResourceEditor = ({
  selectedResourceID,
  onCancel,
  canEdit,
  setInitialFormikValuesStu6,
  setValidationSchema,
  applyLoading,
  setApplyLoading,
  measureModel,
}: ResourceEditorProps) => {
  const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());
  const { dispatch, state } = useQiCoreResource();
  const { dirty, resetForm, values } = useFormikContext();
  const [activeTab, setActiveTab] = useState(0);
  // Reset activeTab to 0 whenever a new resource is selected
  useEffect(() => {
    setActiveTab(0);
  }, [selectedResourceID]);
  const [pendingTab, setPendingTab] = useState(0);
  const onContinue = () => {
    setDialogOpen(false);
    resetForm();
    if (pendingTab === -1) {
      onCancel();
    } else {
      setActiveTab(pendingTab);
    }
  };
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);

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
        .getResourceTree(resourceId, measureModel)
        .then((resourceTree) => {
          const selectedResource = {
            ...stripOutUnusedAttributes(resourceTree),
            bundleEntry: selectedEntry,
          };

          const topElements = applyChoiceTypeSelectionOrder(
            consolidateTopLevelChoiceTypes(
              getTopLevelElements(selectedResource)
            ),
            selectedResource.bundleEntry.resource
          );
          //the topElements from the selectedResource contains elements from resource.definition.snapshot.element

          const requiredElements = [...topElements.filter((e) => e.min > 0)];
          const elementsWithValues = [
            ...topElements.filter((e) => {
              // null or empty string/arrays/objects are valid values, so only filter out undefined
              return hasElementValue(selectedResource.bundleEntry.resource, e);
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
                Array.isArray(jsonValuesAtPath) ||
                isMultiCardinalityElement(el)
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
  }, [
    selectedResourceID,
    state,
    setActiveTab,
    setLastAddedElemPath,
    lastAddedElemPath,
  ]);

  const addElements = (elements: ElementDefinition[] | null) => {
    // removed unnecessary reference to modifying displayedElements.
    // Any updates through dispatch will trickle down child component references accordingly.

    const { type } = selectedResource?.definition;
    const formikCleanedValues = removeUndefinedProperties(values);
    const nextEntry = _.cloneDeep(selectedResource.bundleEntry);
    // Update with formik values
    nextEntry.resource = formikCleanedValues[type];
    nextEntry.resource.resourceType = type;
    // Add empty values for new elements
    elements?.forEach((element) => {
      let elemPath = buildElementPath(element);
      const currentValue = _.get(nextEntry.resource, elemPath);
      // Add elements with a default values if they don't already exist in the resource.
      if (_.isUndefined(currentValue)) {
        if (!elemPath.includes("extension:")) {
          let defaultValue: any;
          if (element.max == "*" || Number(element.max) > 1) {
            defaultValue = [
              isPrimitiveType(element?.type?.[0]?.code)
                ? PRIMITIVE_DEFAULT_VALUES[element.type[0].code]
                : {},
            ];
          } else if (isPrimitiveType(element?.type?.[0]?.code)) {
            defaultValue = PRIMITIVE_DEFAULT_VALUES[element.type[0].code];
          } else {
            defaultValue = null;
          }
          _.set(nextEntry.resource, elemPath, defaultValue);
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Typography>
                {selectedResource?.definition?.title
                  ? selectedResource?.definition?.title
                  : resourceBasePath}
              </Typography>
              {selectedResource &&
                (() => {
                  const profile =
                    selectedResource.bundleEntry?.resource?.meta?.profile;
                  const profileId =
                    (Array.isArray(profile) ? profile[0] : profile)
                      ?.split("/")
                      .pop() ||
                    selectedResource.bundleEntry?.resource?.resourceType;
                  const link = getHl7ProfileLink(profileId, measureModel);
                  return (
                    <IconButton
                      data-testid={`edit-hl7-link-${profileId}`}
                      aria-label={`Open HL7 profile for ${profileId}`}
                      onClick={() => {
                        link ? window.open(link, "_blank") : "";
                      }}
                    >
                      <OpenInNewIcon />
                    </IconButton>
                  );
                })()}
            </div>
            <div className="spacer" />
            <Typography sx={{ fontSize: "14px" }}>
              <span style={{ color: "125496", fontWeight: 700 }}>
                ID:&nbsp;&nbsp;
              </span>
              <span style={{ color: "#333333" }}>
                {selectedResource?.bundleEntry?.resource?.id}
              </span>
              <div />
            </Typography>
            <IconButton
              data-testid="close-resource-editor-button"
              onClick={() => {
                if (dirty) {
                  setPendingTab(-1);
                  setDialogOpen(true);
                } else {
                  resetForm();
                  onCancel();
                }
              }}
            >
              <CloseIcon sx={{ color: "#D92F2F" }} />
            </IconButton>
          </div>
          <div className="resource-body">
            <div className="side-bar">
              <Box sx={{ p: 1, borderRight: "1px solid #8C8C8C" }}>
                {canEdit && (
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
                )}
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
                        const elementName = isChoiceTypeElement(element)
                          ? `${
                              element.min > 0 ? " *" : ""
                            }${getChoiceTypeDisplayLabel(
                              element,
                              resourceBasePath
                            )}`
                          : getElementName(
                              element,
                              resourceBasePath,
                              getNestedProperty(
                                values,
                                stripAllIndexes(element.id)
                              )
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
              applyLoading={applyLoading}
              setApplyLoading={setApplyLoading}
              measureModel={measureModel}
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
        value={displayedElements}
        addElements={addElements}
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
  const nextEntry = _.cloneDeep(selectedResource.bundleEntry);
  const strippedPath = path.includes(".")
    ? path.substring(path.indexOf(".") + 1)
    : path;

  // If array is empty, just remove the property entirely
  if (element.length === 0) {
    _.unset(nextEntry.resource, strippedPath);
    dispatch({
      type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
      payload: nextEntry,
    });
    return;
  }

  // Extract index from elementName (e.g., "performer 1 ", " *name 2 ")
  const match = elementName.match(/(\d+)\s*$/);
  let idx: number;

  if (match) {
    idx = parseInt(match[1]) - 1; // Convert 1-based to 0-based
  } else if (element.length === 1) {
    idx = 0; // Single element arrays don't show index in name
  }

  if (idx >= 0 && idx < element.length) {
    const updatedElement = element.filter((_, i) => i !== idx);

    if (updatedElement.length === 0) {
      _.unset(nextEntry.resource, strippedPath);
    } else {
      _.set(nextEntry.resource, strippedPath, updatedElement);
    }

    dispatch({
      type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
      payload: nextEntry,
    });
  }
}
export default ResourceEditor;
