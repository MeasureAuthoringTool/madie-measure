import axios from "../../../../api/axios-instance";
import useServiceConfig from "../../../../api/useServiceConfig";
import { ServiceConfig } from "../../../../api/ServiceContext";
import { useOktaTokens } from "@madie/madie-util";
import { Bundle, Library, Measure, ValueSet } from "fhir/r4";
import { CqmMeasure, CQL, ValueSet as QdmValueSet } from "cqm-models";
import * as _ from "lodash";
import md5 from "blueimp-md5";
import { ManifestExpansion } from "@madie/madie-models";

export type ValueSetSearchParams = {
  oid: string;
  release?: string;
  version?: string;
};

type ValueSetsSearchCriteria = {
  includeDraft: "yes" | "no";
  activeOnly: string;
  manifestExpansion: ManifestExpansion;
  valueSetParams: ValueSetSearchParams[];
};

type CQLCodeWithCodeSystemOid = {
  cqlCode: CQL.CQLCode;
  codeSystemOid: string;
};

export class TerminologyServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async getExpansion(valueSetParams: ValueSetSearchParams[]) {
    if (!valueSetParams?.length) {
      return [];
    }
    const searchCriteria = {
      includeDraft: "yes", // always yes for now
      activeOnly: "false",
      manifestExpansion: null, // always latest until we support manifest for QICore
      valueSetParams: valueSetParams,
    } as ValueSetsSearchCriteria;
    try {
      const response = await axios.put(
        `${this.baseUrl}/terminology/value-sets/expansion/fhir`,
        searchCriteria,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      let message =
        "An error occurred, please try again. If the error persists, please contact the help desk. (003)";
      if (error.response && error.response.status === 404) {
        const data = error.response.data?.message;
        console.error(
          "ValueSet not found in vsac: ",
          this.getOidFromString(data)
        );
        message =
          "An error exists with the measure CQL, please review the CQL Editor tab.";
      }
      throw new Error(message);
    }
  }

  async getValueSetsExpansionForBundle(
    measureBundle: Bundle
  ): Promise<ValueSet[]> {
    if (!measureBundle) {
      return [];
    }
    const valueSetSearchParams = this.getValueSetsOIdsFromBundle(measureBundle);
    return this.getExpansion(valueSetSearchParams);
  }

  async getValueSetsExpansionForOids(oids: string[]): Promise<ValueSet[]> {
    if (!oids) {
      return [];
    }
    const valueSetSearchParams = oids.map((oid) => {
      return { oid: oid };
    });
    return this.getExpansion(valueSetSearchParams);
  }

