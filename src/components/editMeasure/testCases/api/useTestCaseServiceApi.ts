import { AxiosResponse } from "axios";
import axios from "../../../../api/axios-instance";
import useServiceConfig from "../../../../api/useServiceConfig";
import { ServiceConfig } from "../../../../api/ServiceContext";
import {
  GroupedStratificationDto,
  HapiOperationOutcome,
  Measure,
  PopulationDto,
  TestCase,
  TestCaseImportRequest,
} from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import { ScanValidationDto } from "./models/ScanValidationDto";
import { MadieError } from "../util/Utils";

export interface QrdaTestCaseDTO {
  testCaseId: string;
  lastName: string;
  firstName: string;
  populations: Array<PopulationDto>;
  stratifications?: Array<GroupedStratificationDto>;
}

export interface QrdaGroupExportDTO {
  groupId: string;
  groupNumber: string;
  coverage: string;
  testCaseDTOs: QrdaTestCaseDTO[];
}

export type QrdaRequestDTO = {
  measure: Measure;
  groupDTOs: QrdaGroupExportDTO[];
};

export interface CopyResult {
  copiedTestCases: TestCase[];
  didClearExpectedValues: boolean;
}

export class TestCaseServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async createTestCase(testCase: TestCase, measureId: string) {
    try {
      const response = await axios.post<TestCase>(
        `${this.baseUrl}/measures/${measureId}/test-cases`,
        testCase,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      if (err?.response?.status === 400) {
        throw new Error(err.response.data.message);
      }
      const message = `Unable to create new test case`;
      throw new Error(message);
    }
  }

