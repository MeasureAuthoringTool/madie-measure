import React from "react";
import { Route, Switch, BrowserRouter, Redirect } from "react-router-dom";
import { CreateNewMeasure } from "../createNewMeasure/CreateNewMeasure";
import EditMeasure from "../editMeasure/EditMeasure";
import NewMeasure from "../newMeasure/NewMeasure";
import TimeoutHandler from "./TimeoutHandler";

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

const MeasureLanding = () => {
  return (
    <div data-testid="browser-router">
      <TimeoutHandler timeLeft={1500000} />
      <BrowserRouter>
        <MeasureRoutes />
      </BrowserRouter>
    </div>
  );
};
export default MeasureLanding;
