import React from "react";
import axios from "axios";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import { useOktaTokens } from "@madie/madie-util";
import _ from "lodash";

export class FhirElmTranslationServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async fetchTranslatorVersion(draft: boolean): Promise<string> {
    try {
      const response = await axios.get<string>(
        `${this.baseUrl}/fhir/translator-version`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: {
            draft,
          },
        }
      );
      return response.data;
    } catch (err) {
      console.error("unable to retrieve translator version:", err);
      throw new Error(err);
    }
  }
}

export default function useFhirElmTranslationServiceApi(): FhirElmTranslationServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.fhirElmTranslationService;

  return new FhirElmTranslationServiceApi(baseUrl, getAccessToken);
}
