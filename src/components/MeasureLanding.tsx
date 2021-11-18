import React, { useState } from "react";
import tw from "twin.macro";
import { Route, Switch, BrowserRouter } from "react-router-dom";
import CreateNewMeasure from "./CreateNewMeasure";
import EditMeasure from "./EditMeasure";
import { getServiceConfig, ServiceConfig } from "./Config";
import axios from "axios";
import MeasureList from "./MeasureList";

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
  const [serviceConfig, setServiceConfig] = useState<ServiceConfig>();
  const [serviceConfigErr, setServiceConfigErr] = useState<string>();
  const [measureList, setMeasureList] = React.useState<Measure[]>([]);

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
    <>
      <BrowserRouter>
        <Switch>
          <Route exact path="/measure/create">
            <CreateNewMeasure />
          </Route>
          <Route path="/measure/:id/edit" component={EditMeasure} />
          <Route exact path="/measure">
            <span>Welcome </span>
            <button
              type="button"
              tw="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => (window.location.href = "/measure/create")}
              data-testid="create-new-measure-button"
            >
              New Measure
            </button>
            <div tw="mx-5 my-8">
              <MeasureList measureList={measureList} />
            </div>
          </Route>
        </Switch>
      </BrowserRouter>
    </>
  );
}
