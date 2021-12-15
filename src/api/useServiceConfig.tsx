import React, { useContext } from "react";
import ServiceContext, { ServiceConfig } from "./ServiceContext";

export default function useServiceConfig() {
  const serviceConfig: ServiceConfig = useContext(ServiceContext);
  return serviceConfig;
}
