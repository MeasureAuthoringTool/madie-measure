import React, { useState } from "react";
import tw from "twin.macro";
<<<<<<< HEAD

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
=======
<<<<<<< HEAD
import { Route, Switch, useHistory } from "react-router-dom";
import { CreateNewMeasure } from "./createNewMeasure/CreateNewMeasure";
import EditMeasure from "./EditMeasure";
import { getServiceConfig, ServiceConfig } from "./config/Config";
import axios from "axios";
import MeasureList from "./MeasureList";
import { Measure } from "../models/Measure";
import { Button } from "@madie/madie-components";
=======


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
>>>>>>> aa53203 (MAT-3506: Adding environment variable configuration)


<<<<<<< HEAD
  const history = useHistory();

  if (!serviceConfig && !serviceConfigErr) {
    (async () => {
      const config: ServiceConfig = await getServiceConfig();
      setServiceConfig(config);
      axios
        .get(config?.measureService?.baseUrl + "/measures")
        .then((response) => {
          setMeasureList(response.data as Array<Measure>);
        })
        .catch((err) => {
          setServiceConfigErr(
            "Unable to load page, please contact the site administration"
          );
        });
    })();
  }

  return (
    <Switch>
      <Route exact path="/measure/create">
        <CreateNewMeasure />
      </Route>
      <Route path="/measure/:id/edit" component={EditMeasure} />
      <Route exact path="/measure">
        <span>Welcome </span>
        <Button
          buttonTitle="New Measure"
          type="button"
          onClick={() => history.push("/measure/create")}
          data-testid="create-new-measure-button"
        />
        <div tw="mx-5 my-8">
          <MeasureList measureList={measureList} />
        </div>
      </Route>
    </Switch>
=======
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
>>>>>>> aa53203 (MAT-3506: Adding environment variable configuration)
>>>>>>> b55d881 (MAT-3506: Adding environment variable configuration)
  );
}
