import React, { useEffect, useState } from "react";
import axios from "../api/axios-instance";
import MeasureRoutes from "./measureRoutes/MeasureRoutes";
import { ApiContextProvider, ServiceConfig } from "../api/ServiceContext";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@madie/madie-design-system/dist/react";
import { featureFlagsStore, FeatureFlags } from "@madie/madie-util";
export default function Home() {
  const [configError, setConfigError] = useState<boolean>(false);
  const [serviceConfig, setServiceConfig] = useState<ServiceConfig | null>(
    null
  );

  // Use an effect hook to fetch the serviceConfig and set the state
  useEffect(() => {
    axios
      .get<ServiceConfig>("/env-config/serviceConfig.json")
      .then((value) => {
        if (value?.data?.measureService?.baseUrl) {
          setServiceConfig(value.data);
          // Update feature flags from service config
          if (value.data.features) {
            featureFlagsStore.updateFeatureFlags(
              value.data.features as FeatureFlags
            );
          }
        } else {
          console.error("Invalid service config");
          setConfigError(true);
        }
      })
      .catch((reason) => {
        console.error(reason);
        setConfigError(true);
      });
  }, []);

  // Roles are not fetched here: they come from the login response via
  // userRolesStore. madie-layout has a UserRolesLoader for refreshing them per
  // app load, which keeps every route consistent instead of measures only.

  const errorPage = <div>Error loading service config</div>;

  const loadingState = <div>Loading...</div>;

  const loadedState = (
    <ApiContextProvider value={serviceConfig}>
      <ThemeProvider theme={theme}>
        <MeasureRoutes />
      </ThemeProvider>
    </ApiContextProvider>
  );

  let result = serviceConfig === null ? loadingState : loadedState;
  if (configError) {
    result = errorPage;
  }

  return result;
}
