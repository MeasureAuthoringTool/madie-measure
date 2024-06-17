import { wafIntercept } from "@madie/madie-util";
import axios from "axios";

export interface OktaConfig {
  baseUrl: string;
  issuer: string;
  clientId: string;
  redirectUri: string;
}

export interface ServiceConfig {
  measureService: {
    baseUrl: string;
  };
  elmTranslationService: {
    baseUrl: string;
  };
}
axios.interceptors.response.use((response) => {
  return response;
}, wafIntercept);

export async function getServiceConfig(): Promise<ServiceConfig> {
  const serviceConfig: ServiceConfig = (
    await axios.get<ServiceConfig>("/env-config/serviceConfig.json")
  ).data;
  if (
    !(serviceConfig?.measureService && serviceConfig.measureService.baseUrl)
  ) {
    throw new Error("Invalid Service Config");
  }

  return serviceConfig;
}
