import React, { useEffect, useState } from "react";
import {
  Redirect,
  Route,
  Switch,
  useParams,
  useRouteMatch,
  useHistory,
} from "react-router-dom";
import "twin.macro";
import "styled-components/macro";
import EditMeasureNav from "./EditMeasureNav";
import MeasureDetails from "./details/MeasureDetails";
import MeasureEditor from "./editor/MeasureEditor";
import { Measure } from "@madie/madie-models";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import { MadiePatient } from "@madie/madie-patient";
import { measureStore } from "@madie/madie-util";
import { Toast, MadieAlert } from "@madie/madie-design-system/dist/react";
import DeleteDialog from "./DeleteDialog";
import NotFound from "../notfound/NotFound";
import PopulationCriteriaHome from "./populationCriteria/PopulationCriteriaHome";
import ReviewInfo from "./reviewInfo/ReviewInfo";
import "./EditMeasure.scss";

interface inputParams {
  id: string;
}
export default function EditMeasure() {
  const { url } = useRouteMatch();
  const { id } = useParams<inputParams>();
  const measureServiceApi = useMeasureServiceApi();
  const { updateMeasure } = measureStore;
  const [loading, setLoading] = useState<boolean>(true);

  const history = useHistory();

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
            history.push("/404");
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
          history.push("/measures");
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

  const contentDiv = (
    <div data-testid="editMeasure">
      <div tw="relative" style={{ marginTop: "-60px" }}>
        <EditMeasureNav />
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
        <Switch>
          <Redirect exact from={url} to={`${url}/details`} />
          <Route path={`${url}/details`}>
            <MeasureDetails setErrorMessage={setErrorMessage} />
          </Route>
          <Route path={`${url}/cql-editor`}>
            <MeasureEditor />
          </Route>
          <Route path={`${url}/test-cases`}>
            <MadiePatient />
          </Route>
          <Route
            path={[
              `${url}/groups`,
              `${url}/supplemental-data`,
              `${url}/risk-adjustment`,
              `${url}/base-configuration`,
            ]}
          >
            <PopulationCriteriaHome />
          </Route>
          <Route path={`${url}/review-info`}>
            <ReviewInfo />
          </Route>
          <Route path="*">
            <NotFound />
          </Route>
        </Switch>
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
