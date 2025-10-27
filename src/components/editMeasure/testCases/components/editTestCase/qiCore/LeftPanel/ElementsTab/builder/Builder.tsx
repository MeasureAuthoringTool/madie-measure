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
import { handleCancel, handleRowDelete, handleRowEdit } from "./BuilderUtils";
import "./Builder.scss";
import {
  getTopLevelElements,
  getLastPart,
  buildMadieResourceFromResourceIdentifier,
} from "../../../../../../api/fhirDefinitionServiceUtilities";
import { BundleEntry } from "fhir/r4";
import { ResourceContextProvider } from "./ResourceContext";

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

// prepare data for summary grid by adding profile titles
const prepareSummaryGridData = (
  entries: Array<BundleEntry>,
  resourceIdentifiers: Array<ResourceIdentifier>
) => {
  if (_.isEmpty(entries)) {
    return [];
  }

  return entries?.map((entry: BundleEntry) => {
    const resourceDef = resourceIdentifiers?.find(
      (res) => res.profile === entry.resource.meta?.profile?.[0]
    );
    if (resourceDef) {
      return { entry, title: resourceDef.title };
    }
    return { entry, title: entry.resource.resourceType };
  });
};

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
  const [resourceIdentifiers, setResourceIdentifiers] = useState([]);
  const [resources, setResources] = useState<ResourceIdentifier[]>(null);
  const addedResources = state?.bundle?.entry?.length || 0;
  const [savedGridID, setSavedGridID] = useState(null);
  useEffect(() => {
    const fetchResources = async () => {
      const resourceIdentifiers =
        await fhirDefinitionsService.current.getResources();
      setResourceIdentifiers(resourceIdentifiers);
      fhirElmTranslationService.current
        .fetchRelevantDataElements(measure)
        .then((sdcs) => {
          const relevantTypes = sdcs?.map(
            (relevantElement) => relevantElement.type
          );
          if (!_.isEmpty(resourceIdentifiers)) {
            const uniqueResources = _.uniq(resourceIdentifiers.sort());
            const filteredResources = _.isEmpty(relevantTypes)
              ? uniqueResources
              : uniqueResources.filter(
                  (r) =>
                    relevantTypes.includes(r.type) ||
                    "PATIENT" === r.type.toUpperCase()
                );
            const patientIdx = filteredResources.findIndex(
              (r) => r.id === "qicore-patient"
            );
            let sortedResources = filteredResources;
            if (patientIdx > 0) {
              sortedResources = [
                filteredResources[patientIdx],
                ...filteredResources.slice(0, patientIdx),
                ...filteredResources.slice(patientIdx + 1),
              ];
            }
            setResources(sortedResources);
          }
        });
    };
    fetchResources();
  }, [measure]);

  // check if patient resource is already added
  const isPatientAdded = !!state?.bundle?.entry?.some(
    (e) => e.resource?.resourceType === "Patient"
  );

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
              const newEntry =
                buildMadieResourceFromResourceIdentifier(resourceIdentifier);
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
                    if (element.min === 1 && element.max === "1") {
                      if (element.patternCodeableConcept) {
                        newEntry.resource[getLastPart(element.path)] =
                          element.base.max === "*"
                            ? [element.patternCodeableConcept]
                            : element.patternCodeableConcept;
                      } else if (element.fixedCode) {
                        newEntry.resource[getLastPart(element.path)] =
                          element.base.max === "*"
                            ? [element.fixedCode]
                            : element.fixedCode;
                      }
                    }
                  });
                });
              dispatch({
                type: ResourceActionType.ADD_BUNDLE_ENTRY,
                payload: newEntry,
              });
            }}
            isPatientAdded={isPatientAdded}
          />
        )}
        {activeTab === "Added" && (
          <>
            {selectedResourceID && (
              <ResourceContextProvider value={resourceIdentifiers}>
                <ResourceEditor
                  selectedResourceID={selectedResourceID}
                  setValidationSchema={setValidationSchema}
                  setInitialFormikValuesStu6={setInitialFormikValuesStu6}
                  onCancel={() =>
                    handleCancel(setSelectedResourceId, savedGridID)
                  }
                  canEdit={canEdit}
                />
              </ResourceContextProvider>
            )}
            <TestCaseSummaryGrid
              gridData={prepareSummaryGridData(
                state?.bundle?.entry,
                resourceIdentifiers
              )}
              onRowEdit={(row) =>
                handleRowEdit(row, setSelectedResourceId, setSavedGridID)
              }
              onRowDelete={(row) => handleRowDelete(row, dispatch)}
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
