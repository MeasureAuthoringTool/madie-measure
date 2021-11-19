import React, { useState } from "react";
import tw from "twin.macro";


import { Route, Switch, BrowserRouter, useHistory } from "react-router-dom";
import  from "./CreateNewMeasure";
import NewMeasure from "./NewMeasure";

import { CreateNewMeasure } from "./createNewMeasure/CreateNewMeasure";
import EditMeasure from "./EditMeasure";
import { getServiceConfig, ServiceConfig } from "./config/Config";
import axios from "axios";
import MeasureList from "./MeasureList";
import { Measure } from "../models/Measure";
import { Button } from "@madie/madie-components";






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
