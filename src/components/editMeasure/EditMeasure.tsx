import React, { useEffect, useState, Suspense, useRef } from "react";
import {
  useBlocker,
  Route,
  Routes,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "twin.macro";
import "styled-components/macro";
import EditMeasureNav from "./EditMeasureNav";
import MeasureDetails from "./details/MeasureDetails";
import MeasureEditor from "./editor/MeasureEditor";
import { Measure, Model } from "@madie/madie-models";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import { MadiePatient } from "@madie/madie-patient";
import { measureStore, routeHandlerStore } from "@madie/madie-util";
import { Toast, MadieAlert } from "@madie/madie-design-system/dist/react";
import CreateVersionDialog from "../common/createVersionDialog/CreateVersionDialog";
import InvalidTestCaseDialog from "../common/invalidTestCaseDialog/InvalidTestCaseDialog";

import versionErrorHelper from "../../utils/versionErrorHelper";

import getLibraryNameErrors from "../measureLanding/measureList/InvalidMeasureNameDialog/getLibraryNameErrors";
import DeleteDialog from "./DeleteDialog";
import NotFound from "../notfound/NotFound";
import ReviewInfo from "./reviewInfo/ReviewInfo";
import "./EditMeasure.scss";
import PopulationCriteriaWrapper from "./populationCriteria/PopulationCriteriaWrapper";

import DraftMeasureDialog from "../common/draftMeasureDialog/DraftMeasureDialog";

import ExportDialog from "../measureLanding/measureList/exportDialog/ExportDialog";
import { exportMeasure } from "../../utils/exportUtil";
interface inputParams {
  id: string;
}

const OBJECT_ID_REGEX = /\/[a-f0-9]{24}/g;

export interface RouteHandlerState {
  canTravel: boolean;
  pendingRoute: string;
}
export default function EditMeasure() {
  const { id } = useParams();
  const measureServiceApi = useMeasureServiceApi();
  const { updateMeasure } = measureStore;
  const [loading, setLoading] = useState<boolean>(true);
  let navigate = useNavigate();
  const location = useLocation();
  const [routeHandlerState, setRouteHandlerState] = useState<RouteHandlerState>(
    routeHandlerStore.state
  );

  const [measureId, setMeasureId] = useState<string>(id);

  useEffect(() => {
    const subscription = routeHandlerStore.subscribe(setRouteHandlerState);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const { updateRouteHandlerState } = routeHandlerStore;

  // make reusable component to throw anywhere we want to block navigation..
  const blocker = useBlocker(() => !routeHandlerState.canTravel);
  useEffect(() => {
    if (blocker.location)
      updateRouteHandlerState({
        canTravel: false,
        pendingRoute: blocker?.location?.pathname,
      });
  }, [blocker?.location?.pathname]);

  useEffect(() => {
    if (routeHandlerState.canTravel && blocker.reset) {
      blocker.reset();
    }
  }, [routeHandlerState.canTravel]);

  const loadMeasure = () => {
    measureServiceApi
      .fetchMeasure(measureId)
      .then((value: Measure) => {
        updateMeasure(value);
        setLoading(false);
      })
      .catch((err) => {
        if (err.toString().includes("404")) {
          navigate("/404");
        }
      });
  };

  useEffect(() => {
    loadMeasure();
  }, [measureId]);

  const loadingDiv = <div data-testid="loading">Loading...</div>;

  // Delete utilities
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);

  const [invalidLibraryDialogOpen, setInvalidLibraryDialogOpen] =
    useState<boolean>(false);
  const [invalidLibraryErrors, setInvalidLibraryErrors] = useState<string[]>(
    []
  );
  const [createVersionDialog, setCreateVersionDialog] = useState({
    open: false,
    measureId: "",
  });
  const [draftMeasureDialog, setDraftMeasureDialog] = useState({
    open: false,
  });
  const [versionHelperText, setVersionHelperText] = useState("");
  const [invalidTestCaseOpen, setInvalidTestCaseOpen] =
    useState<boolean>(false);
  const [versionType, setVersionType] = useState<string>(null);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const [measure, setMeasure] = useState<any>(measureStore.state);

  const [downloadState, setDownloadState] = useState(null);
  const [failureMessage, setFailureMessage] = useState(null);
  const abortController = useRef(null);

  useEffect(() => {
    const deleteListener = () => {
      setDeleteOpen(true);
    };
    window.addEventListener("delete-measure", deleteListener, false);
    return () => {
      window.removeEventListener("delete-measure", deleteListener, false);
    };
  }, []);
  useEffect(() => {
    const versionListener = () => {
      setCreateVersionDialog({
        open: true,
        measureId: measure?.id,
      });
    };
    window.addEventListener("version-measure", versionListener, {
      passive: true,
    });
    return () => {
      window.removeEventListener("version-measure", versionListener);
    };
  }, []); // only mount and unmount on initial render

  useEffect(() => {
    const draftListener = () => {
      setDraftMeasureDialog({
        open: true,
      });
    };
    window.addEventListener("draft-measure", draftListener, false);
    return () => {
      window.removeEventListener("draft-measure", draftListener, false);
    };
  }, []);

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const exportListener = async () => {
      try {
        const measure = await measureServiceApi.fetchMeasure(id);
        await exportMeasure(
          setFailureMessage,
          setDownloadState,
          abortController,
          measure,
          measureServiceApi,
          setToastOpen,
          setToastType,
          setToastMessage
        );
      } catch (error) {
        console.error("Error fetching measure:", error);
        setFailureMessage("Failed to fetch measure");
      }
    };
    window.addEventListener("export-measure", exportListener, false);
    return () => {
      window.removeEventListener("export-measure", exportListener, false);
    };
  }, [
    id,
    setFailureMessage,
    setDownloadState,
    abortController,
    measureServiceApi,
    setToastOpen,
    setToastType,
    setToastMessage,
  ]);

  // whenever measureID changes we need to update all pagination items except for limit which should be retained as a user preference
  useEffect(() => {
    return () => {
      const testCasePageOptions = JSON.parse(
        window.localStorage.getItem("testCasesPageOptions")
      );
      localStorage.setItem(
        "testCasesPageOptions",
        JSON.stringify({
          page: 0,
          limit: testCasePageOptions?.limit ? testCasePageOptions?.limit : 10,
          filter: "",
          search: "",
        })
      );
    };
  }, [measureId]);
  const handleCreateError = (error) => {
    const errorData = error?.response;
    setToastOpen(true);
    setLoading(false);
    if (errorData?.status === 400) {
      setToastMessage("Requested measure cannot be versioned");
    } else if (errorData?.status === 403) {
      setToastMessage("User is unauthorized to create a version");
    } else if (errorData?.status === 409) {
      setToastMessage(
        errorData?.data?.message
          ? errorData.data.message
          : "Requested operation could not be completed. Please contact the Help Desk."
      );
    } else {
      setToastMessage(errorData?.message ? errorData.message : "Server error!");
    }
    const message = JSON.parse(errorData?.request?.responseText)?.message;
    if (message) {
      setVersionHelperText(versionErrorHelper(message));
    }
  };
  const handleDialogClose = () => {
    setInvalidLibraryDialogOpen(false);
    setInvalidTestCaseOpen(false);
    setCreateVersionDialog({
      open: false,
      measureId: "",
    });
    setDraftMeasureDialog({
      open: false,
    });
    setInvalidLibraryErrors([]);
    setVersionHelperText("");
  };
  const createVersion = (versionType: string) => {
    setLoading(true);
    return measureServiceApi
      .createVersion(measure.id, versionType)
      .then((r) => {
        handleDialogClose();
        setToastOpen(true);
        setToastType("success");
        setLoading(false);
        setToastMessage("New version of measure is Successfully created");
        loadMeasure();
      })
      .catch((error) => {
        handleCreateError(error);
      });
  };
  // given a version and target, check if possible
  const checkCreateVersion = async (versionType: string) => {
    setLoading(true);
    if (
      versionType !== "major" &&
      versionType !== "minor" &&
      versionType !== "patch"
    ) {
      setCreateVersionDialog({
        open: true,
        measureId: measure.id,
      });
      setLoading(false);
    } else {
      await measureServiceApi
        .checkValidVersion(measure.id, versionType)
        .then(async (successResponse) => {
          setLoading(false);
          // if we get a 202, we have invalid test cases, but no other issues so we can create it
          if (successResponse?.status === 202) {
            setVersionType(versionType);
            setInvalidTestCaseOpen(true);
          }
          // we assume standard 200 success case, we create the version
          else {
            createVersion(versionType);
          }
        })
        .catch((error) => {
          handleCreateError(error);
          setLoading(false);
        });
    }
  };
  // intermediary validation step before we check if we can create version
  const checkValidCqlLibraryName = async (versionType: string) => {
    setLoading(true);
    try {
      const result = await measureServiceApi?.fetchMeasure(measure.id);
      if (result) {
        const { cqlLibraryName, model } = result;
        const errorResults = getLibraryNameErrors(
          cqlLibraryName,
          model as Model
        );
        if (errorResults.length > 0) {
          setInvalidLibraryErrors(errorResults);
          setInvalidLibraryDialogOpen(true);
          setCreateVersionDialog((prevState) => ({
            ...prevState,
            open: false,
          }));
        } else {
          checkCreateVersion(versionType);
        }
      }
    } catch (e) {
      setToastMessage(
        "An error occurred, please try again. If the error persists, please contact the help desk."
      );
      setLoading(false);
    }
  };
  const draftMeasure = async (measureName: string, model: Model) => {
    await measureServiceApi
      .draftMeasure(measure.id, model, measureName)
      .then(async (response) => {
        // remove the old ids from url and split urls into parts
        // e.g. /measures/673f9da22d51c65a00afb8a2/edit/test-cases/list-page/673f9da22d51c65a00afb89f
        const routeParts = location.pathname
          .replace(OBJECT_ID_REGEX, "")
          .split("/edit");
        // results into ["/measures", "/test-cases/list-page"]
        const subRoute = routeParts.length > 1 ? routeParts[1] : "";
        handleDialogClose();
        setToastOpen(true);
        setToastType("success");
        setToastMessage("New draft created successfully.");
        setMeasureId(response.data.id);
        setTimeout(() => {
          navigate(`/measures/${response.data.id}/edit${subRoute}`);
        }, 3000);
      })
      .catch((error) => {
        const errorOb = error?.response?.data;
        setToastOpen(true);
        if (errorOb?.message) {
          setToastMessage(errorOb.message);
        } else {
          setToastMessage(
            "An error occurred, please try again. If the error persists, please contact the help desk."
          );
        }
      });
  };
  const deleteMeasure = async () => {
    const deletedMeasure: Measure = { ...measure, active: false };
    try {
      const result = await measureServiceApi.updateMeasure(deletedMeasure);
      if (result.status === 200) {
        handleToast("success", "Measure successfully deleted", true);
        setTimeout(() => {
          navigate("/measures");
        }, 3000);
      }
    } catch (e) {
      if (e?.response?.data) {
        const { error, status, message } = e.response.data;
        const errorMessage = `${status}: ${error} ${message}`;
        setErrorMessage(errorMessage);
        setDeleteOpen(false);
      } else {
        setErrorMessage(e.toString());
        setDeleteOpen(false);
      }
    }
  };
  const onToastClose = () => {
    setToastType("danger");
    setToastMessage("");
    setToastOpen(false);
  };
  const handleToast = (type, message, open) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(open);
  };
  const handleContinueDialog = () => {
    setDownloadState(null);
    setFailureMessage(null);
  };
  const handleCancelDialog = () => {
    abortController.current && abortController.current.abort();
    handleContinueDialog();
  };
  // At this time it appears only possible to have a single error at a time because of the way state is updated.
  const [errorMessage, setErrorMessage] = useState<string>("");
  const isQDM = measure?.model?.includes("QDM");
  const contentDiv = (
    <div data-testid="editMeasure">
      <div tw="relative" style={{ marginTop: "-60px" }}>
        <EditMeasureNav isQDM={isQDM} />
        <div
          style={{
            marginLeft: "2rem",
            marginRight: "2rem",
            marginTop: 16,
          }}
        >
          {errorMessage && (
            <MadieAlert
              type="error"
              content={
                <>
                  <h5 tw="py-1">Error found</h5>
                  <p data-testid="edit-measure-alert">{errorMessage}</p>
                </>
              }
              canClose={false}
            />
          )}
        </div>
        <Routes>
          {/* root nav links with wild card operators. We always want these displayed regardless of deeper navigation */}
          <Route
            path="/details/*"
            element={
              <MeasureDetails setErrorMessage={setErrorMessage} isQDM={isQDM} />
            }
          />
          <Route path={`/cql-editor`} element={<MeasureEditor />} />
          <Route path={`/test-cases/*`} element={<MadiePatient />} />
          <Route
            path={`/groups/:groupNumber`}
            element={<PopulationCriteriaWrapper />}
          />
          <Route
            path={`/supplemental-data`}
            element={<PopulationCriteriaWrapper />}
          />
          <Route
            path={`/risk-adjustment`}
            element={<PopulationCriteriaWrapper />}
          />
          <Route
            path={`/base-configuration`}
            element={<PopulationCriteriaWrapper />}
          />
          <Route path={`/reporting`} element={<PopulationCriteriaWrapper />} />
          <Route path={`/review-info`} element={<ReviewInfo />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        measureName={measure?.measureName}
        deleteMeasure={deleteMeasure}
      />

      <InvalidTestCaseDialog
        open={invalidTestCaseOpen}
        onContinue={createVersion}
        onClose={handleDialogClose}
        versionType={versionType}
        loading={loading}
      />
      <DraftMeasureDialog
        open={draftMeasureDialog.open}
        onClose={handleDialogClose}
        onSubmit={draftMeasure}
        measure={measure}
      />
      <CreateVersionDialog
        currentVersion={measure?.version}
        open={createVersionDialog.open}
        onClose={handleDialogClose}
        onSubmit={checkValidCqlLibraryName}
        versionHelperText={versionHelperText}
        loading={loading}
        measureId={measure?.id}
      />
      <ExportDialog
        failureMessage={failureMessage}
        measureName={measure?.measureName}
        downloadState={downloadState}
        open={Boolean(downloadState)}
        handleContinueDialog={handleContinueDialog}
        handleCancelDialog={handleCancelDialog}
      />
      <Toast
        toastKey="measure-information-toast"
        aria-live="polite"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "edit-measure-information-generic-error-text"
            : "edit-measure-information-success-text"
        }
        closeButtonProps={{
          "data-testid": "close-error-button",
        }}
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={6000}
      />
    </div>
  );

  return loading ? loadingDiv : contentDiv;
}
