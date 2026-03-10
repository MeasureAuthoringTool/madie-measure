import { createContext } from "react";

export interface ServiceConfig {
  measureService: {
    baseUrl: string;
  };
  terminologyService: {
    baseUrl: string;
  };
  qdmElmTranslationService: {
    baseUrl: string;
  };
  fhirElmTranslationService: {
    baseUrl: string;
  };
  fhirService: {
    baseUrl: string;
  };
  excelExportService: {
    baseUrl: string;
  };
  features?: {
    export?: boolean;
    qdmToFhirConversion?: boolean;
    qiCoreElementsTab?: boolean;
    qdmHideJson?: boolean;
    enableQdmRepeatTransfer?: boolean;
    EnhancedTextFormatting?: boolean;
    qiCore7?: boolean;
    QICoreCompositeMeasure?: boolean;
    AdminTransferMeasure?: boolean;
  };
}

const ServiceContext = createContext<ServiceConfig>(null);

export default ServiceContext;

export const ApiContextProvider = ServiceContext.Provider;
export const ApiContextConsumer = ServiceContext.Consumer;
