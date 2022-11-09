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
import EditMeasureNav from "./editMeasureNav/EditMeasureNav";
import MeasureDetails from "./measureDetails/MeasureDetails";
import MeasureEditor from "../measureEditor/MeasureEditor";
import { Measure } from "@madie/madie-models";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import { MadiePatient } from "@madie/madie-patient";
import MeasureGroups from "../measureGroups/MeasureGroups";
import { measureStore } from "@madie/madie-util";
import { Toast } from "@madie/madie-design-system/dist/react";
import DeleteDialog from "./DeleteDialog";
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
        handleToast("danger", errorMessage, true);
      } else {
        handleToast("danger", e.toString(), true);
      }
    }
  };
  const onToastClose = () => {
    setToastType(null);
    setToastMessage("");
    setToastOpen(false);
  };
  const handleToast = (type, message, open) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(open);
  };

  const contentDiv = (
    <div data-testid="editMeasure">
      <div tw="relative -mt-12">
        <EditMeasureNav />
        <Switch>
          <Redirect exact from={url} to={`${url}/details`} />
          <Route path={`${url}/details`}>
            <MeasureDetails />
          </Route>
          <Route path={`${url}/cql-editor`}>
            <MeasureEditor />
          </Route>
          <Route path={`${url}/test-cases`}>
            <MadiePatient />
          </Route>
          <Route path="*">
            <MeasureGroups />
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
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={6000}
      />
    </div>
  );
  return loading ? loadingDiv : contentDiv;
}