  async getQdmValueSetsExpansion(
    cqmMeasure: CqmMeasure,
    manifestExpansion: ManifestExpansion,
    signal: AbortSignal
  ): Promise<QdmValueSet[]> {
    if (!cqmMeasure) {
      return null;
    }
    const searchCriteria: ValueSetsSearchCriteria = {
      includeDraft: "yes", // always yes for now
      activeOnly: manifestExpansion ? "true" : "false",
      manifestExpansion: manifestExpansion,
      valueSetParams: this.getValueSetsOIDsFromCqmMeasure(
        JSON.parse(JSON.stringify(cqmMeasure))
      ),
    };

    let path = "/terminology/value-sets/expansion/qdm";

    if (_.isEmpty(searchCriteria.valueSetParams)) {
      return [];
    }

    try {
      const response = await axios.put(
        `${this.baseUrl}${path}`,
        searchCriteria,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          signal,
        }
      );
      return response.data;
    } catch (error) {
      // preserve original error to bubble to getQDMValuesets
      if (error.code === "ERR_CANCELED") {
        throw error;
      }
      let message =
        "An error occurred, please try again. If the error persists, please contact the help desk. (004)";
      if (error.response?.data?.diagnostic) {
        const data = error.response.data;
        message = `Value Set ${data?.valueSet} could not be expanded using ${
          data?.manifest === undefined ? "Latest" : "Manifest " + data.manifest
        }. Per VSAC, \"${data.diagnostic}\"`;
      }
      throw new Error(message);
    }
  }

  getValueSetsOIDsFromCqmMeasure(
    cqmMeasure: CqmMeasure
  ): ValueSetSearchParams[] {
    return cqmMeasure?.source_data_criteria
      ?.filter((criteria) => !criteria.codeListId.startsWith("drc-"))
      .map((criteria) => {
        return {
          oid: criteria.codeListId,
        } as ValueSetSearchParams;
      });
  }

  /**
   * Extract the ValueSet OIDs used in measure & including libraries
   */
  getValueSetsOIdsFromBundle(measureBundle: Bundle): ValueSetSearchParams[] {
    if (!measureBundle?.entry) {
      return [];
    }
    const measureEntry = measureBundle.entry.find(
      (entry) => entry.resource?.resourceType === "Measure"
    );
    if (!measureEntry) {
      return [];
    }
    const measure = measureEntry.resource as Measure;
    const moduleDefinition = measure.contained as Library[];
    if (!moduleDefinition?.length) {
      return [];
    }

    return moduleDefinition[0].relatedArtifact?.reduce((oids, artifact) => {
      if (artifact.resource?.includes("ValueSet/")) {
        const valueSetOid = artifact.resource.split("/ValueSet/")[1];
        oids.push({ oid: valueSetOid });
      }
      return oids;
    }, [] as ValueSetSearchParams[]);
  }

  getOidFromString(oidString: string): string {
    const oidRegex = /[0-2](\.(0|[1-9][0-9]*))+/;
    const match = oidString?.match(oidRegex);
    if (match) {
      return match[0];
    }
    return null;
  }

  getValueSetsForDRCs(cqmMeasure: CqmMeasure): ValueSet[] {
    const drcValueSets = [];
    const cqlCodeWithCodeSystemOid: CQLCodeWithCodeSystemOid[] =
      this.getCqlCodesForDRCs(cqmMeasure);
    if (cqlCodeWithCodeSystemOid) {
      cqlCodeWithCodeSystemOid.forEach(({ cqlCode, codeSystemOid }) => {
        const drcOid = this.getDrcOid(cqmMeasure, cqlCode.code);
        const valueSet = {
          oid:
            drcOid ??
            `drc-${md5(cqlCode.system + cqlCode.code + cqlCode.version)}`,
          version: cqlCode.version,
          concepts: [
            {
              code: cqlCode.code,
              code_system_oid: codeSystemOid,
              code_system_name: cqlCode.system,
              code_system_version: cqlCode.version,
              display_name: cqlCode.display,
            },
          ],
          display_name: cqlCode.display,
        };
        drcValueSets.push(valueSet);
      });
    }
    return drcValueSets;
  }

  getCqlCodesForDRCs(cqmMeasure: CqmMeasure): CQLCodeWithCodeSystemOid[] {
    const cqlCodeWithCodeSystemOid: CQLCodeWithCodeSystemOid[] = [];
    cqmMeasure?.cql_libraries?.forEach((library) => {
      const codeDefs = library?.elm?.library?.codes?.def;
      const codeSystemDefs = library?.elm?.library?.codeSystems?.def;
      if (!_.isEmpty(codeDefs)) {
        codeDefs.forEach((def) => {
          // find associated CodeSystem for this code, so that we can get codeSystem oid
          const codeSystem = codeSystemDefs.find(
            (cs) => cs.name === def.codeSystem.name
          );
          const csVersion = codeSystem.version ? codeSystem.version : "N/A";
          const cqlCode = new CQL.Code(
            def?.id, //code
            def.codeSystem.name, //system
            csVersion, //version,
            def.display //display
          );
          cqlCodeWithCodeSystemOid.push({
            cqlCode: cqlCode,
            codeSystemOid: codeSystem.id,
          });
        });
      }
    });
    return cqlCodeWithCodeSystemOid;
  }

  getDrcOid(cqmMeasure: CqmMeasure, code: string): string {
    const find = cqmMeasure?.source_data_criteria?.find(
      (source) => source.codeId === code
    );
    return find?.desc;
  }

  async getManifestList() {
    return await axios.get(`${this.baseUrl}/terminology/manifest-list`, {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
  }

  async getInternalValueSetExpansion(valueSetUrl: string): Promise<ValueSet> {
    try {
      const response = await axios.get<ValueSet>(
        `${this.baseUrl}/internal-terminology/ValueSet/expand?url=${valueSetUrl}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `An error occurred while fetching the ValueSet expansion for [${valueSetUrl}]: `,
        error
      );
    }
    return null;
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
