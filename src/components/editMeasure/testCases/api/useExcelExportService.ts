import axios from "../../../../api/axios-instance";
import useServiceConfig from "../../../../api/useServiceConfig";
import { ServiceConfig } from "../../../../api/ServiceContext";
import { OverlappingCodeDto } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";

export class ExcelExportService {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async getOverlappingValueSets(
    overlappingCodes: OverlappingCodeDto[],
    abortController: AbortController
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/excel/overlapping-codes`,
        overlappingCodes,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            "Accept-Encoding": "application/vnd.ms-excel",
          },
          signal: abortController.signal,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          responseType: "blob",
        }
      );
      return response;
    } catch (err) {
      console.error("getOverlappingValueSets error", err);
      throw new Error(
        "An error occurred, please try again. If the error persists, please contact the help desk."
      );
    }
  }
}

export default function useExcelExportService(): ExcelExportService {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.excelExportService;

  return new ExcelExportService(baseUrl, getAccessToken);
}
