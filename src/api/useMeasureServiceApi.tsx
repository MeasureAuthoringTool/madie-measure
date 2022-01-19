import React from "react";
import axios from "axios";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import Measure from "../models/Measure";
import useOktaTokens from "../hooks/useOktaTokens";

export class MeasureServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async fetchMeasure(id: string): Promise<Measure> {
    try {
      const response = await axios.get<Measure>(
        `${this.baseUrl}/measures/${id}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message = `Unable to fetch measure ${id}`;
      console.error(message);
      console.error(err);
      throw new Error(message);
    }
  }

  async updateMeasure(measure: Measure): Promise<void> {
    return await axios.put(`${this.baseUrl}/measure/`, measure, {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
  }
}

export default function useMeasureServiceApi(): MeasureServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.measureService;

  return new MeasureServiceApi(baseUrl, getAccessToken);
}
