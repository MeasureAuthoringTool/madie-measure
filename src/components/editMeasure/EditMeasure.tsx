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

import {
  measureStore,
  routeHandlerStore,
  useMeasureServiceApi,
  checkUserCanEdit,
  useUserRoles,
  useOktaTokens,
} from "@madie/madie-util";
import CreateVersionDialog from "../common/createVersionDialog/CreateVersionDialog";
import InvalidTestCaseDialog from "../common/invalidTestCaseDialog/InvalidTestCaseDialog";

import versionErrorHelper from "../../utils/versionErrorHelper";

import getLibraryNameErrors from "../measureLanding/measureList/InvalidMeasureNameDialog/getLibraryNameErrors";
import {
  Toast,
  MadieAlert,
  MadieDiscardDialog,
  MadieSpinner,
} from "@madie/madie-design-system/dist/react";
import DeleteDialog from "./DeleteDialog";
import NotFound from "../notfound/NotFound";
import ReviewInfo from "./reviewInfo/ReviewInfo";
import "./EditMeasure.scss";
import PopulationCriteriaWrapper from "./populationCriteria/PopulationCriteriaWrapper";

import DraftMeasureDialog from "../common/draftMeasureDialog/DraftMeasureDialog";

import ExportDialog from "../measureLanding/measureList/exportDialog/ExportDialog";
import { exportMeasure } from "../../utils/exportUtil";
import TestCases from "./testCases/TestCases";
import { AxiosResponse } from "axios";
import ViewHRModal from "../common/viewHumanReadableModal/ViewHRModal";
import ShareDialog from "../common/shareDialog/ShareDialog";
import TransferDialog from "../common/transferDialog/TransferDialog";
import ViewMeasureHistoryDialog from "../common/viewMeasureHistoryDialog/ViewMeasureHistoryDialog";
import StatusHandler, { INITIAL_STATUS_HANDLER } from "./editor/StatusHandler";

const OBJECT_ID_REGEX = /\/[a-f0-9]{24}/g;

