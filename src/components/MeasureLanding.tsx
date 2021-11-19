import React, { useState } from "react";
import tw from "twin.macro";
import { Route, Switch, useHistory } from "react-router-dom";
import { CreateNewMeasure } from "./createNewMeasure/CreateNewMeasure";
import EditMeasure from "./EditMeasure";
import { getServiceConfig, ServiceConfig } from "./config/Config";
import axios from "axios";
import MeasureList from "./MeasureList";
import { Measure } from "../models/Measure";
import { Button } from "@madie/madie-components";

export default function MeasureLanding() {
  const [serviceConfig, setServiceConfig] = useState<ServiceConfig>();
  const [serviceConfigErr, setServiceConfigErr] = useState<string>();
  const [measureList, setMeasureList] = React.useState<Measure[]>([]);

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
  );
}