  async getTestCasesByMeasureId(measureId: string): Promise<TestCase[]> {
    try {
      const response = await axios.get<TestCase[]>(
        `${this.baseUrl}/measures/${measureId}/test-cases`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data || [];
    } catch (err) {
      const message = "Unable to retrieve test cases, please try later.";
      throw new Error(message);
    }
  }

  async getTestCase(
    testCaseId: string,
    measureId: string,
    validateTest: boolean
  ): Promise<TestCase> {
    try {
      const response = await axios.get<TestCase>(
        `${this.baseUrl}/measures/${measureId}/test-cases/${testCaseId}`,
        {
          params: { validate: validateTest },
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      // TODO: throw err to continue to display 404 page or
      //  throw with message to swap to error message?
      const message = "Unable to retrieve test case, please try later.";
      throw new Error(err);
    }
  }

  async getTestCaseSeriesForMeasure(measureId: string): Promise<string[]> {
    try {
      const response = await axios.get<string[]>(
        `${this.baseUrl}/measures/${measureId}/test-cases/series`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      if (err?.response?.status === 404) {
        console.warn(
          `Cannot load series for non-existent measure with id [${measureId}]`,
          err
        );
        throw new Error(
          "Measure does not exist, unable to load test case series!"
        );
      }
      const message = "Unable to retrieve test case series, please try later.";
      throw new Error(message);
    }
  }

  async updateTestCase(testCase: TestCase, measureId: string) {
    try {
      const response = await axios.put<TestCase>(
        `${this.baseUrl}/measures/${measureId}/test-cases/${testCase.id}`,
        testCase,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      if (err?.response?.status === 400) {
        throw new MadieError(err.response.data.message);
      }
      const message = `Unable to update test case`;
      throw new Error(message);
    }
  }

  async deleteTestCaseByTestCaseId(measureId: string, testCaseId: string) {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/measures/${measureId}/test-cases/${testCaseId}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message = `Unable to delete test case`;
      throw new Error(message);
    }
  }

  async deleteTestCases(measureId: string, testCaseIds: string[]) {
    return await axios.delete(
      `${this.baseUrl}/measures/${measureId}/test-cases`,
      {
        data: [...testCaseIds],
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }

  async importTestCases(
    measureId: string,
    testCasesImportRequest: TestCaseImportRequest[]
  ): Promise<AxiosResponse> {
    return await axios.put(
      `${this.baseUrl}/measures/${measureId}/test-cases/imports`,
      testCasesImportRequest,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }

  async exportTestCases(
    measureId: string,
    bundleType: string,
    testCaseIds: string[],
    signal
  ): Promise<AxiosResponse> {
    return await axios.put(
      `${this.baseUrl}/measures/${measureId}/test-cases/exports`,
      testCaseIds,
      {
        params: { bundleType: bundleType },
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        responseType: "blob",
        signal,
      }
    );
  }

  async validateTestCaseBundle(bundle: any, model: string) {
    try {
      const response = await axios.post<HapiOperationOutcome>(
        `${this.baseUrl}/validations/bundles`,
        bundle,
        {
          params: { model: model },
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message = `Unable to validate test case bundle`;
      throw new Error(message);
    }
  }

  async createTestCases(
    measureId: string,
    testCases: TestCase[]
  ): Promise<TestCase[]> {
    try {
      const response = await axios.post<TestCase[]>(
        `${this.baseUrl}/measures/${measureId}/test-cases/list`,
        testCases,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      throw new Error(`Unable to create new test cases`);
    }
  }

  async scanImportFile(file: any): Promise<ScanValidationDto> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post<ScanValidationDto>(
        `${this.baseUrl}/validations/files`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (err) {
      throw new Error(
        "Unable to scan the import file. Please try again later."
      );
    }
  }

  async exportQRDA(
    measureId: string,
    requestDto: QrdaRequestDTO
  ): Promise<Blob> {
    const response = await axios.put(
      `${this.baseUrl}/measures/${measureId}/test-cases/qrda`,
      requestDto,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        responseType: "blob",
      }
    );
    return response.data;
  }

  async shiftQdmTestCaseDates(
    measureId: string,
    testCaseIds: string[],
    shifted: number
  ) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/measures/${measureId}/test-cases/qdm/shift-dates`,
        testCaseIds,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: { shifted: shifted },
        }
      );
      if (!response || !response.data) {
        throw new Error(`Unable to shift test case dates`);
      }
      return response.data;
    } catch (err) {
      const message = `Unable to shift test case dates`;
      throw new Error(message);
    }
  }

  async shiftQiCoreTestCaseDates(
    measureId: string,
    testCaseIds: string[],
    shifted: number
  ) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/measures/${measureId}/test-cases/qicore/shift-dates`,
        testCaseIds,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: { shifted: shifted },
        }
      );
      if (!response || !response.data) {
        throw new Error(`Unable to shift test case dates`);
      }
      return response.data;
    } catch (err) {
      const message = `Unable to shift test case dates`;
      throw new Error(message);
    }
  }

  async shiftAllQdmTestCaseDates(measureId: string, shifted: number) {
    const response = await axios.get(
      `${this.baseUrl}/measures/${measureId}/test-cases/qdm/shift-all-dates`,
      {
        params: { shifted: shifted },
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
    if (!response || !response.data) {
      throw new Error(`Unable to shift test case dates`);
    }
    return response.data;
  }

  async shiftAllQiCoreTestCaseDates(
    measureId: string,
    shifted: number
  ): Promise<string[]> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/measures/${measureId}/test-cases/qicore/shift-all-dates`,
        null,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: { shifted: shifted },
        }
      );
      if (!response || !response.data) {
        throw new Error(`Unable to shift test case dates`);
      }
      return response.data;
    } catch (err) {
      const message = `Unable to shift test case dates`;
      throw new Error(message);
    }
  }

  async copyTestCasesToMeasure(
    sourceMeasureId: string,
    targetMeasureId: string,
    testCaseIds: string[]
  ): Promise<CopyResult> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/measures/${sourceMeasureId}/test-cases/copy-to?targetMeasureId=${targetMeasureId}`,
        testCaseIds,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      if (!response || !response.data) {
        throw new Error(`Unable to copy test cases`);
      }
      return response.data;
    } catch (err) {
      const message = `Unable to copy test cases`;
      throw new Error(message);
    }
  }

  async lockTestCase(measureId: string, testCaseId: string): Promise<any> {
    try {
      const response = await axios.post<string>(
        `${this.baseUrl}/measures/${measureId}/test-cases/${testCaseId}/lock`,
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

  async unlockTestCase(testCaseId: string): Promise<any> {
    try {
      const response = await axios.delete<string>(
        `${this.baseUrl}/test-cases/${testCaseId}/unlock`,
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

const useTestCaseServiceApi = (): TestCaseServiceApi => {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  return new TestCaseServiceApi(
    serviceConfig?.testCaseService.baseUrl,
    getAccessToken
  );
};

export default useTestCaseServiceApi;
