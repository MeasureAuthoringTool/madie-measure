import React, { useState } from "react";
import tw from "twin.macro";
import "styled-components/macro";

import { useHistory } from "react-router-dom";
import { CreateNewMeasure } from "./createNewMeasure/CreateNewMeasure";
import EditMeasure from "./EditMeasure";
import MeasureList from "./MeasureList";
import { Measure } from "../models/measure";

import { getServiceConfig, ServiceConfig } from "./config/Config";
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
      <button
        type="button"
        tw="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={() => history.push("/measure/create")}
        data-testid="create-new-measure-button"
      >
        New Measure
      </button>
      <div tw="mx-5 my-8">
        <MeasureList measureList={measureList} />
      </div>
    </>
  );
}
