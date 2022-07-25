import React from "react";
import axios from "axios";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import { Measure, Group } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";

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
      throw new Error(err);
    }
  }

  async fetchMeasures(
    filterByCurrentUser: boolean,
    limit: number = 25,
    page: number = 0
  ): Promise<any> {
    try {
      const response = await axios.get<any>(`${this.baseUrl}/measures`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        params: {
          currentUser: filterByCurrentUser,
          limit,
          page,
        },
      });
      return response.data;
    } catch (err) {
      const message = `Unable to fetch measures`;
      console.error(message);
      console.error(err);
      throw new Error(message);
    }
  }

  async updateMeasure(measure: Measure): Promise<Response> {
    return await axios.put(`${this.baseUrl}/measures/${measure.id}`, measure, {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
  }

  async createGroup(group: Group, measureId: string): Promise<Group> {
    try {
      const response = await axios.post<Group>(
        `${this.baseUrl}/measures/${measureId}/groups/`,
        group,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      if (response?.data) {
        const responseData = JSON.stringify(response.data);
        if (responseData.includes("Request Rejected")) {
          throw new Error("failure create group");
        }
      }
      return response.data;
    } catch (err) {
      const message = this.buildErrorMessage(
        err,
        "Failed to create the group."
      );
      console.error(message, err);
      throw new Error(message);
    }
  }

  async deleteMeasureGroup(
    groupId: string,
    measureId: string
  ): Promise<Measure> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/measures/${measureId}/groups/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message = this.buildErrorMessage(
        err,
        "Failed to delete the measure group."
      );
      console.error(message, err);
      throw new Error(message);
    }
  }

  async updateGroup(group: Group, measureId: string): Promise<Group> {
    try {
      const response = await axios.put<Group>(
        `${this.baseUrl}/measures/${measureId}/groups/`,
        group,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      if (response?.data) {
        const responseData = JSON.stringify(response.data);
        if (responseData.includes("Request Rejected")) {
          throw new Error("failure update group");
        }
      }
      return response.data;
    } catch (err) {
      const message = this.buildErrorMessage(
        err,
        "Failed to update the group."
      );
      console.error(message, err);
      throw new Error(message);
    }
  }

  buildErrorMessage(err, baseMessage): string {
    let extraMessage = "";
    if (
      err?.response?.status === 400 &&
      err?.response?.data?.validationErrors?.group
    ) {
      extraMessage = " Missing required populations for selected scoring type.";
    }
    return `${baseMessage}${extraMessage}`;
  }
}

export default function useMeasureServiceApi(): MeasureServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.measureService;

  return new MeasureServiceApi(baseUrl, getAccessToken);
}
