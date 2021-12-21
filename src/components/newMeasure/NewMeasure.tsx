import React, { useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { Button } from "@madie/madie-components";
import { useHistory } from "react-router-dom";
import MeasureList from "../measureList/MeasureList";
import Measure from "../../models/Measure";

import { getServiceConfig, ServiceConfig } from "../config/Config";
import axios from "axios";

export default function NewMeasure() {
  const history = useHistory();
  const [measureList, setMeasureList] = useState<Measure[]>([]);
  const [serviceConfig, setServiceConfig] = useState<ServiceConfig>();
  const [serviceConfigErr, setServiceConfigErr] = useState<string>();

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
      <span>Welcome </span>
      <Button
        buttonTitle="New Measure"
        tw="mr-4"
        onClick={() => history.push("/measure/create")}
        data-testid="create-new-measure-button"
      />
      <div tw="mx-5 my-8">
        <MeasureList measureList={measureList} />
      </div>
    </>
  );
}
