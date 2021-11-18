import React, { useState } from "react";
import tw, { css } from "twin.macro";
import { CreateNewMeasure } from "./createNewMeasure/CreateNewMeasure";
import EditMeasure from "./EditMeasure";

import { Route, Switch, BrowserRouter, useHistory } from "react-router-dom";

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
