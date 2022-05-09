import React, { useEffect, useState } from "react";
import {
  Redirect,
  Route,
  Switch,
  useParams,
  useRouteMatch,
  useHistory,
} from "react-router-dom";
import "styled-components/macro";
import EditMeasureNav from "./editMeasureNav/EditMeasureNav";
import MeasureDetails from "./measureDetails/MeasureDetails";
import MeasureEditor from "../measureEditor/MeasureEditor";
import Measure from "../../models/Measure";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import { MeasureContextProvider } from "./MeasureContext";
import { MadiePatient } from "@madie/madie-patient";
import MeasureGroups from "../measureGroups/MeasureGroups";
import Header from "./header/Header";

interface inputParams {
  id: string;
}

export default function EditMeasure() {
  const { url } = useRouteMatch();
  const { id } = useParams<inputParams>();
  const measureServiceApi = useMeasureServiceApi();
  const [measure, setMeasure] = useState<Measure>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const history = useHistory();

  useEffect(() => {
    if (!measure) {
      measureServiceApi
        .fetchMeasure(id)
        .then((value: Measure) => {
          setMeasure(value);
          setLoading(false);
        })
        .catch((err) => {
          if (err.toString().includes("404")) {
            history.push("/404");
          }
        });
    }
  }, [measureServiceApi, id, measure, history]);

  const loadingDiv = <div data-testid="loading">Loading...</div>;

  const contentDiv = (
    <div className="container-header-gradient" data-testid="editMeasure">
      <Header measure={measure} />
      <EditMeasureNav />
      <MeasureContextProvider value={{ measure, setMeasure }}>
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
      </MeasureContextProvider>
    </div>
  );

  return loading ? loadingDiv : contentDiv;
}
