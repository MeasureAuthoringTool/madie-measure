import React from "react";
import { Route, Switch, BrowserRouter, Redirect } from "react-router-dom";
import EditMeasure from "../editMeasure/EditMeasure";
import NewMeasure from "../newMeasure/NewMeasure";
import TimeoutHandler from "./TimeoutHandler";
import NotFound from "../notfound/NotFound";

export function MeasureRoutes() {
  return (
    <Switch>
      <Route exact path="/measures" component={NewMeasure} />
      <Route path="/measures/:id/edit" component={EditMeasure} />
      <Route path="/404" component={NotFound} />
      <Redirect to="/404" />
    </Switch>
  );
}

const MeasureLanding = () => {
  return (
    <div className="container-header-gradient" data-testid="browser-router">
      <TimeoutHandler timeLeft={1500000} />
      <BrowserRouter>
        <MeasureRoutes />
      </BrowserRouter>
    </div>
  );
};
export default MeasureLanding;
