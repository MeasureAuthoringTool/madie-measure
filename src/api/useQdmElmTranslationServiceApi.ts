import React from "react";
import axios from "axios";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import { useOktaTokens } from "@madie/madie-util";
import _ from "lodash";

export class QdmElmTranslationServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async fetchTranslatorVersion(draft: boolean): Promise<string> {
    try {
      const response = await axios.get<string>(
        `${this.baseUrl}/qdm/translator-version`,
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

export default function useQdmElmTranslationServiceApi(): QdmElmTranslationServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.qdmElmTranslationService;

  return new QdmElmTranslationServiceApi(baseUrl, getAccessToken);
}