export interface RouteHandlerState {
  canTravel: boolean;
  pendingRoute: string;
}
export default function EditMeasure() {
  const { measureId } = useParams();
  const measureServiceApi = useMeasureServiceApi();
  const { updateMeasure } = measureStore;
  const [loading, setLoading] = useState<boolean>(true);
  let navigate = useNavigate();
  const location = useLocation();
  const [currentMeasureId, setCurrentMeasureId] = useState<string>(measureId);
  const userRoles = useUserRoles();

  // Required by every single spa application that has internal routing
  // This will block user from navigating inside madie-measure when the current form is dirty
  const { updateRouteHandlerState } = routeHandlerStore;
  const [routeHandlerState, setRouteHandlerState] = useState<RouteHandlerState>(
    routeHandlerStore.state
  );
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  useEffect(() => {
    const subscription = routeHandlerStore.subscribe(setRouteHandlerState);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (
      !routeHandlerState?.canTravel &&
      currentLocation.pathname !== nextLocation.pathname
    ) {
      setDialogOpen(true);
      return true;
    }
    setDialogOpen(false);
    return false;
  });
  const onContinue = () => {
    setDialogOpen(false);
    updateRouteHandlerState({
      canTravel: true,
      pendingRoute: "",
    });
    blocker.proceed();
  };
  const onClose = () => {
    setDialogOpen(false);
    blocker.reset();
  };

  useEffect(() => {
    if (currentMeasureId) {
      loadMeasure();
    }
  }, [currentMeasureId]);

  const loadMeasure = () => {
    measureServiceApi
      .fetchMeasure(currentMeasureId)
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

  // Delete utilities
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [shareDialog, setShareDialog] = useState({ open: false, option: "" });
  const [createVersionDialog, setCreateVersionDialog] = useState({
    open: false,
    measureId: "",
  });
  const [draftMeasureDialog, setDraftMeasureDialog] = useState({
    open: false,
  });
  const [viewHumanReadableModal, setViewHumanReadableModal] = useState({
    open: false,
    measureId: "",
  });
  const [transferDialog, setTransferDialog] = useState({
    open: false,
    measures: [],
    isAdminTransfer: false,
  });
  const [viewMeasureHistoryDialog, setViewMeasureHistoryDialog] =
    useState(false);

  const [versionHelperText, setVersionHelperText] = useState("");
  const [invalidTestCaseOpen, setInvalidTestCaseOpen] =
    useState<boolean>(false);
  const [versionType, setVersionType] = useState<string>(null);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const [statusHandler, setStatusHandler] = useState(INITIAL_STATUS_HANDLER);
  const [measure, setMeasure] = useState<any>(measureStore.state);

  const [downloadState, setDownloadState] = useState(null);
  const [failureMessage, setFailureMessage] = useState(null);
  const abortController = useRef(null);

  const measureCanEdit: boolean = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );

  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const measureLockedBy =
    measure?.measureLock?.lockedBy?.toLowerCase() !== userName.toLowerCase()
      ? measure?.measureLock?.lockedBy
      : undefined;

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
    const shareListener = () => {
      setShareDialog({
        open: true,
        option: "Share With",
      });
    };
    window.addEventListener("share-measure", shareListener, {
      passive: true,
    });
    return () => {
      window.removeEventListener("share-measure", shareListener);
    };
  }, []);

  useEffect(() => {
    const unshareListener = () => {
      setShareDialog({
        open: true,
        option: "Unshare",
      });
    };
    window.addEventListener("unshare-measure", unshareListener, {
      passive: true,
    });
    return () => {
      window.removeEventListener("unshare-measure", unshareListener);
    };
  }, []);

  useEffect(() => {
    const unshareFromMeListener = () => {
      setShareDialog({
        open: true,
        option: "UnshareFromMe",
      });
    };
    window.addEventListener("unshare-measure-from-me", unshareFromMeListener, {
      passive: true,
    });
    return () => {
      window.removeEventListener(
        "unshare-measure-from-me",
        unshareFromMeListener
      );
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
    const transferListener = () => {
      // Check if user is admin and doesn't own the measure
      const isOwner = checkUserCanEdit(measure?.measureSet?.owner, []);
      const isAdminTransfer = userRoles?.isAdmin && !isOwner;
      setTransferDialog({
        open: true,
        measures: [measure],
        isAdminTransfer: isAdminTransfer,
      });
    };
    window.addEventListener("transfer-measure", transferListener, false);
    return () => {
      window.removeEventListener("transfer-measure", transferListener, false);
    };
  }, [measure, userRoles]);

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const exportListener = async (event: CustomEvent) => {
      if (event instanceof CustomEvent && event.detail) {
        const { elmErrorSeverity } = event.detail;
        try {
          const measure = await measureServiceApi.fetchMeasure(measureId);
          await exportMeasure(
            setFailureMessage,
            setDownloadState,
            abortController,
            measure,
            measureServiceApi,
            setToastOpen,
            setToastType,
            setToastMessage,
            elmErrorSeverity
          );
        } catch (error) {
          console.error("Error fetching measure:", error);
          setFailureMessage("Failed to fetch measure");
        }
      }
    };
    window.addEventListener("export-measure", exportListener, false);
    return () => {
      window.removeEventListener("export-measure", exportListener, false);
    };
  }, [
    measureId,
    setFailureMessage,
    setDownloadState,
    abortController,
    measureServiceApi,
    setToastOpen,
    setToastType,
    setToastMessage,
  ]);

  useEffect(() => {
    const viewHRListener = () => {
      setViewHumanReadableModal({
        open: true,
        measureId: measure?.id,
      });
    };
    window.addEventListener("view-humanreadable", viewHRListener, {
      passive: true,
    });
    return () => {
      window.removeEventListener("view-humanreadable", viewHRListener);
    };
  }, []);

  useEffect(() => {
    const viewMeasureHistoryListener = () => {
      setViewMeasureHistoryDialog(true);
    };
    window.addEventListener(
      "view-measure-history",
      viewMeasureHistoryListener,
      {
        passive: true,
      }
    );
    return () => {
      window.removeEventListener(
        "view-measure-history",
        viewMeasureHistoryListener
      );
    };
  }, []);

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
  }, [currentMeasureId]);

  const handleCreateVersionError = (error) => {
    const errorData = error?.response;
    const message = errorData?.data?.message;

    setToastOpen(true);
    setLoading(false);
    if (errorData?.status === 400) {
      setToastMessage("Requested measure cannot be versioned");
    } else if (errorData?.status === 403) {
      setToastMessage("User is unauthorized to create a version");
    } else if (errorData?.status === 423) {
      setToastMessage(`${errorData?.data?.message}`);
    } else {
      setToastMessage(
        message ||
          "Requested operation could not be completed. Please contact the Help Desk."
      );
    }

    if (message) {
      setVersionHelperText(versionErrorHelper(message));
    }
  };

  const handleDialogClose = () => {
    setInvalidTestCaseOpen(false);
    setCreateVersionDialog({
      open: false,
      measureId: "",
    });
    setDraftMeasureDialog({
      open: false,
    });
    setVersionHelperText("");
    setViewHumanReadableModal({
      open: false,
      measureId: "",
    });
    setTransferDialog({
      open: false,
      measures: [],
      isAdminTransfer: false,
    });
    setViewMeasureHistoryDialog(false);
  };

  const handleShareDialogClose = () => {
    setShareDialog({
      open: false,
      option: "",
    });
  };

  const handleShareDialogSave = ({
    toastType = "danger",
    toastMessage = "",
    toastOpen = false,
  } = {}) => {
    handleShareDialogClose();
    handleToast(toastType, toastMessage, toastOpen);
  };

  const createVersion = (versionType: string) => {
    setLoading(true);
    measureServiceApi
      .createVersion(measure.id, versionType)
      .then((response: AxiosResponse<Measure>) => {
        handleDialogClose();
        setToastOpen(true);
        setToastType("success");
        setLoading(false);
        setToastMessage("New version of measure is Successfully created");
        updateMeasure(response.data);
      })
      .catch((error) => {
        handleCreateVersionError(error);
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
      measureServiceApi
        .checkValidVersion(measure.id, versionType)
        .then((successResponse) => {
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
          handleCreateVersionError(error);
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
    setLoading(true);
    measureServiceApi
      .draftMeasure(measure.id, model, measureName)
      .then((response) => {
        setLoading(false);
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
        setCurrentMeasureId(response.data.id);
        setTimeout(() => {
          navigate(`/measures/${response.data.id}/edit${subRoute}`);
        }, 3000);
      })
      .catch((error) => {
        setLoading(false);
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
      const result = await measureServiceApi.deleteMeasure(deletedMeasure.id);
      if (result.status === 200) {
        handleToast("success", "Measure successfully deleted", true);
        setTimeout(() => {
          navigate("/measures");
        }, 1000);
      }
    } catch (e) {
      if (e?.response?.data) {
        console.error(e);
        const { message } = e.response.data;
        handleToast("danger", `${message}`, true);
        setDeleteOpen(false);
      } else {
        handleToast("danger", e.toString(), true);
        setDeleteOpen(false);
      }
    }
  };

  const handleTransferDialogClose = ({
    toastType = "danger",
    toastMessage = "",
    toastOpen = false,
  } = {}) => {
    handleDialogClose();
    handleToast(toastType, toastMessage, toastOpen);

    if (toastType === "success") {
      setTimeout(() => {
        navigate("/measures");
      }, 1000);
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
  const handleHumanReadableDialog = () => {
    setViewHumanReadableModal({
      open: false,
      measureId: "",
    });
  };
  const handleCancelDialog = () => {
    abortController.current && abortController.current.abort();
    handleContinueDialog();
  };
  // At this time it appears only possible to have a single error at a time because of the way state is updated.
  const [errorMessage, setErrorMessage] = useState<string>("");
  const isQDM = measure?.model?.includes("QDM");
  return (
    <div data-testid="editMeasure">
      {loading ? (
        <div data-testid="loading">
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MadieSpinner style={{ height: 50, width: 50 }} />
          </div>
        </div>
      ) : (
        <>
          <div tw="relative" style={{ marginTop: "-48px" }}>
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
                  copyButton={true}
                />
              )}

              <StatusHandler {...statusHandler} />
            </div>
            <Routes>
              {/* root nav links with wild card operators. We always want these displayed regardless of deeper navigation */}
              <Route
                path="/details/*"
                element={
                  <MeasureDetails
                    setErrorMessage={setErrorMessage}
                    isQDM={isQDM}
                    measureCanEdit={measureCanEdit}
                    measureLockedBy={measureLockedBy}
                  />
                }
              />
              <Route
                path={`/cql-editor`}
                element={
                  <MeasureEditor
                    measureCanEdit={measureCanEdit}
                    measureLockedBy={measureLockedBy}
                  />
                }
              />
              <Route
                path={`/test-cases/*`}
                element={
                  <Suspense fallback={<div>loading</div>}>
                    <TestCases />
                  </Suspense>
                }
              />
              <Route
                path={`/groups/:groupNumber`}
                element={
                  <PopulationCriteriaWrapper
                    measureCanEdit={measureCanEdit}
                    measureLockedBy={measureLockedBy}
                    displayLockedMeasurePopup={isQDM ? false : true}
                  />
                }
              />
              <Route
                path={`/supplemental-data`}
                element={
                  <PopulationCriteriaWrapper
                    measureCanEdit={measureCanEdit && !measureLockedBy}
                  />
                }
              />
              <Route
                path={`/risk-adjustment`}
                element={
                  <PopulationCriteriaWrapper
                    measureCanEdit={measureCanEdit && !measureLockedBy}
                  />
                }
              />
              <Route
                path={`/base-configuration`}
                element={
                  <PopulationCriteriaWrapper
                    measureCanEdit={measureCanEdit}
                    measureLockedBy={measureLockedBy}
                  />
                }
              />
              <Route
                path={`/reporting`}
                element={
                  <PopulationCriteriaWrapper
                    measureCanEdit={measureCanEdit && !measureLockedBy}
                  />
                }
              />
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

          <ShareDialog
            measures={[measure]}
            open={shareDialog.open}
            option={shareDialog.option}
            onClose={handleShareDialogClose}
            onSave={handleShareDialogSave}
            isAdmin={userRoles?.isAdmin}
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
            loading={loading}
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
          <ViewHRModal
            measureId={measure?.id}
            onClose={handleDialogClose}
            exportMeasure={handleHumanReadableDialog}
            open={viewHumanReadableModal.open}
          />
          <TransferDialog
            measures={[measure]}
            open={transferDialog.open}
            onClose={handleTransferDialogClose}
            setStatusHandler={setStatusHandler}
            isAdminTransfer={transferDialog.isAdminTransfer}
          />
          <ViewMeasureHistoryDialog
            measures={[measure]}
            open={viewMeasureHistoryDialog}
            onClose={handleDialogClose}
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
          <MadieDiscardDialog
            open={dialogOpen}
            onContinue={onContinue}
            onClose={onClose}
          />
        </>
      )}
    </div>
  );
}
