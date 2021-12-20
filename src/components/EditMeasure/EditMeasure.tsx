import React, { useEffect, useState } from "react";
import {
  Redirect,
  Route,
  Switch,
  useParams,
  useRouteMatch,
} from "react-router-dom";
import "styled-components/macro";
import EditMeasureNav from "./EditMeasureNav/EditMeasureNav";
import MeasureDetails from "./MeasureDetails/MeasureDetails";
import MeasureEditor from "../MeasureEditor/MeasureEditor";
import Measure from "../../models/Measure";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import { MeasureContextProvider } from "./MeasureContext";

interface inputParams {
  id: string;
}

export default function EditMeasure() {
  const { url } = useRouteMatch();
  const { id } = useParams<inputParams>();
  const measureServiceApi = useMeasureServiceApi();
  const [measure, setMeasure] = useState<Measure>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!measure) {
      measureServiceApi.fetchMeasure(id).then((value: Measure) => {
        setMeasure(value);
        setLoading(false);
      });
    }
  }, [measureServiceApi, id, measure]);

  const loadingDiv = <div data-testid="loading">Loading...</div>;

  const contentDiv = (
    <div data-testid="editMeasure">
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
          <Route path="*">
            <div>In progress...</div>
          </Route>
        </Switch>
      </MeasureContextProvider>
    </div>
  );

  return loading ? loadingDiv : contentDiv;
}
