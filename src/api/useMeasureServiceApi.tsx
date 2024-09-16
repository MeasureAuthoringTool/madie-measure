import React from "react";
import { AxiosResponse } from "axios";
import axios from "../api/axios-insatnce";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import {
  Measure,
  Group,
  Organization,
  EndorsementOrganization,
  MeasureSet,
} from "@madie/madie-models";
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

  async fetchMeasureDraftStatuses(measureSetIds: string[]): Promise<any> {
    const idsParam = measureSetIds.join(",");
    try {
      const response = await axios.get<any>(
        `${this.baseUrl}/measures/draftstatus`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: {
            measureSetIds: idsParam,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message = `Unable to fetch measure draft statuses`;
      console.error(message, err);
      throw new Error(message);
    }
  }

  async fetchMeasures(
    filterByCurrentUser: boolean,
    limit: number = 25,
    page: number = 0,
    signal
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
        signal,
      });
      return response.data;
    } catch (err) {
      if (err.message === "canceled") {
        throw new Error(err.message);
      }
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

  async deleteMeasure(measure: Measure): Promise<Response> {
    return await axios.put(
      `${this.baseUrl}/measures/${measure.id}/delete`,
      measure,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }

  async createGroup(group: Group, measureId: string): Promise<Group> {
    try {
      const response = await axios.post<Group>(
        `${this.baseUrl}/measures/${measureId}/groups`,
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

  async associateCmdId(
    qiCoreMeasureId: string,
    qdmMeasureId: string,
    copyMetaData: boolean
  ): Promise<MeasureSet> {
    const response = await axios.put<any>(
      `${this.baseUrl}/measures/cms-id-association`,
      {},
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        params: {
          qiCoreMeasureId,
          qdmMeasureId,
          copyMetaData,
        },
      }
    );
    return response.data;
  }

  async updateGroup(group: Group, measureId: string): Promise<Group> {
    try {
      const response = await axios.put<Group>(
        `${this.baseUrl}/measures/${measureId}/groups`,
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

  async getAllOrganizations(): Promise<Organization[]> {
    try {
      const response = await axios.get<Organization[]>(
        `${this.baseUrl}/organizations`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      if (response?.data.length < 1) {
        throw new Error("Unable to fetch organizations");
      }
      return response?.data;
    } catch (err) {
      const message = this.buildErrorMessage(
        err,
        "Unable to fetch organizations"
      );
      throw new Error(message);
    }
  }

  async getAllEndorsers(): Promise<EndorsementOrganization[]> {
    try {
      const response = await axios.get<EndorsementOrganization[]>(
        `${this.baseUrl}/endorsements`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      if (response?.data.length < 1) {
        throw new Error("Unable to fetch endorsers");
      }
      return response?.data;
    } catch (err) {
      const message = this.buildErrorMessage(err, "Unable to fetch endorsers");
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
          for (const key in definition.resultTypeSpecifier) {
            if (
              definition.resultTypeSpecifier[key]?.type === "NamedTypeSpecifier"
            ) {
              returnType[name] =
                definition.resultTypeSpecifier[key].name?.split("}")[1];
            }
          }
        }
        // default to NA
        if (!returnType[name]) {
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

  getReturnTypesForAllCqlFunctions(elmJson: string): {
    [key: string]: string;
  } {
    if (!elmJson) {
      return {};
    }

    const elm = JSON.parse(elmJson);
    const functions = elm.library?.statements?.def?.filter(
      (func) => func.type === "FunctionDef"
    );

    if (functions) {
      return functions.reduce((returnTypes, func) => {
        const returnType = {};
        const name = _.camelCase(_.trim(func.name));
        if (
          func?.operand.length === 1 &&
          _.camelCase(
            func.operand[0].operandTypeSpecifier?.name?.split("}")[1]
          ) !== "boolean"
        ) {
          const operandSpecifier = func.operand[0].operandTypeSpecifier;
          // argument type that we are checking must match population basis
          // discarding list and interval as valid because we don't have any suitable value for them in population basis
          if (
            operandSpecifier?.name &&
            operandSpecifier?.type === "NamedTypeSpecifier"
          ) {
            returnType[name] = operandSpecifier?.name?.split("}")[1];
          } else {
            returnType[name] = "N/A";
          }
        } else if (func?.operand.length < 1) {
          returnType[name] = "Boolean";
        } else {
          returnType[name] = "N/A";
        }
        return {
          ...returnTypes,
          ...returnType,
        };
      }, {});
    }

    return {};
  }

  async searchMeasuresByMeasureNameOrEcqmTitle(
    filterByCurrentUser: boolean,
    limit: number = 25,
    page: number = 0,
    searchCriteria: string,
    signal
  ): Promise<any> {
    try {
      const encodedCriteria = encodeURI(searchCriteria);
      const response = await axios.get<any>(
        `${this.baseUrl}/measures/search`, // Changed to endpoint without path variable
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: {
            query: encodedCriteria, // putting encoded chars here doesn't trigger spring preflight failure
            currentUser: filterByCurrentUser,
            limit,
            page,
          },
          signal,
        }
      );
      return response.data;
    } catch (err) {
      if (err.message === "canceled") {
        throw new Error(err.message);
      }
      const message = `Unable to search measures`;
      console.error(message);
      console.error(err);
      throw new Error(message);
    }
  }

  // this expects endpoint should return a success or error message, no content
  async checkValidVersion(id: string, versionType: string): Promise<any> {
    return await axios.get<any>(
      `${this.baseUrl}/measures/${id}/version?versionType=${versionType}`,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }

  async createVersion(id: string, versionType: string): Promise<Measure> {
    return await axios.put(
      `${this.baseUrl}/measures/${id}/version?versionType=${versionType}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }

  async checkNextVersionNumber(id: string, versionType: string): Promise<any> {
    try {
      const response = await axios.get<any>(
        `${this.baseUrl}/measures/${id}/next-version?versionType=${versionType}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message = `Unable to calculate next version`;
      console.error(message);
      console.error(err);
    }
  }

  async createCmsId(measureSetId: string): Promise<any> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/measures/${measureSetId}/create-cms-id`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message = this.buildErrorMessage(err, "Failed to create cms id.");
      console.error(message, err);
      throw new Error(message);
    }
  }

  // add abort signal.
  async getMeasureExport(measureId: string, signal): Promise<AxiosResponse> {
    return await axios.get(`${this.baseUrl}/measures/${measureId}/exports`, {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
      responseType: "blob",
      signal,
    });
  }

  async draftMeasure(
    measureId: string,
    model: string,
    measureName: string
  ): Promise<Measure> {
    return await axios.post(
      `${this.baseUrl}/measures/${measureId}/draft`,
      { measureName: measureName, model: model },
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }
}

export default function useMeasureServiceApi(): MeasureServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.measureService;

  return new MeasureServiceApi(baseUrl, getAccessToken);
}
