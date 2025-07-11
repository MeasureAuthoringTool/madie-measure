import React, {
  useEffect,
  useRef,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import { Box } from "@mui/material";
import _ from "lodash";
import ResourceList from "./resource/ResourceList";
import TestCaseSummaryGrid from "./grid/TestCaseSummaryGrid";
import { v4 as uuidv4 } from "uuid";
import ResourceEditor from "./resource/ResourceEditor";
import { TestCase } from "@madie/madie-models";
import {
  ResourceActionType,
  useQiCoreResource,
} from "../../../../../../util/QiCorePatientProvider";
import useFhirDefinitionsServiceApi from "../../../../../../api/useFhirDefinitionsService";
import { ResourceIdentifier } from "../../../../../../api/models/ResourceIdentifier";
import useFhirElmTranslationServiceApi from "../../../../../../../../../api/useFhirElmTranslationServiceApi";
import useExecutionContext from "../../../../../routes/qiCore/useExecutionContext";
import {
  Tabs,
  Tab,
  MadieDiscardDialog,
} from "@madie/madie-design-system/dist/react";
import { useFormikContext } from "formik";
import "./Builder.scss";
import {
  getTopLevelElements,
  getLastPart,
} from "../../../../../../api/fhirDefinitionServiceUtilities";
import { ContinuousVariableBoolean } from "../../../../../../api/__mocks__/TestCaseProcessingScenarios";

interface BuilderProps {
  testCase: TestCase;
  canEdit: boolean;
  setInitialFormikValuesStu6: Dispatch<SetStateAction<Object>>;
  setValidationSchema: Dispatch<SetStateAction<Object>>;
}

export function scrollToElementByIdWhenAvailable(
  id: string,
  options: ScrollIntoViewOptions = { behavior: "smooth" },
  checkInterval = 100,
  maxAttempts = 50
) {
  let attempts = 0;

  const interval = setInterval(() => {
    const target = document.getElementById(id);
    attempts++;

    if (target) {
      clearInterval(interval);
      target.scrollIntoView(options);
    } else if (attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, checkInterval);
}

const Builder = ({
  canEdit,
  setInitialFormikValuesStu6,
  setValidationSchema,
}: BuilderProps) => {
  const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());
  const fhirElmTranslationService = useRef(useFhirElmTranslationServiceApi());
  const { state, dispatch } = useQiCoreResource();
  const { measureState } = useExecutionContext();
  const [measure] = measureState;

  // track form dirty and an intermediate tab to know what the discard dialog should nav to
  const { dirty, resetForm } = useFormikContext();
  const [activeTab, setActiveTab] = useState<string>("Available");
  const [pendingTab, setPendingTab] = useState<string>(activeTab);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const onContinue = () => {
    setDialogOpen(false);
    setActiveTab(pendingTab);
    resetForm();
  };

  const [selectedResourceID, setSelectedResourceId] = useState<string>(null); // one single source of truth.
  const [resources, setResources] = useState<ResourceIdentifier[]>(null);
  const addedResources = state?.bundle?.entry.length || 0;

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
            if (dirty) {
              setDialogOpen(true);
              setPendingTab(v);
            } else {
              setActiveTab(v);
            }
          }}
          className="horizontal-nav-tabs"
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
            label={`Added (${addedResources})`}
            data-testid="added-tab"
            value="Added"
          />
        </Tabs>
      </Box>
      <div className="panel-content-pane" id="tc-builder-panel-content-pane">
        {/* available elements that we don't want to display when a resource is selected */}
        {activeTab === "Available" && canEdit && (
          <ResourceList
            resourceIdentifiers={resources}
            onClick={async (resourceIdentifier: ResourceIdentifier) => {
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
              await fhirDefinitionsService.current
                .getResourceTree(resourceIdentifier.id)
                .then((resourceTree) => {
                  const selectedResource = {
                    ...resourceTree,
                    bundleEntry: newEntry,
                  };

                  const topElements = getTopLevelElements(selectedResource);
                  const requiredElements = [
                    ...topElements.filter((e) => e.min > 0),
                  ];

                  requiredElements.forEach((element) => {
                    if (
                      element.min === 1 &&
                      element.max === "1" &&
                      element.patternCodeableConcept
                    ) {
                      newEntry.resource[getLastPart(element.path)] = {
                        ...element.patternCodeableConcept,
                      };
                    }
                  });
                });
              dispatch({
                type: ResourceActionType.ADD_BUNDLE_ENTRY,
                payload: newEntry,
              });
            }}
          />
        )}
        {activeTab === "Added" && (
          <>
            {selectedResourceID && (
              <ResourceEditor
                selectedResourceID={selectedResourceID}
                setValidationSchema={setValidationSchema}
                setInitialFormikValuesStu6={setInitialFormikValuesStu6}
                onCancel={() => setSelectedResourceId(null)}
                canEdit={canEdit}
              />
            )}
            <TestCaseSummaryGrid
              bundle={state?.bundle}
              onRowEdit={(row) => {
                setSelectedResourceId(row?.resource?.id);
                scrollToElementByIdWhenAvailable("tc-builder-resource-editor");
              }}
              onRowDelete={(row) => {
                dispatch({
                  type: ResourceActionType.REMOVE_BUNDLE_ENTRY,
                  payload: row,
                });
              }}
            />
          </>
        )}
      </div>
      <MadieDiscardDialog
        open={dialogOpen}
        onContinue={onContinue}
        onClose={() => {
          setDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default Builder;
