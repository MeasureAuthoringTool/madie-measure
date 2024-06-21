import { createContext } from "react";

export interface ServiceConfig {
  measureService: {
    baseUrl: string;
  };
  elmTranslationService: {
    baseUrl: string;
  };
  qdmElmTranslationService: {
    baseUrl: string;
  };
  fhirElmTranslationService: {
    baseUrl: string;
  };
  terminologyService: {
    baseUrl: string;
  };
}

const ServiceContext = createContext<ServiceConfig>(null);

export default ServiceContext;

export const ApiContextProvider = ServiceContext.Provider;
export const ApiContextConsumer = ServiceContext.Consumer;
