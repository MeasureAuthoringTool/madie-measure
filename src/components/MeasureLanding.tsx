import React, { useState } from "react";
import tw from "twin.macro";

import { Route, Switch, BrowserRouter, useHistory } from "react-router-dom";
import CreateNewMeasure from "./CreateNewMeasure";
import EditMeasure from "./EditMeasure";
import NewMeasure from "./NewMeasure";

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
