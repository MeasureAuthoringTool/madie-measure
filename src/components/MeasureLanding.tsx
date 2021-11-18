import React, { useState } from "react";
import tw from "twin.macro";


import { Route, Switch, BrowserRouter, useHistory } from "react-router-dom";
import CreateNewMeasure from "./CreateNewMeasure";
import EditMeasure from "./EditMeasure";
import NewMeasure from "./NewMeasure";



export interface Measure {
  id: {
    timestamp: number;
    date: string;
  };
  measureHumanReadableId: string;
  measureSetId: string;
  version: number;
  revisionNumber: number;
  state: string;
  name: string;
  cql: string;
  createdAt: string;
  createdBy: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  model: string;
}


export default function MeasureLanding() {

  return (
    <>
      <BrowserRouter>
        <Switch>
          <Route exact path="/measure/create">
            <CreateNewMeasure />
          </Route>
          <Route path="/measure/:id/edit" component={EditMeasure} />
          <Route exact path="/measure">
            <NewMeasure />
          </Route>
        </Switch>
      </BrowserRouter>
    </>
  );
}
