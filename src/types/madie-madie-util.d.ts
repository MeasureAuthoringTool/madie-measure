declare module "@madie/madie-util" {
  import { LifeCycleFn } from "single-spa";
  import {
    Measure,
    Acl,
    TestCase,
    MeasureSearchCriteria,
    TestCaseConfiguration,
    EndorsementOrganization,
    MeasureHistoryActions,
    OwnershipType,
    MeasureSet,
  } from "@madie/madie-models";
  import { Bundle } from "fhir/r4";

  export type OktaConfig = {
    baseUrl: string;
    issuer: string;
    clientId: string;
    redirectUri: string;
    scopes: string[];
    useClassicEngine: boolean;
  };

  interface FeatureFlags {
    enableQdmRepeatTransfer: boolean;
    qiCoreElementsTab: boolean;
    qdmHideJson: boolean;
    stu6TestCaseValidation: boolean;
    MeasureSearch: boolean;
    Locking: boolean;
    qiCore7: boolean;
    TransferMeasure: boolean;
    MeasureHistory: boolean;
    Calculator: boolean;
    CompareMeasureVersions: boolean;
    ExecutionConfigurationTab: boolean;
  }

  export interface ServiceConfig {
    measureService: {
      baseUrl: string;
    };
    elmTranslationService: {
      baseUrl: string;
    };
    terminologyService: {
      baseUrl: string;
    };
  }

  export interface RouteHandlerState {
    canTravel: boolean;
    pendingRoute: string;
  }

  export const measureStore: {
    subscribe: (
      setMeasureState: React.Dispatch<React.SetStateAction<Measure>>
    ) => import("rxjs").Subscription;
    updateMeasure: (measure: Measure | null) => void;
    updateTestCases: (testCases: TestCase[] | null) => void;
    initialState: null;
    state: Measure;
  };

  export const routeHandlerStore: {
    subscribe: (
      setRouteHandlerState: React.Dispatch<React.SetStateAction<object>>
    ) => import("rxjs").Subscription;
    updateRouteHandlerState: (routeHandlerState: RouteHandlerState) => void;
    initialState: RouteHandlerState;
    state: RouteHandlerState;
  };

  export function useFeatureFlags(): FeatureFlags;

  export function useServiceConfig(): ServiceConfig;
  export function getServiceConfig(): Promise<ServiceConfig>;
  export function getOktaConfig(): Promise<OktaConfig>;

  export function useKeyPress(targetKey: any): boolean;
  export const useOktaTokens: (storageKey?: string) => {
    getAccessToken: () => any;
    getAccessTokenObj: () => any;
    getUserName: () => any;
    getIdToken: () => any;
    getIdTokenObj: () => any;
  };
  export function useOnClickOutside(ref: any, handler: any): void;
  export function wafIntercept(): void;

  export class TerminologyServiceApi {
    constructor(baseUrl: string, getAccessToken: () => string);
    checkLogin(): Promise<Boolean>;
    loginUMLS(apiKey: string): Promise<string>;
  }

  export function useTerminologyServiceApi(): TerminologyServiceApi;

  export class MeasureServiceApi {
    constructor(baseUrl: string, getAccessToken: () => string);
    fetchMeasure(id: string): Promise<Measure>;
    fetchMeasureBundle(measure: Measure): Promise<Bundle>;
    getMeasuresByMeasureSetId(
      measureSetId: string,
      sortByLatestVersion?: boolean,
      searchCriteria?: MeasureSearchCriteria
    ): Promise<any>;
    searchMeasuresByCriteria(
      ownershipTypes: OwnershipType[],
      limit: string | number,
      page: number,
      sort: string,
      direction: string,
      searchCriteria: MeasureSearchCriteria,
      abortController: AbortController,
      invocationSource?: string
    ): Promise<any>;

    createVersion(id: string, versionType: string): Promise<any>;
    checkValidVersion(id: string, versionType: string): Promise<any>;
    checkNextVersionNumber(id: string, versionType: string): Promise<any>;
    draftMeasure(
      measureId: string,
      model: string,
      measureName: string
    ): Promise<any>;
    associateCmsId(
      qiCoreMeasureId: string,
      qdmMeasureId: string,
      copyMetaData: boolean
    ): Promise<MeasureSet>;
    deleteMeasure(id: string): Promise<any>;
    unlockMeasures(): Promise<String>;
    unlockMeasure(measureId: string): Promise<any>;
    updateMeasureLock(measureId: string): Promise<any>;
    fetchHumanReadable(id: string): Promise<string>;
    fetchMeasureDraftStatuses(measureSetIds: string[]): Promise<any>;
    getRecentMeasuresByMeasureSetId(measureSetIds: string[]): Promise<any>;
    getSharedMeasures(measureIds: string[]): Promise<any>;
    shareMeasures(measureUserIdMap: Map<string, string[]>): Promise<any>;
    unshareMeasures(measureUserIdMap: Map<string, string[]>): Promise<any>;
    transferMeasures(
      measureIds: Array<string>,
      harpId: string,
      retainShareAccess: boolean
    ): Promise<any>;
    updateMeasure(measure: Measure): Promise<Response>;
    getMeasureHistoryLogs(measureId: string): Promise<MeasureHistoryActions[]>;
    getMeasureCounts(): Promise<any>;
    getAllEndorsers(): Promise<EndorsementOrganization[]>;
    createCmsId(measureSetId: string): Promise<any>;
    getReturnTypesForAllCqlFunctions(elmJson: string): {
      [key: string]: string;
    };
    getReturnTypesForAllCqlDefinitions(elmJson: string): {
      [key: string]: string;
    };
    getAllPopulationBasisOptions(): Promise<string[]>;
    updateMeasureTestCaseConfiguration(
      testCaseConfig: TestCaseConfiguration,
      measureId: String
    ): Promise<Response>;
    getAllOrganizations(): Promise<Organization[]>;
    updateGroup(group: Group, measureId: string): Promise<Group>;
    createGroup(group: Group, measureId: string): Promise<Group>;
    deleteMeasureGroup(groupId: string, measureId: string): Promise<Measure>;
    checkTestCasesLocked(measureId: string): Promise<boolean>;
    getCqmMeasure(
      measureId: String,
      abortController: AbortController
    ): Promise<Response>;
  }

  export function useMeasureServiceApi(): MeasureServiceApi;
  export function useDocumentTitle(
    title: string,
    prevailOnMount?: boolean
  ): void;

  export function checkUserCanEdit(
    createdBy: string,
    acls: Array<Acl>,
    draft?: boolean
  ): boolean;

  export function checkUserCanDelete(
    createdBy: string,
    draft?: boolean
  ): boolean;

  export function wafIntercept(): void;

  export function getOidFromString(
    oidString: string,
    dataModel: string
  ): string;

  export const bootstrap: LifeCycleFn<void>;
  export const mount: LifeCycleFn<void>;
  export const unmount: LifeCycleFn<void>;
  export const ApiContextProvider: React.Provider<ServiceConfig>;
  export const ApiContextConsumer: React.Consumer<ServiceConfig>;
}
