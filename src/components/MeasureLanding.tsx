import React from "react";
import { Route, Switch, BrowserRouter } from "react-router-dom";
import { CreateNewMeasure } from "./createNewMeasure/CreateNewMeasure";
import NewMeasure from "./NewMeasure";
import EditMeasure from "./EditMeasure";


export default function MeasureLanding() {

  return (
    <div data-testid="browser-router">
      <BrowserRouter>
        <Switch>
          <Route exact path="/measure/create" component={CreateNewMeasure} />
          <Route path="/measure/:id/edit" component={EditMeasure} />
          <Route exact path="/measure" component={NewMeasure} />
        </Switch>
      </BrowserRouter>
    </div>
  );
}
