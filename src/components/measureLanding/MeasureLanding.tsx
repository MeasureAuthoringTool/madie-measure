import React from "react";
import { Route, Switch, BrowserRouter, Redirect } from "react-router-dom";
import { CreateNewMeasure } from "../createNewMeasure/CreateNewMeasure";
import EditMeasure from "../editMeasure/EditMeasure";
import NewMeasure from "../newMeasure/NewMeasure";

export function MeasureRoutes() {
  return (
    <Switch>
      <Route exact path="/measure/create" component={CreateNewMeasure} />
      <Route path="/measure/:id/edit" component={EditMeasure} />
      <Route exact path="/measure" component={NewMeasure} />
      <Redirect to="/measure" path="*" />
    </Switch>
  );
}

export default function MeasureLanding() {
  return (
    <div data-testid="browser-router">
      <BrowserRouter>
        <MeasureRoutes />
      </BrowserRouter>
    </div>
  );
}
