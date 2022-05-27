import axios from "axios";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import { CustomCqlCode } from "../components/measureEditor/MeasureEditor";
import { processCodeSystemErrors } from "../components/measureEditor/measureEditorUtils";
import { useOktaTokens } from "@madie/madie-util";

export type FHIRValueSet = {
  resourceType: string;
  id: string;
  url: string;
  status: string;
  errorMsg: string;
};

export class TerminologyServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async getValueSet(
    tgt: string,
    oid: string,
    locator: string
  ): Promise<FHIRValueSet> {
    let fhirValueset: FHIRValueSet = null;
    const resp = await axios
      .get(`${this.baseUrl}/vsac/valueSet`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
          "Content-Type": "text/plain",
        },
        params: {
          tgt: tgt,
          oid: oid,
        },
        timeout: 15000,
      })
      .then((resp) => {
        fhirValueset = resp.data;
        fhirValueset = { ...fhirValueset, status: resp.statusText };
      })
      .catch((error) => {
        const message =
          error.message + " for oid = " + oid + " location = " + locator;
        console.warn("useTerminologyServiceApi error: " + message);
        fhirValueset = {
          resourceType: "ValueSet",
          id: oid,
          url: locator,
          status: error.status,
          errorMsg: message,
        };
      });
    return fhirValueset;
  }

  async validateCodes(
    customCqlCodes: CustomCqlCode[],
    tgt: string
  ): Promise<CustomCqlCode[]> {
    if (!tgt || tgt === "") {
      return processCodeSystemErrors(
        customCqlCodes,
        "Please Login to UMLS",
        false
      );
    }
    try {
      const response = await axios.put(
        `${this.baseUrl}/vsac/validations/codes`,
        customCqlCodes,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: {
            tgt: tgt,
          },
        }
      );
      if (response.status === 200) {
        return response.data;
      } else if (response.status === 401) {
        return processCodeSystemErrors(
          customCqlCodes,
          "Invalid UMLS Login",
          false
        );
      } else {
        return processCodeSystemErrors(
          customCqlCodes,
          "Unable to validate code, Please contact HelpDesk",
          false
        );
      }
    } catch (err) {
      return processCodeSystemErrors(
        customCqlCodes,
        "Unable to validate code, Please contact HelpDesk",
        false
      );
    }
  }
}

export default function useTerminologyServiceApi(): TerminologyServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  return new TerminologyServiceApi(
    serviceConfig.terminologyService?.baseUrl,
    getAccessToken
  );
}
