import React from "react";
import { Route, Switch, BrowserRouter, Redirect } from "react-router-dom";
import { CreateNewMeasure } from "../createNewMeasure/CreateNewMeasure";
import EditMeasure from "../editMeasure/EditMeasure";
import NewMeasure from "../newMeasure/NewMeasure";

export function MeasureRoutes() {
  return (
    <Switch>
      <Route exact path="/measures/create" component={CreateNewMeasure} />
      <Route path="/measures/:id/edit" component={EditMeasure} />
      <Route exact path="/measures" component={NewMeasure} />
      <Redirect to="/measures" path="*" />
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
