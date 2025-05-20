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
          const requiredElements = [...topElements.filter((e) => e.min > 0)];
          const elementsWithValues = [
            ...topElements.filter((e) => {
              const elemPath = stripResourcePath(
                selectedResource.definition.type,
                e.path
              );
              const elemValue = _.get(
                selectedResource.bundleEntry.resource,
                elemPath
              );
              return !_.isNil(elemValue);
            }),
          ];
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
              if (
                jsonValuesAtPath &&
                Array.isArray(jsonValuesAtPath) &&
                jsonValuesAtPath.length
              ) {
                // Return a *new* object for each item, with the id modified to include the index
                return jsonValuesAtPath.map((_, index) => ({
                  ...el,
                  id: `${el.id}[${index}]`,
                }));
              } else {
                //  return the original element
                return [el];
              }
            }
          );

          setSelectedResource(selectedResource);
          setAllElements(topElements);
          setDisplayedElements(elementsModifiedForCardinality);
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
      const elemPath = stripResourcePath(
        selectedResource.definition.type,
        element.path
      );
      const currentValue = _.get(nextEntry.resource, elemPath);
      if (_.isNil(currentValue)) {
        _.set(nextEntry.resource, elemPath, "");
      }
    });
    // Update resource state
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
            <Typography>{resourceBasePath}</Typography>
            <div className="spacer" />
            <Typography sx={{ fontSize: "14px" }}>
              <span style={{ color: "125496", fontWeight: 700 }}>
                ID:&nbsp;&nbsp;
              </span>
              <span style={{ color: "#333333" }}>
                {selectedResource?.bundleEntry?.resource?.id}
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
              <Box sx={{ p: 1, borderRight: "1px solid #333" }}>
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
              deleteElement={(path) => {
                const nextEntry = _.cloneDeep(selectedResource.bundleEntry);
                const strippedPath = path.includes(".")
                  ? path.substring(path.indexOf(".") + 1)
                  : path;
                if (_.has(nextEntry.resource, strippedPath)) {
                  _.unset(nextEntry.resource, strippedPath);
                } else {
                  console.error(`Path not found: ${path}`);
                }
                dispatch({
                  type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
                  payload: nextEntry,
                });
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

export default ResourceEditor;
