import React, { useEffect, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { Button } from "@madie/madie-components";
import { useHistory } from "react-router-dom";
import MeasureList from "../measureList/MeasureList";
import Measure from "../../models/Measure";
import * as _ from "lodash";

import { getServiceConfig, ServiceConfig } from "../config/Config";
import axios from "axios";
import useOktaTokens from "../../hooks/useOktaTokens";
import { Divider, InputAdornment, Tab, Tabs, TextField } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

export default function NewMeasure() {
  const history = useHistory();
  const [measureList, setMeasureList] = useState<Measure[]>([]);
  const [serviceConfig, setServiceConfig] = useState<ServiceConfig>();
  const [serviceConfigErr, setServiceConfigErr] = useState<string>();
  const [activeTab, setActiveTab] = useState(0);
  const { getAccessToken } = useOktaTokens();

  useEffect(() => {
    getServiceConfig()
      .then((serviceConfig) => setServiceConfig(serviceConfig))
      .catch(() =>
        setServiceConfigErr(
          "Unable to load page, please contact the site administration"
        )
      );
  }, []);

  useEffect(() => {
    if (serviceConfig) {
      setMeasureList(() => []);
      axios
        .get<Measure[]>(serviceConfig?.measureService?.baseUrl + "/measures", {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
          params: {
            currentUser: activeTab === 0,
          },
        })
        .then((response) => {
          setMeasureList(() =>
            _.orderBy(response.data, ["lastModifiedAt"], ["desc"])
          );
        });
    }
  }, [serviceConfig, activeTab, getAccessToken]);

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
          onClick={() => history.push("/measure/create")}
          data-testid="create-new-measure-button"
        />
      </section>
      <section tw="flex flex-row">
        <div>
          <Tabs value={activeTab} onChange={handleTabChange} tw="flex flex-row">
            <Tab label={`My Measures`} />
            <Tab label="All Measures" />
          </Tabs>
          <Divider />
        </div>
        <span tw="flex-grow" />
        <TextField
          size="small"
          placeholder="Search Measures"
          tw="w-80"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <FontAwesomeIcon icon={faSearch} />
              </InputAdornment>
            ),
          }}
        />
      </section>
      <div tw="my-4">
        <MeasureList measureList={measureList} />
      </div>
    </div>
  );
}
