import axios from "axios";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import useOktaTokens from "../hooks/useOktaTokens";

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
}

export default function useTerminologyServiceApi(): TerminologyServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  return new TerminologyServiceApi(
    serviceConfig.terminologyService?.baseUrl,
    getAccessToken
  );
}
