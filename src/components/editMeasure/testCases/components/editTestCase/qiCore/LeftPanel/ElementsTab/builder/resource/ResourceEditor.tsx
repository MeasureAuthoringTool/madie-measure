import React, { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Box, Divider, IconButton, Tab, Tabs } from "@mui/material";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ElementEditor from "../element/ElementEditor";
import ElementSelector from "../element/ElementSelector";
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
interface ResourceEditorProps {
  selectedResource: any;
  onCancel: (resource: any) => void;
  canEdit: boolean;
  setInitialFormikValuesStu6: Dispatch<SetStateAction<Object>>;
  setValidationSchema: Dispatch<SetStateAction<Object>>;
  selectedResourceID: string;
}

const ResourceEditor = ({
  selectedResourceID,
  selectedResource,
  onCancel,
  canEdit,
  setInitialFormikValuesStu6,
  setValidationSchema,
}: ResourceEditorProps) => {
  const { dirty, resetForm, setValues, values } = useFormikContext();
  const [activeTab, setActiveTab] = useState(0);
  const [pendingTab, setPendingTab] = useState(0);
  const [allElements, setAllElements] = useState([]);
  const [displayedElements, setDisplayedElements] = useState<
    ElementDefinition[]
  >([]);
  const [displayedElementsTree, setDisplayedElementsTree] = useState({});
  const [editingResource, setEditingResource] = useState(
    selectedResource?.bundleEntry?.resource
  );
  const { dispatch } = useQiCoreResource();
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);
  const onContinue = () => {
    setDialogOpen(false);
    setActiveTab(pendingTab);
    resetForm();
  };

  const saveElements = (newValue: ElementDefinition[] | null) => {
    setDisplayedElements(newValue ?? []);
    setDisplayedElementsTree(getDisplayedElementsTree(newValue ?? []));

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
    setEditingResource(nextEntry.resource);
    dispatch({
      type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
      payload: nextEntry,
    });
  };
  useEffect(() => {
    if (selectedResource) {
      // TODO: look at the data that exists on the resource and combine fields from that
      const topElements = getTopLevelElements(selectedResource);
      setAllElements(topElements);
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
      setDisplayedElements(uniqueElements);
      setDisplayedElementsTree(getDisplayedElementsTree(uniqueElements));
    } else {
      setAllElements([]);
      setDisplayedElements([]);
    }
  }, [selectedResource]);

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
        <IconButton onClick={() => onCancel(selectedResource)}>
          <CloseIcon sx={{ color: "#D92F2F" }} />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ margin: "16px 16px 0" }}>
        {/* This is our element select multiple select. We need to match this with formik. */}
        {/* <ElementSelector
          basePath={resourceBasePath}
          options={allElements}
          value={displayedElements}
          onChange={(event, newValue: ElementDefinition[] | null) => {
            setDisplayedElements(newValue ?? []);
            setDisplayedElementsTree(getDisplayedElementsTree(newValue ?? []));
          }}
        /> */}
      </Box>
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
            setEditingResource(nextEntry.resource);
            dispatch({
              type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
              payload: nextEntry,
            });
          }}
          canEdit={canEdit}
        />
      </Box>
      <AddElementDialog
        open={addDialogOpen}
        basePath={resourceBasePath}
        options={allElements}
        value={displayedElements}
        saveElements={saveElements}
        onClose={() => {
          setAddDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default ResourceEditor;
