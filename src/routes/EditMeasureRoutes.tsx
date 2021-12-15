import React from "react";
import {
  Route,
  Switch,
  useRouteMatch,
  useParams,
  Redirect,
} from "react-router-dom";
import MeasureDetails from "../components/EditMeasure/MeasureDetails/MeasureDetails";
import MeasureEditor from "../components/MeasureEditor/MeasureEditor";

interface inputParams {
  id: string;
}

const EditMeasureRoutes = () => {
  const { url } = useRouteMatch();
  const { id } = useParams<inputParams>();

  return (
    <Switch>
      <Redirect exact from={url} to={`${url}/details`} />
      <Route path={`${url}/details`}>
        <MeasureDetails id={id} />
      </Route>
      <Route path={`${url}/cql-editor`}>
        <MeasureEditor />
      </Route>
      <Route path="*">
        <div>In progress...</div>
      </Route>
    </Switch>
  );
};

export default EditMeasureRoutes;
