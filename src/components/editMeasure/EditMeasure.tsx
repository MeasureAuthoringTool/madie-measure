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
interface inputParams {
  id: string;
}
export default function EditMeasure() {
  const { url } = useRouteMatch();
  const { id } = useParams<inputParams>();
  const measureServiceApi = useMeasureServiceApi();
  const [measure, setMeasure] = useState<Measure>(measureStore.state);
  const { updateMeasure } = measureStore;
  // we're going to listen to context updates here and send them to layout
  useEffect(() => {
    measureStore.updateMeasure(measure);
  }, [measure]);
  const [loading, setLoading] = useState<boolean>(true);

  const history = useHistory();

  useEffect(() => {
    if (!measure) {
      measureServiceApi
        .fetchMeasure(id)
        .then((value: Measure) => {
          // setMeasure(value); We will instead depend on our subscription to update the store
          updateMeasure(value);
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
    </div>
  );
  return loading ? loadingDiv : contentDiv;
}
