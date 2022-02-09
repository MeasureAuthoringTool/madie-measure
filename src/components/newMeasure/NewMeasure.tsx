import React, { useEffect, useRef, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { Button } from "@madie/madie-components";
import { useHistory } from "react-router-dom";
import MeasureList from "../measureList/MeasureList";
import Measure from "../../models/Measure";
import * as _ from "lodash";

import { Divider, Tab, Tabs } from "@mui/material";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";

export default function NewMeasure() {
  const history = useHistory();
  const [measureList, setMeasureList] = useState<Measure[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const measureServiceApi = useRef(useMeasureServiceApi()).current;

  useEffect(() => {
    (async () => {
      const measures = await measureServiceApi.fetchMeasures(activeTab === 0);
      setMeasureList(() => _.orderBy(measures, ["lastModifiedAt"], ["desc"]));
    })();
  }, [activeTab, measureServiceApi]);

  const handleTabChange = (event, nextTab) => {
    setActiveTab(nextTab);
  };

  return (
    <div tw="mx-12 mt-5">
      <section tw="flex flex-row my-2">
        <h1 tw="text-4xl font-light">Measures</h1>
        <span tw="flex-grow" />
        <Button
          buttonTitle="New Measure"
          tw="h-10"
          onClick={() => history.push("/measures/create")}
          data-testid="create-new-measure-button"
        />
      </section>
      <section tw="flex flex-row">
        <div>
          <Tabs value={activeTab} onChange={handleTabChange} tw="flex flex-row">
            <Tab label={`My Measures`} data-testid="my-measures-tab" />
            <Tab label="All Measures" data-testid="all-measures-tab" />
          </Tabs>
          <Divider />
        </div>
        <span tw="flex-grow" />
      </section>
      <div tw="my-4">
        <MeasureList measureList={measureList} />
      </div>
    </div>
  );
}
