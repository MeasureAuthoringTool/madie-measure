import React from "react";
import axios from "axios";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import { Measure, Group } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import _ from "lodash";

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
      if (groupId && measureId) {
        const response = await axios.delete(
          `${this.baseUrl}/measures/${measureId}/groups/${groupId}`,
          {
            headers: {
              Authorization: `Bearer ${this.getAccessToken()}`,
            },
          }
        );
        return response.data;
      } else {
        console.error("Group or Measure Id cannot be null");
        throw new Error("Group or Measure Id cannot be null");
      }
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
    let errorMessage = undefined;
    if (err?.response?.status === 400) {
      if (err.response.data?.validationErrors?.group) {
        errorMessage =
          "Missing required populations for selected scoring type.";
      } else if (err.response.data.message) {
        errorMessage = err.response.data.message;
      }
    }
    return errorMessage ? errorMessage : baseMessage;
  }

  async getAllPopulationBasisOptions(): Promise<string[]> {
    try {
      const response = await axios.get<string[]>(
        `${this.baseUrl}/populationBasisValues`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      if (response?.data.length < 1) {
        throw new Error("Unable to fetch population basis options");
      }
      return response?.data;
    } catch (err) {
      const message = this.buildErrorMessage(
        err,
        "Unable to fetch population basis options"
      );
      throw new Error(message);
    }
  }

  getReturnTypesForAllCqlDefinitions(elmJson: string): {
    [key: string]: string;
  } {
    if (!elmJson) {
      return {};
    }

    const elm = JSON.parse(elmJson);
    const definitions = elm.library?.statements?.def;
    if (definitions) {
      return definitions.reduce((returnTypes, definition) => {
        const returnType = {};
        const name = _.camelCase(_.trim(definition.name));
        if (definition.resultTypeName) {
          returnType[name] = definition.resultTypeName?.split("}")[1];
        } else if (definition.resultTypeSpecifier) {
          const resultType = definition.resultTypeSpecifier.elementType.type;
          if (resultType === "NamedTypeSpecifier") {
            returnType[name] =
              definition.resultTypeSpecifier.elementType.name?.split("}")[1];
          } else {
            returnType[name] = "NA";
          }
        } else {
          returnType[name] = "NA";
        }
        return {
          ...returnTypes,
          ...returnType,
        };
      }, {});
    }

    return {};
  }
}

export default function useMeasureServiceApi(): MeasureServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.measureService;

  return new MeasureServiceApi(baseUrl, getAccessToken);
}
