import React, { useMemo, useRef, useState } from "react";
import CreateCompositeTestCaseLeftPanelNavTabs from "./CreateCompositeTestCaseLeftPanelNavTabs";
import Editor from "../../../editor/Editor";
import CompositeTestCasesTable from "./CompositeTestCasesTable";
import useTestCaseServiceApi from "../../../../api/useTestCaseServiceApi";
import { Measure, TestCase } from "@madie/madie-models";
import {
  MadieAlert,
  MadieSpinner,
  Toast,
} from "@madie/madie-design-system/dist/react";
import "./CompositeLeftPanelContent.scss";
import { FormikProvider, useFormikContext } from "formik";
import ElementsTab from "../LeftPanel/ElementsTab/ElementsTab";
import {
  ResourceActionType,
  useQiCoreResource,
} from "../../../../util/QiCorePatientProvider";
import CompositeProfileViews from "./CompositeProfilesViews";
import ViewTestCaseModal from "./ViewTestCaseModal";
import { buildInsertedProfiles } from "./insertProfilesFromTestCase";
import { isValidJson } from "../EditTestCase";

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
  const [howItWorksOpen, setHowItWorksOpen] = useState<boolean>(false);
  const [viewTestCaseModalOpen, setViewTestCaseModalOpen] =
    useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(
    null
  );
  const { state, dispatch } = useQiCoreResource();
  const formik = useFormikContext<any>();
  const jsonIsValid = isValidJson(editorVal);
  // local state for managing views under available tab

  type AvailableTab = "profiles" | "insert";
  const [availableTab, setAvailableTab] = useState<AvailableTab>("profiles"); // default profileView, allow insertView

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

  const showToast = (message: string, type: "danger" | "success") => {
    setToastOpen(true);
    setToastMessage(message);
    setToastType(type);
  };

  const handleInsertingProfilesIntoTestCase = (selectedTestCase: TestCase) => {
    const currentJson =
      editorVal || formikStu6Context?.values?.json || testCase?.json || "";
    const selectedJson = selectedTestCase?.json || "";

    const insertedProfiles = buildInsertedProfiles(currentJson, selectedJson, {
      measureName: selectedMeasure?.measureName ?? "",
      measureVersion: selectedMeasure?.version ?? "",
      measureId: selectedMeasure?.id ?? "",
      testCaseGroup: selectedTestCase?.series ?? "",
      testCaseTitle: selectedTestCase?.title ?? "",
      testCaseDescription: selectedTestCase?.description ?? "",
      testCaseId: selectedTestCase?.id ?? "",
    });
    const generatedBundle = insertedProfiles?.bundle;
    const componentProfiles = insertedProfiles?.componentProfiles;

    if (!generatedBundle) {
      showToast(
        "Unable to insert profiles from selected testcase into the bundle, please try again later, if the problem persists contact helpdesk",
        "danger"
      );
      return;
    }

    const newTestCaseJson = JSON.stringify(generatedBundle, null, 2);

    // Initial debug visibility for generated payload.
    // eslint-disable-next-line no-console
    console.log("Generated NewTestCase.json", generatedBundle);

    setEditorVal(newTestCaseJson);

    const existingComponentProfiles = Array.isArray(
      formik?.values?.componentProfiles
    )
      ? formik.values.componentProfiles
      : [];
    formik?.setFieldValue(
      "componentProfiles",
      [...existingComponentProfiles, ...(componentProfiles ?? [])],
      false
    );

    if (!dispatch) return;

    // Collect IDs already in the current bundle to avoid re-adding anything that exists.
    const existingIds = new Set<string>(
      state?.bundle?.entry
        ?.map((e) => e?.resource?.id)
        .filter(Boolean) as string[]
    );

    // Add only new non-patient entries (the profiles copied from the selected test case).
    generatedBundle.entry
      ?.filter(
        (entry) =>
          entry?.resource?.resourceType !== "Patient" &&
          !existingIds.has(entry?.resource?.id)
      )
      .forEach((entry) => {
        dispatch({
          type: ResourceActionType.ADD_BUNDLE_ENTRY,
          payload: entry,
        });
      });

    setViewTestCaseModalOpen(false);
    showToast("Profiles were inserted successfully.", "success");
  };

  const handleBackToMeasures = () => {
    setSelectedMeasure(null);
    setTestCases([]);
  };

  const handleViewTestCase = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setViewTestCaseModalOpen(true);
  };

  const validTestCaseIds = useMemo(
    () =>
      new Set(testCases.filter((tc) => tc.validResource).map((tc) => tc.id)),
    [testCases]
  );
  const showAvailableTab = leftPanelActiveTab === "available" && jsonIsValid;

  const showAddedTab = leftPanelActiveTab === "added" && jsonIsValid;

  const showInvalidJson =
    (leftPanelActiveTab === "available" || leftPanelActiveTab === "added") &&
    !jsonIsValid;

  return (
    <>
      <Toast
        toastKey="composite-profile-insert-toast"
        toastType={toastType}
        testId="composite-profile-insert-toast"
        open={toastOpen}
        message={toastMessage}
        onClose={() => {
          setToastOpen(false);
          setToastMessage("");
          setToastType("danger");
        }}
        closeButtonProps={{
          "data-testid": "close-composite-profile-insert-toast",
        }}
        autoHideDuration={6000}
      />
      <div className="tab-container">
        <CreateCompositeTestCaseLeftPanelNavTabs
          leftPanelActiveTab={leftPanelActiveTab}
          setLeftPanelActiveTab={setLeftPanelActiveTab}
          testCaseCanEdit={testCaseCanEdit}
        />
      </div>
      {/* should only display when available and json is valid */}
      {showAvailableTab && (
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
                    validTestCaseIds={validTestCaseIds}
                    selectedMeasure={selectedMeasure}
                    onBackToMeasures={handleBackToMeasures}
                    onInsertProfilesFromTestCase={
                      handleInsertingProfilesIntoTestCase
                    }
                    onViewTestCase={handleViewTestCase}
                  />
                ) : (
                  <>
                    <CompositeProfileViews
                      howItWorksOpen={howItWorksOpen}
                      setAvailableTab={setAvailableTab}
                      setHowItWorksOpen={setHowItWorksOpen}
                      compositeMeasures={compositeMeasures}
                      completedMeasureCount={0}
                      handleSelectTestCase={handleSelectTestCase}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {/* should only display when added and json is valid */}
      {showAddedTab && (
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
      {/* should render when json is invalid and leftpanelActiveTab is either added, or available */}
      {showInvalidJson && (
        <div style={{ width: "98%" }}>
          <MadieAlert
            type="error"
            content={
              <div
                aria-live="polite"
                role="alert"
                data-testid="json-error-alert-div"
                style={{
                  paddingTop: "10px",
                  paddingBottom: "8px",
                }}
              >
                <h3>JSON Failing</h3>
                All JSON errors must be cleared before the UI Builder can be
                used.
              </div>
            }
            alertProps={{
              "data-testid": "json-error-alert",
            }}
            canClose={false}
          />
        </div>
      )}

      {/* should display when leftPanelActiveTab is json */}
      {leftPanelActiveTab === "json" && (
        <Editor
          onChange={(val: string) => setEditorVal(val)}
          value={editorVal}
          readOnly={!testCaseCanEdit}
          height="100%"
        />
      )}

      <ViewTestCaseModal
        open={viewTestCaseModalOpen}
        onClose={() => setViewTestCaseModalOpen(false)}
        testCase={selectedTestCase}
        isInsertEnabled={Boolean(
          selectedTestCase && validTestCaseIds.has(selectedTestCase.id)
        )}
        onInsert={handleInsertingProfilesIntoTestCase}
      />
    </>
  );
};

export default CompositeLeftPanelContent;
