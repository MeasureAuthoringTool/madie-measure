import React, { useEffect, useRef, useState } from "react";
import { Box, Divider } from "@mui/material";
import * as _ from "lodash";
import ResourceList from "./resource/ResourceList";
import TestCaseSummaryGrid from "./grid/TestCaseSummaryGrid";
import Typography from "@mui/material/Typography";
import { v4 as uuidv4 } from "uuid";
import ResourceEditor from "./resource/ResourceEditor";
import { TestCase } from "@madie/madie-models";
import {
  ResourceActionType,
  useQiCoreResource,
} from "../../../../../../util/QiCorePatientProvider";
import useFhirDefinitionsServiceApi from "../../../../../../api/useFhirDefinitionsService";
import { ResourceIdentifier } from "../../../../../../api/models/ResourceIdentifier";
import useFhirElmTranslationServiceApi, {
  SourceDataCriteria,
} from "../../../../../../../../../api/useFhirElmTranslationServiceApi";
import useExecutionContext from "../../../../../routes/qiCore/useExecutionContext";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
import "./Builder.scss";

interface BuilderProps {
  testCase: TestCase;
  canEdit: boolean;
}

const Builder = ({ testCase, canEdit }: BuilderProps) => {
  const [resources, setResources] = useState<ResourceIdentifier[]>(null);
  const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());
  const fhirElmTranslationService = useRef(useFhirElmTranslationServiceApi());
  const [activeResource, setActiveResource] = useState(null);
  const [activeDefinition, setActiveDefinition] = useState(null);
  const { state, dispatch } = useQiCoreResource();
  const { measureState } = useExecutionContext();
  const [measure] = measureState;

  useEffect(() => {
    const resourcesPromise = fhirDefinitionsService.current.getResources();
    const relevantElementsPromise =
      fhirElmTranslationService.current.fetchRelevantDataElements(measure);
    Promise.all([resourcesPromise, relevantElementsPromise]).then(
      ([resources, sdcs]) => {
        const relevantTypes = sdcs?.map(
          (relevantElement) => relevantElement.type
        );
        if (!_.isEmpty(resources)) {
          const uniqueResources = _.uniq(resources.sort());
          const filteredResources = _.isEmpty(relevantTypes)
            ? uniqueResources
            : uniqueResources.filter(
                (r) =>
                  relevantTypes.includes(r.type) ||
                  "PATIENT" === r.type.toUpperCase()
              );
          setResources(filteredResources);
        }
      }
    );
  }, []);

  const handleResourceSelected = async (bundleEntry: any) => {
    const profile = _.isArray(bundleEntry?.resource?.meta?.profile)
      ? bundleEntry?.resource?.meta?.profile[0]
      : bundleEntry?.resource?.meta?.profile;
    const resourceId = profile
      ? profile.substring(profile.lastIndexOf("/") + 1)
      : bundleEntry?.resource?.resourceType;
    const resourceTree = await fhirDefinitionsService.current.getResourceTree(
      resourceId
    );
    const resource = { ...resourceTree, bundleEntry };
    setActiveResource(resource);
    setActiveDefinition({ ...resourceTree });
  };

  const [activeTab, setActiveTab] = useState<string>("Available");

  return (
    <Box
      sx={{ mr: 2 }}
      id="qi-core-test-case-builder"
      data-testId="qi-core-test-case-builder"
    >
      <Box>
        <Tabs
          value={activeTab}
          onChange={(e, v) => {
            setActiveTab(v);
          }}
          type="B"
          orientation="horizontal"
        >
          <Tab
            type="B"
            tabIndex={0}
            aria-label="Available elements tab panel"
            label={"Available"}
            data-testid="available-tab"
            value="Available"
          />
          <Tab
            type="B"
            tabIndex={0}
            aria-label="Added elements tab panel"
            label={`Added ${0}`}
            data-testid="added-tab"
            value="Added"
          />
        </Tabs>
      </Box>
      <div className="panel-content-pane">
        {activeTab === "Available" && !activeResource && canEdit && (
          <>
            <ResourceList
              resourceIdentifiers={resources}
              onClick={(resourceIdentifier: ResourceIdentifier) => {
                const id = uuidv4();
                const newEntry = {
                  fullUrl: `https://madie.cms.gov/${resourceIdentifier.type}/${id}`,
                  resource: {
                    id,
                    resourceType: resourceIdentifier.type,
                  },
                };
                if (!_.isEmpty(resourceIdentifier.profile)) {
                  newEntry.resource["meta"] = {
                    profile: [resourceIdentifier.profile],
                  };
                }
                dispatch({
                  type: ResourceActionType.ADD_BUNDLE_ENTRY,
                  payload: newEntry,
                });
              }}
            />
            {activeResource && (
              <ResourceEditor
                selectedResource={activeResource}
                selectedResourceDefinition={activeDefinition}
                onSave={(resource) => {}}
                onCancel={(resource) => {
                  setActiveResource(null);
                }}
                canEdit={canEdit}
              />
            )}
          </>
        )}
        {activeTab === "Added" && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h5">Resources</Typography>
            <Divider sx={{ mb: 1 }} />
            <TestCaseSummaryGrid
              bundle={state?.bundle}
              onRowEdit={(row) => {
                handleResourceSelected(row);
              }}
              onRowDelete={(row) => {
                dispatch({
                  type: ResourceActionType.REMOVE_BUNDLE_ENTRY,
                  payload: row,
                });
                setActiveResource(null);
              }}
            />
          </Box>
        )}
      </div>
    </Box>
  );
};

export default Builder;
