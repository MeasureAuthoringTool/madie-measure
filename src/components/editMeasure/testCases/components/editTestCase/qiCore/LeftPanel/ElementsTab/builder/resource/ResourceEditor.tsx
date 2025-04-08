import React, {
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
  useRef,
} from "react";
import { Box, Divider, IconButton, Tab, Tabs } from "@mui/material";
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
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import { useFormikContext } from "formik";
import { MadieDiscardDialog } from "@madie/madie-design-system/dist/react";
import AddElementDialog from "./AddElementDialog";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";

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
  const [displayedElementsTree, setDisplayedElementsTree] = useState({}); // need

  const [allElements, setAllElements] = useState([]); // we don't need this.
  const [selectedResource, setSelectedResource] = useState(null);
  const editingResource = selectedResource?.bundleEntry?.resource;
  const [displayedElements, setDisplayedElements] = useState<
    ElementDefinition[]
  >([]);

  // Using selectedResourceID fetches the selected resource from test case bundle json and
  // also fetches resourceTree aka structure Definition, combines & sets it to SelectedResource state
  // moved two dependant useEffects into a single one to prevent multiple updates. Using batch updates to prevent excessive rerenders
  useEffect(() => {
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
          // Will batch update in react 18 update.
          setSelectedResource(selectedResource);
          setAllElements(topElements);
          setDisplayedElements(uniqueElements);
          setDisplayedElementsTree(getDisplayedElementsTree(uniqueElements));
        })
        .catch((error) =>
          console.error(
            `An error occurred while loading definition for resourceId [${resourceId}]: `,
            error
          )
        );
    }
  }, [selectedResourceID, state]);

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
      sx={{
        border: "2px solid gray",
        height: "100%",
      }}
      id="tc-builder-resource-editor"
      data-testId="tc-builder-resource-editor"
    >
      {selectedResource && (
        <>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              p: 1,
            }}
          >
            <Typography>{selectedResource.path}</Typography>
            <Box sx={{ flexGrow: 1 }} />
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
          </Box>
          <Divider />
          <Box
            sx={{
              flexGrow: 1,
              bgcolor: "background.paper",
              display: "flex",
              height: "100%",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", width: 150 }}>
              <Box sx={{ p: 1 }}>
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
                  }}
                  data-testid="add-attribute-dialog-button"
                >
                  <AddCircleOutlineIcon sx={{ color: "#3171C2" }} />
                  <div>Add Attribute(s)</div>
                </IconButton>
              </Box>
              <Tabs
                orientation="vertical"
                variant="scrollable"
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
                sx={{
                  borderRight: 1,
                  borderColor: "divider",
                  "&& .MuiTab-root": {
                    alignItems: "baseline",
                  },
                }}
              >
                {displayedElements?.map((element, index) => (
                  <Tab
                    key={index}
                    sx={{ textAlign: "left" }}
                    label={getElementName(element, resourceBasePath)}
                  />
                ))}
              </Tabs>
            </Box>
            <ElementEditor
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
          </Box>
        </>
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
