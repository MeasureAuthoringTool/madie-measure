import * as React from "react";
import "twin.macro";
import "styled-components/macro";
import { getServiceConfig, ServiceConfig } from "../../config/Config";
import { Measure } from "../../../models/Measure";

import axios from "axios";
import InlineEdit from "../../InlineEdit/InlineEdit";

const { useState, useEffect } = React;

interface MeasureParam {
  id: string;
}

export default function MeasureDetails(props: MeasureParam) {
  const [measure, setMeasure] = useState<Measure>({} as Measure);
  const transmitUpdatedMeasure = async (measure: Measure) => {
    try {
      const config: ServiceConfig = await getServiceConfig();
      const resp = await axios.put(
        config?.measureService?.baseUrl + "/measure/",
        measure
      );
      setMeasure(measure);
    } catch (err) {
      // Handle Error Here
      console.error(err);
    }
  };

  const sendGetRequest = async (id: string): Promise<Measure> => {
    try {
      const config: ServiceConfig = await getServiceConfig();
      const resp = await axios.get<Measure>(
        config?.measureService?.baseUrl + "/measures/" + id
      );
      return resp.data;
    } catch (err) {
      // Handle Error Here
      console.error(err);
    }
  };

  useEffect(() => {
    const result = Promise.resolve(sendGetRequest(props.id));
    result.then(function (value) {
      setMeasure(value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div tw="px-4" data-testid="measure-name-edit">
      Measure:
      <InlineEdit
        text={measure.measureName}
        onSetText={(text) => {
          transmitUpdatedMeasure({ ...measure, measureName: text } as Measure);
        }}
      />
    </div>
  );
}
