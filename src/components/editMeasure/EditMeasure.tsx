import React, { useEffect, useState, Suspense } from "react";
import {
  useBlocker,
  Route,
  Routes,
  useParams,
  useNavigate,
} from "react-router-dom";
import "twin.macro";
import "styled-components/macro";
import EditMeasureNav from "./EditMeasureNav";
import MeasureDetails from "./details/MeasureDetails";
import MeasureEditor from "./editor/MeasureEditor";
import { Measure } from "@madie/madie-models";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import { MadiePatient } from "@madie/madie-patient";
import { measureStore, routeHandlerStore } from "@madie/madie-util";
import { Toast, MadieAlert } from "@madie/madie-design-system/dist/react";
import DeleteDialog from "./DeleteDialog";
import NotFound from "../notfound/NotFound";
import ReviewInfo from "./reviewInfo/ReviewInfo";
import "./EditMeasure.scss";
import PopulationCriteriaWrapper from "./populationCriteria/PopulationCriteriaWrapper";
import CqlEditorTab from "./editor/CqlEditorTab";
interface inputParams {
  id: string;
}
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
  const [routeHandlerState, setRouteHandlerState] = useState<RouteHandlerState>(
    routeHandlerStore.state
  );
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
    updateRouteHandlerState({
      ...routeHandlerState,
      pendingRoute: blocker?.location?.pathname,
    });
    if (blocker.location) blocker.reset();
  }, [blocker?.location?.pathname]);

  useEffect(() => {
    // we don't want to fire this by accident during delete.
    if (loading) {
      measureServiceApi
        .fetchMeasure(id)
        .then((value: Measure) => {
          updateMeasure(value);
          setLoading(false);
        })
        .catch((err) => {
          if (err.toString().includes("404")) {
            navigate("/404");
          }
        });
    }
  }, [measureServiceApi, id, history, loading, updateMeasure]);

  const loadingDiv = <div data-testid="loading">Loading...</div>;

  // Delete utilities
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const [measure, setMeasure] = useState<any>(measureStore.state);

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
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
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
          <Route
            path={`/cql-editor`}
            element={<CqlEditorTab isQDM={isQDM} />}
          />
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
