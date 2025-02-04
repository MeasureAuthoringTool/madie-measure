import React, { useEffect, useRef, useState } from "react";
import { Box, Divider, IconButton, Tab, Tabs } from "@mui/material";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
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
} from "../../../../../../../api/fhirDefinitionServiceUtilities";

interface ResourceEditorProps {
  selectedResource: any;
  onCancel: (resource: any) => void;
  canEdit: boolean;
}

/**
 * Prepares the element name to be displayed for tab labels
 * for sliced elements- it will be sliceName. e.g. Patient.extension:race results into race
 * for regular element- it will be the path of an element. e.g. Patient.gender results gender
 */
const getElementName = (element: ElementDefinition, basePath: string) => {
  const requiredIndicator = element.min > 0 ? " *" : "";
  if (element.sliceName) {
    return `${element.sliceName}${requiredIndicator}`;
  }
  return `${element.path.substring(basePath.length + 1)}${requiredIndicator}`;
};

const ResourceEditor = ({
  selectedResource,
  onCancel,
  canEdit,
}: ResourceEditorProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [allElements, setAllElements] = useState([]);
  const [displayedElements, setDisplayedElements] = useState<
    ElementDefinition[]
  >([]);
  const [displayedElementsTree, setDisplayedElementsTree] = useState({});
  const [editingResource, setEditingResource] = useState(
    selectedResource?.bundleEntry?.resource
  );
  const { dispatch } = useQiCoreResource();
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
        <Typography>
          ID: {selectedResource?.bundleEntry?.resource?.id}
        </Typography>
        <IconButton onClick={() => onCancel(selectedResource)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ m: 2 }}>
        {/* This is our element select multiple select. We need to match this with formik. */}
        <ElementSelector
          basePath={resourceBasePath}
          options={allElements}
          value={displayedElements}
          onChange={(event, newValue: ElementDefinition[] | null) => {
            setDisplayedElements(newValue ?? []);
            setDisplayedElementsTree(getDisplayedElementsTree(newValue ?? []));
          }}
        />
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: "background.paper",
          display: "flex",
          height: "100%",
        }}
      >
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={activeTab}
          onChange={(e, newValue) => {
            setActiveTab(newValue);
          }}
          aria-label="Resource element tabs"
          sx={{
            borderRight: 1,
            borderColor: "divider",
            "&& .MuiTab-root": {
              alignItems: "baseline",
            },
            width: 150,
          }}
        >
          {displayedElements?.map((element) => {
            return (
              <Tab
                sx={{ textAlign: "left" }}
                label={getElementName(element, resourceBasePath)}
              />
            );
          })}
        </Tabs>
        <ElementEditor
          elementDefinition={displayedElements?.[activeTab]}
          selectedResource={selectedResource}
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
    </Box>
  );
};

export default ResourceEditor;
