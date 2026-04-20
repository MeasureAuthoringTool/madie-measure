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
  MadieSpinner,
  MadieAlert,
  Toast,
} from "@madie/madie-design-system/dist/react";
import { handleCancel, handleRowDelete, handleRowEdit } from "./BuilderUtils";
import "./Builder.scss";
import {
  getTopLevelElements,
  getLastPart,
  buildMadieResourceFromResourceIdentifier,
} from "../../../../../../api/fhirDefinitionServiceUtilities";
import { BundleEntry } from "fhir/r4";
import { ResourceContextProvider } from "./ResourceContext";

export const NO_PROFILES_MESSAGE =
  "No Profiles have been added to the test case. Navigate to the Available Elements tab to add profiles.";

interface BuilderProps {
  testCase: TestCase;
  canEdit: boolean;
  setInitialFormikValuesStu6: Dispatch<SetStateAction<Object>>;
  setValidationSchema: Dispatch<SetStateAction<Object>>;
  activeTab: string;
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
  activeTab,
}: BuilderProps) => {
  const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());
  const fhirElmTranslationService = useRef(useFhirElmTranslationServiceApi());
  const abortController = useRef(null);
  const { state, dispatch } = useQiCoreResource();
  const { measureState } = useExecutionContext();
  const [measure] = measureState;

  const [selectedResourceID, setSelectedResourceId] = useState<string>(null); // one single source of truth.
  const [resourceIdentifiers, setResourceIdentifiers] = useState([]);
  const [resources, setResources] = useState<ResourceIdentifier[]>([]);
  const [savedGridID, setSavedGridID] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const onToastClose = () => {
    setToastType("danger");
    setToastMessage("");
    setToastOpen(false);
  };
  const ERROR_MULTIPLE_PATIENTS =
    "Builder disabled. Builder is designed to work with a single patient resource. Please remove the extra patient(s) from the JSON to enable Builder support.";
  const ERROR_DUPLICATE_RESOURCE_IDS =
    "Two profiles are currently using the same ID, and the builder requires each profile to have a unique ID. Please update the JSON so that every profile has a distinct ID before proceeding.";
  useEffect(() => {
    const fetchResources = async () => {
      // we want to filter out base fhir resources, by checking if the id does not start with qicore or us-core
      const resourceIdentifiers =
        await fhirDefinitionsService.current.getResources();
      setResourceIdentifiers(resourceIdentifiers);
      abortController.current = new AbortController();
      fhirElmTranslationService.current
        .fetchRelevantDataElements(measure, abortController.current.signal)
        .then((relevantElements) => {
          const profiles = relevantElements?.map(
            (relevantElement) => relevantElement.profile
          );
          if (!_.isEmpty(resourceIdentifiers)) {
            const uniqueResources = _.uniq(resourceIdentifiers.sort());
            const filteredResources = _.isEmpty(profiles)
              ? uniqueResources
              : uniqueResources.filter(
                  (r) =>
                    profiles.includes(r.profile) ||
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
        })
        .finally(() => setResourcesLoading(false));
    };
    fetchResources();
    // Cleanup: abort the request on unmounts or dependencies change
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [measure]);

  useEffect(() => {
    setSelectedResourceId(null);
  }, [activeTab]);

  const displayBuilderAlert = (error: string, dataTestInfo: string) => {
    return (
      <div style={{ margin: "-16px", marginTop: "-32px", marginRight: 0 }}>
        <MadieAlert
          minimizeAlerts={false}
          type="error"
          content={
            <div
              aria-live="polite"
              role="alert"
              data-testid={`json-error-alert-${dataTestInfo}`}
              style={{
                paddingTop: "10px",
                paddingBottom: "8px",
              }}
            >
              <h3>JSON Failing</h3>
              {error}
            </div>
          }
          canClose={false}
        />
      </div>
    );
  };

  const numberOfPatientsAdded = state?.bundle?.entry?.filter(
    (e) => e.resource?.resourceType === "Patient"
  )?.length;
  const isPatientAdded = numberOfPatientsAdded > 0;
  const resourceIds = state?.bundle?.entry?.map((e) => e.resource?.id);
  const duplicateResourceIds = resourceIds?.filter(
    (id, index) => resourceIds.indexOf(id) !== index
  );

  return numberOfPatientsAdded > 1 ? (
    displayBuilderAlert(ERROR_MULTIPLE_PATIENTS, "multiple-patients")
  ) : duplicateResourceIds?.length > 0 ? (
    displayBuilderAlert(ERROR_DUPLICATE_RESOURCE_IDS, "duplicate-resource-ids")
  ) : (
    <Box
      sx={{ mr: 2 }}
      id="qi-core-test-case-builder"
      data-testId="qi-core-test-case-builder"
    >
      <div className="panel-content-pane" id="tc-builder-panel-content-pane">
        {/* available elements that we don't want to display when a resource is selected */}
        {activeTab === "available" &&
          (resourcesLoading ? (
            <div
              data-testid="available-profiles-loading"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "200px",
              }}
            >
              <MadieSpinner style={{ height: 50, width: 50 }} />
            </div>
          ) : (
            canEdit && (
              <ResourceList
                resourceIdentifiers={resources}
                onClick={async (resourceIdentifier: ResourceIdentifier) => {
                  const newEntry =
                    buildMadieResourceFromResourceIdentifier(
                      resourceIdentifier
                    );
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
                  setToastType("success");
                  setToastMessage(
                    `${resourceIdentifier.title} has successfully been applied to the test case. To save your changes please click 'Save'.`
                  );
                  setToastOpen(true);
                }}
                isPatientAdded={isPatientAdded}
              />
            )
          ))}
        {activeTab === "added" && (
          <div style={{ position: "relative", minHeight: "400px" }}>
            {applyLoading && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 1000,
                }}
              >
                <MadieSpinner style={{ height: 50, width: 50 }} />
              </div>
            )}
            <>
              <ResourceContextProvider value={resourceIdentifiers}>
                {_.isEmpty(state?.bundle?.entry) ? (
                  <MadieAlert
                    minimizeAlerts={false}
                    type="warning"
                    content={
                      <p
                        aria-live="polite"
                        role="alert"
                        data-testid="no-profiles-alert"
                      >
                        {NO_PROFILES_MESSAGE}
                      </p>
                    }
                    canClose={false}
                  />
                ) : (
                  <>
                    {selectedResourceID && (
                      <ResourceEditor
                        selectedResourceID={selectedResourceID}
                        setValidationSchema={setValidationSchema}
                        setInitialFormikValuesStu6={setInitialFormikValuesStu6}
                        onCancel={() =>
                          handleCancel(setSelectedResourceId, savedGridID)
                        }
                        canEdit={canEdit}
                        applyLoading={applyLoading}
                        setApplyLoading={setApplyLoading}
                      />
                    )}
                    <TestCaseSummaryGrid
                      gridData={prepareSummaryGridData(
                        state?.bundle?.entry,
                        resourceIdentifiers
                      )}
                      onRowEdit={(row) =>
                        handleRowEdit(
                          row,
                          setSelectedResourceId,
                          setSavedGridID
                        )
                      }
                      onRowDelete={(row) =>
                        handleRowDelete(row, setSelectedResourceId, dispatch)
                      }
                      testCaseCanEdit={canEdit}
                      selectedRowId={selectedResourceID}
                      readOnly={!canEdit}
                    />
                  </>
                )}
              </ResourceContextProvider>
            </>
          </div>
        )}
      </div>
      <Toast
        toastKey="builder-toast"
        aria-live="polite"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "builder-generic-error-text"
            : "builder-success-text"
        }
        closeButtonProps={{
          "data-testid": "close-toast-button",
        }}
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={6000}
      />
    </Box>
  );
};

export default Builder;
