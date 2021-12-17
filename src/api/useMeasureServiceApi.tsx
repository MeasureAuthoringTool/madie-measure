import React from "react";
import axios from "axios";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import Measure from "../models/Measure";

export class MeasureServiceApi {
  constructor(private baseUrl: string) {}

  async fetchMeasure(id: string): Promise<Measure> {
    try {
      const response = await axios.get<Measure>(
        `${this.baseUrl}/measures/${id}`
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
    try {
      await axios.put(`${this.baseUrl}/measure/`, measure);
    } catch (err) {
      const message = `Unable to update measure ${measure.id}`;
      console.error(message);
      console.error(err);
      console.error(measure);
      throw new Error(message);
    }
  }
}

export default function useMeasureServiceApi(): MeasureServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { baseUrl } = serviceConfig.measureService;

  return new MeasureServiceApi(baseUrl);
}
