import React, { useEffect, useRef, useState } from "react";
import CreateCompositeTestCaseLeftPanelNavTabs from "./CreateCompositeTestCaseLeftPanelNavTabs";
import Editor from "../../../editor/Editor";
import CompositeTestCasesTable from "./CompositeTestCasesTable";
import useTestCaseServiceApi from "../../../../api/useTestCaseServiceApi";
import { Measure, TestCase } from "@madie/madie-models";
import { MadieSpinner } from "@madie/madie-design-system/dist/react";
import "./CompositeLeftPanelContent.scss";
import { FormikProvider } from "formik";
import ElementsTab from "../LeftPanel/ElementsTab/ElementsTab";
import useFhirDefinitionsServiceApi from "../../../../api/useFhirDefinitionsService";
import useFhirElmTranslationServiceApi from "../../../../../../../api/useFhirElmTranslationServiceApi";

import { ResourceIdentifier } from "../../../../api/models/ResourceIdentifier";
import _ from "lodash";
import useExecutionContext from "../../../routes/qiCore/useExecutionContext";
import { useQiCoreResource } from "../../../../util/QiCorePatientProvider";
import CompositeProfileViews from "./CompositeProfilesViews";

const CompositeLeftPanelContent = ({
  leftPanelActiveTab,
  setLeftPanelActiveTab,
  editorVal,
  setEditorVal,
  compositeMeasures,
  testCaseCanEdit,
  formikStu6Context,
  testCase,
  setValidationSchema,
  setInitialFormikValuesStu6,
}) => {
  const testCaseService = useRef(useTestCaseServiceApi());
  const [selectedMeasure, setSelectedMeasure] = useState<Measure | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [completedMeasureCount, setCompletedMeasureCount] = useState(0);
  const [howItWorksOpen, setHowItWorksOpen] = useState<boolean>(false);

  // builder utilities for available elements tab
  const [resources, setResources] = useState<ResourceIdentifier[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());
  // const [resourceIdentifiers, setResourceIdentifiers] = useState([]); // likely needed later when readding features
  const fhirElmTranslationService = useRef(useFhirElmTranslationServiceApi());
  const [selectedResourceID, setSelectedResourceId] = useState<string>(null); // one single source of truth.
  const { measureState } = useExecutionContext();
  const { state, dispatch } = useQiCoreResource();
  const [measure] = measureState;
  const abortController = useRef(null);

  // local state for managing views under available tab

  type AvailableTab = "profiles" | "insert";
  const [availableTab, setAvailableTab] = useState<AvailableTab>("profiles"); // default profileView, allow insertView

  useEffect(() => {
    const fetchResources = async () => {
      // we want to filter out base fhir resources, by checking if the id does not start with qicore or us-core
      const resourceIdentifiers =
        await fhirDefinitionsService.current.getResources();
      // setResourceIdentifiers(resourceIdentifiers); // likely needed later when readding features
      abortController.current = new AbortController();
      fhirElmTranslationService.current
        .fetchRelevantDataElements(measure, abortController.current.signal)
        .then((relevantElements) => {
          const profiles = relevantElements?.map(
            (relevantElement) => relevantElement.profile
          );
          if (!_.isEmpty(resourceIdentifiers)) {
            // "uniq" alone does not prevent duplicates. Correct sorting.
            const uniqueResources = _.uniqBy(
              resourceIdentifiers,
              "profile"
            ).sort((a, b) => a.title.localeCompare(b.title));

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

  const numberOfPatientsAdded = state?.bundle?.entry?.filter(
    (e) => e.resource?.resourceType === "Patient"
  )?.length;
  const isPatientAdded = numberOfPatientsAdded > 0;
  const resourceIds = state?.bundle?.entry?.map((e) => e.resource?.id);
  const duplicateResourceIds = resourceIds?.filter(
    (id, index) => resourceIds.indexOf(id) !== index
  );
  const handleSelectTestCase = async (measure: Measure) => {
    setLoadingTestCases(true);
    setSelectedMeasure(measure);
    try {
      const cases = await testCaseService.current.getTestCasesByMeasureId(
        measure.id
      );
      setTestCases(cases);
    } catch (error) {
      console.error("Failed to fetch test cases:", error);
      setTestCases([]);
    } finally {
      setLoadingTestCases(false);
    }
  };

  const handleBackToMeasures = () => {
    setSelectedMeasure(null);
    setTestCases([]);
  };

  return (
    <>
      <div className="tab-container">
        <CreateCompositeTestCaseLeftPanelNavTabs
          leftPanelActiveTab={leftPanelActiveTab}
          setLeftPanelActiveTab={setLeftPanelActiveTab}
          testCaseCanEdit={testCaseCanEdit}
        />
      </div>

      <div>
        {leftPanelActiveTab === "available" && (
          <div className="panel-content" data-testid="create-panel">
            <div id="elements-panel">
              {availableTab === "profiles" && (
                <div className="panel-content" data-testid="available-panel">
                  <FormikProvider value={formikStu6Context}>
                    <ElementsTab
                      setValidationSchema={setValidationSchema}
                      setInitialFormikValuesStu6={setInitialFormikValuesStu6}
                      setEditorVal={setEditorVal}
                      // currently locking to readOnly MAT-9905
                      canEdit={testCaseCanEdit}
                      editorVal={editorVal}
                      testCase={testCase}
                      activeTab={leftPanelActiveTab}
                      isComposite={true}
                      onInsertTCClick={() => setAvailableTab("insert")}
                    />
                  </FormikProvider>
                </div>
              )}

              {availableTab === "insert" && (
                <>
                  {loadingTestCases ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: 40,
                      }}
                    >
                      <MadieSpinner style={{ height: 50, width: 50 }} />
                    </div>
                  ) : selectedMeasure ? (
                    <CompositeTestCasesTable
                      testCases={testCases}
                      selectedMeasure={selectedMeasure}
                      onBackToMeasures={handleBackToMeasures}
                    />
                  ) : (
                    <>
                      <CompositeProfileViews
                        howItWorksOpen={howItWorksOpen}
                        setAvailableTab={setAvailableTab}
                        setHowItWorksOpen={setHowItWorksOpen}
                        compositeMeasures={compositeMeasures}
                        completedMeasureCount={completedMeasureCount}
                        handleSelectTestCase={handleSelectTestCase}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {leftPanelActiveTab === "added" && (
        <div className="panel-content" data-testid="added-panel">
          <FormikProvider value={formikStu6Context}>
            <ElementsTab
              setValidationSchema={setValidationSchema}
              setInitialFormikValuesStu6={setInitialFormikValuesStu6}
              setEditorVal={setEditorVal}
              // currently locking to readOnly MAT-9905
              canEdit={testCaseCanEdit}
              editorVal={editorVal}
              testCase={testCase}
              activeTab={leftPanelActiveTab}
            />
          </FormikProvider>
        </div>
      )}
      {leftPanelActiveTab === "json" && (
        <Editor
          onChange={(val: string) => setEditorVal(val)}
          value={editorVal}
          readOnly={!testCaseCanEdit}
          height="100%"
        />
      )}
    </>
  );
};

export default CompositeLeftPanelContent;
