import { createContext } from "react";

export interface ServiceConfig {
  measureService: {
    baseUrl: string;
  };
  elmTranslationService: {
    baseUrl: string;
  };
  terminologyService: {
    baseUrl: string;
  };
  features: {
    export: boolean;
    measureVersioning: boolean;
    populationCriteriaTabs: boolean;
  };
}

const ServiceContext = createContext<ServiceConfig>(null);

export default ServiceContext;

export const ApiContextProvider = ServiceContext.Provider;
export const ApiContextConsumer = ServiceContext.Consumer;
