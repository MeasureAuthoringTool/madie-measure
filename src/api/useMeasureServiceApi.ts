import axios from "./axios-instance";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import {
  Measure,
  Group,
  Organization,
  EndorsementOrganization,
  MeasureSet,
  OwnershipType,
} from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import _ from "lodash";
import { MeasureSearchCriteria } from "../components/measureLanding/MeasureLanding";
import qs from "qs";

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
    try {
      const response = await axios.post<any>(
        `${this.baseUrl}/measures/draftstatus`,
        measureSetIds,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
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

  async getMeasuresByMeasureSetId(
    measureSetId: string,
    sortByLatestVersion?: boolean,
    searchCriteria?: MeasureSearchCriteria
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/measures/byMeasureSetId`,
        searchCriteria,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: {
            measureSetId: measureSetId,
            sortByLatestVersion: sortByLatestVersion,
          },
        }
      );
      if (response.data) {
        return response.data;
      }
    } catch (err) {
      console.error("Failed to get measures by measure set id ", err);
      throw err;
    }
  }
  async getRecentMeasuresByMeasureSetId(measureSetIds: string[]): Promise<any> {
    const idsParam = measureSetIds.join(",");
    try {
      const response = await axios.get(
        `${this.baseUrl}/measures/recentsByMeasureSetId`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: {
            measureSetIds: idsParam,
          },
        }
      );
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      console.error(
        "error requesting Measures By multiple measureSetIds ",
        error
      );
      throw error;
    }
  }

  async fetchMeasures(
    ownershipType: OwnershipType,
    limit: string | number = 25,
    page: number = 0,
    sort: string = "lastModifiedAt",
    direction: string = "DESC",
    signal
  ): Promise<any> {
    try {
      limit = limit === "All" ? 1000 : limit; // if limit is "All", set it to a high number to fetch all results
      const response = await axios.get<any>(`${this.baseUrl}/measures`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        params: {
          ownershipType,
          limit,
          page,
          sort,
          direction,
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

  async deleteMeasure(id: string): Promise<Response> {
    return await axios.delete(`${this.baseUrl}/measures/${id}/delete`, {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
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

  async searchMeasuresByCriteria(
    ownershipTypes: OwnershipType[],
    limit: string | number = 25,
    page: number = 0,
    sort: string = "lastModifiedAt",
    direction: string = "DESC",
    searchCriteria: MeasureSearchCriteria,
    abortController: AbortController,
    // TODO Remove parameter when either measureSearch or EditTestsOnVersionedMeasure is removed.
    invocationSource?: string
  ): Promise<any> {
    try {
      limit = limit === "All" ? 1000 : limit; // if limit is "All", set it to a high number to fetch all results
      const response = await axios.put<any>(
        `${this.baseUrl}/measures/searches`,
        searchCriteria,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            "Content-Type": "application/json",
          },
          params: {
            ownershipTypes,
            limit,
            page,
            sort,
            direction,
            invocationSource,
          },
          // Serialize ownershipTypes array as repeated params (?ownershipTypes=OWNED&ownershipTypes=SHARED)
          // By default, qs.stringify adds brackets (?ownershipTypes[]=OWNED&ownershipTypes[]=SHARED), which Spring does not parse.
          paramsSerializer: (params) =>
            qs.stringify(params, { arrayFormat: "repeat" }),
          signal: abortController.signal,
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

  async getSharedMeasures(measureIds: string[]): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/measures/shared?measureIds=${measureIds}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      console.error("Failed to get shared measures", err);
      throw err;
    }
  }

  async shareMeasures(measureUserIdMap: Map<string, string[]>): Promise<any> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/measures/shared`,
        Object.fromEntries(measureUserIdMap),
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      console.error("Failed to share measures", err);
      throw err;
    }
  }

  async unshareMeasures(measureUserIdMap: Map<string, string[]>): Promise<any> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/measures/unshared`,
        Object.fromEntries(measureUserIdMap),
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      console.error("Failed to unshare measures", err);
      throw err;
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

  async createVersion(id: string, versionType: string): Promise<any> {
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

  async getMeasureExport(
    measureId: string,
    elmErrorSeverity: string,
    signal
  ): Promise<any> {
    return await axios.get(`${this.baseUrl}/measures/${measureId}/exports`, {
      params: {
        elmErrorSeverity,
      },
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
  ): Promise<any> {
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

  async fetchHumanReadable(id: string): Promise<any> {
    try {
      const response = await axios.get<String>(
        `${this.baseUrl}/humanreadable/${id}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      const message = `Unable to fetch human readable for ${id}`;
      console.error(message, error);
      throw error;
    }
  }

  async getMeasureCounts(): Promise<any> {
    try {
      const response = await axios.get<String>(
        `${this.baseUrl}/measures/count`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      const message = `Unable to get measure counts`;
      console.error(message, error);
      throw error;
    }
  }

  async updateMeasureLock(measureId: string): Promise<any> {
    try {
      const response = await axios.put<String>(
        `${this.baseUrl}/measures/${measureId}/measure-lock`,
        null,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  }

  async unlockMeasure(measureId: string): Promise<any> {
    try {
      const response = await axios.delete<String>(
        `${this.baseUrl}/measures/${measureId}/measure-lock`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  }
}

export default function useMeasureServiceApi(): MeasureServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.measureService;

  return new MeasureServiceApi(baseUrl, getAccessToken);
}
