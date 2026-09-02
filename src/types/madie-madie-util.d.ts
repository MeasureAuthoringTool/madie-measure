declare module "@madie/madie-util" {
  export function padCmsId(cmsId: number | string | null | undefined): string;
  export function formatCmsId(
    cmsId: number | string | null | undefined,
    model: string | null | undefined
  ): string;

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
    ReviewStatus,
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

  export interface FeatureFlags {
    enableQdmRepeatTransfer: boolean;
    qdmHideJson: boolean;
    qiCore7: boolean;
    QICoreCompositeMeasure: boolean;
    DisplayOwner: boolean;
    MakeJSONMatchUI: boolean;
    usQualityCore?: boolean;
    MeasureReviewStatus?: boolean;
  }

  export interface UserRoles {
    roles: string[];
    isAdmin: boolean;
    isReviewer: boolean;
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
    features?: {
      export?: boolean;
      qdmToFhirConversion?: boolean;
      qdmHideJson?: boolean;
      enableQdmRepeatTransfer?: boolean;
      EnhancedTextFormatting?: boolean;
      qiCore7?: boolean;
      QICoreCompositeMeasure?: boolean;
    };
  }

  export interface RouteHandlerState {
    canTravel: boolean;
    pendingRoute: string;
  }

  export interface MeasureReview {
    id: string;
    measureId: string;
    measureSetId: string;
    status: ReviewStatus;
    comment: string;
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

  export function useUserRoles(): UserRoles;

  export const featureFlagsStore: {
    subscribe: (
      setFeatureFlags: React.Dispatch<React.SetStateAction<FeatureFlags>>
    ) => import("rxjs").Subscription;
    updateFeatureFlags: (featureFlags: FeatureFlags | null) => void;
    initialState: FeatureFlags;
    state: FeatureFlags;
  };

  export const userRolesStore: {
    subscribe: (
      setUserRoles: React.Dispatch<React.SetStateAction<UserRoles>>
    ) => import("rxjs").Subscription;
    updateUserRoles: (roles: string[] | null) => void;
    initialState: UserRoles;
    state: UserRoles;
  };

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
    fetchMeasureBundle(measure: Measure, bundleType?: string): Promise<Bundle>;
    getMeasuresByMeasureSetId(
      measureSetId: string,
      sortByLatestVersion?: boolean,
      searchCriteria?: MeasureSearchCriteria
    ): Promise<any>;
    fetchMeasuresByIds(measureIds: string[]): Promise<any>;
    searchMeasuresByCriteria(
      ownershipTypes: OwnershipType[],
      limit: string | number,
      page: number,
      sort: string,
      direction: string,
      searchCriteria: MeasureSearchCriteria,
      abortController: AbortController
    ): Promise<any>;
    searchMeasuresInReview(
      ownershipTypes: OwnershipType[],
      limit: string | number,
      page: number,
      sort: string,
      direction: string,
      searchCriteria?: MeasureSearchCriteria,
      abortController?: AbortController
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
    getCqlDiff(oldMeasureId, newMeasureId): Promise<any>;
    getRecentMeasuresByMeasureSetId(measureSetIds: string[]): Promise<any>;
    getSharedMeasures(measureIds: string[]): Promise<any>;
    shareMeasures(measureUserIdMap: Map<string, string[]>): Promise<any>;
    unshareMeasures(measureUserIdMap: Map<string, string[]>): Promise<any>;
    getSharedAccessReportForMeasures(ids: Array<string>): Promise<Blob>;
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
    getHumanReadableDiff(oldMeasureId, newMeasureId): Promise<any>;
  }

  export class MeasureReviewServiceApi {
    constructor(baseUrl: string, getAccessToken: () => string);
    createMeasureReview(
      measureId: string,
      review: MeasureReview
    ): Promise<MeasureReview>;
    updateMeasureReview(
      measureId: string,
      review: MeasureReview
    ): Promise<MeasureReview>;
    getMeasureReview(measureId: string): Promise<MeasureReview | null>;
    getMeasureReviewsByMeasureSetId(
      measureSetId: string
    ): Promise<MeasureReview[]>;
  }

  export function useMeasureServiceApi(): MeasureServiceApi;
  export function useMeasureReviewServiceApi(): MeasureReviewServiceApi;
  export function useUserServiceApi(): UserServiceApi;
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

  export function useOwnerName(harpId: string): string;

  export function getOidFromString(
    oidString: string,
    dataModel: string
  ): string;

  export const bootstrap: LifeCycleFn<void>;
  export const mount: LifeCycleFn<void>;
  export const unmount: LifeCycleFn<void>;
  export const ApiContextProvider: React.Provider<ServiceConfig>;
  export const ApiContextConsumer: React.Consumer<ServiceConfig>;

  export function ExportAction(props: {
    measures: Measure[];
    onClick: (exportType: string) => void;
  }): React.ReactElement;
  export function ViewHRAction(props: {
    measures: Measure[];
    onClick: () => void;
  }): React.ReactElement;
  export function HistoryAction(props: {
    measures: Measure[];
    onClick: () => void;
  }): React.ReactElement;
  export function CompareVersionsAction(props: {
    measures: Measure[];
    onClick: () => void;
  }): React.ReactElement;
  export function ShareAction(props: {
    measures: Measure[];
    onClick: (option: string) => void;
    isOwner?: boolean;
    isSharedWithUser?: boolean;
    activeTab: number;
  }): React.ReactElement;
  export function TransferAction(props: {
    measures: Measure[];
    onClick: () => void;
    activeTab: number;
  }): React.ReactElement;

  export function ExportDialog(props: {
    downloadState?: string | null;
    failureMessage?: string | string[] | null;
    measureName?: string;
    open: boolean;
    handleContinueDialog?: () => void;
    handleCancelDialog?: () => void;
  }): React.ReactElement | null;
  export function ExportIcon(props: {
    downloadState: string;
  }): React.ReactElement | null;
  export function ViewHRModal(props: {
    open: boolean;
    onClose: () => void;
    exportMeasure?: (elmErrorSeverity: string) => void;
    measureId: string;
  }): React.ReactElement | null;
  export function ViewMeasureHistoryDialog(props: {
    measures: Measure[];
    open: boolean;
    onClose: Function;
  }): React.ReactElement | null;
  export function CompareVersionsDialog(props: {
    measures: Measure[] | null | undefined;
    open: boolean;
    onClose: Function;
  }): React.ReactElement | null;
  export function ShareDialog(props: {
    measures: Measure[];
    open: boolean;
    option: string;
    onClose: Function;
    onSave: Function;
    isAdmin?: boolean;
  }): React.ReactElement | null;
  export function TransferDialog(props: {
    measures: Measure[];
    open: boolean;
    onClose: Function;
    setStatusHandler: Function;
    isAdminTransfer?: boolean;
  }): React.ReactElement | null;
  export function ManageReviewDialog(props: {
    open: boolean;
    onClose: () => void;
    entityType: "measure" | "library";
    entityId?: string;
    entitySetId?: string;
    onSuccess?: () => void | Promise<void>;
  }): React.ReactElement | null;
  export const REVIEW_STATUS_OPTIONS: string[];
  export function getNewestMeasureInstance(measures: Measure[]): Measure;

  export function exportMeasure(
    setFailureMessage: (msg: string | string[] | null) => void,
    setDownloadState: (state: string | null) => void,
    abortController: { current: AbortController | null },
    measure: Measure,
    measureServiceApi: MeasureServiceApi,
    setToastOpen: (open: boolean) => void,
    setToastType: (type: string) => void,
    setToastMessage: (message: string) => void,
    elmErrorSeverity: string,
    bundleType?: string
  ): Promise<void>;
  export function downloadZipFile(
    exportData: any,
    ecqmTitle: string,
    model: string,
    version: string,
    warn: boolean,
    setToastOpen: (open: boolean) => void,
    setToastType: (type: string) => void,
    setToastMessage: (message: string) => void,
    setDownloadState: (state: string | null) => void
  ): void;
  export function generateTimestampedFileName(
    baseName: string,
    extension: string
  ): string;
  export function parseErrorMessageFromBlob(blob: Blob): Promise<string | null>;
  export const EXPORT_FAILURE_MESSAGE: string;

  export const COMPOSITE_VALIDATION_MESSAGES: {
    TWO_COMPONENTS_REQUIRED: string;
    SCORING_MUST_BE_COMPOSITE: string;
    COMPOSITE_SCORING_REQUIRED: string;
    COMPOSITE_SCORING_INVALID: string;
    COMPONENT_MEASURE_TYPES_INVALID: string;
    COMPONENT_POPULATION_BASIS_INVALID: string;
    UNABLE_TO_VALIDATE_COMPONENTS: string;
  };
  export const compositeScoringValues: string[];
  export function getAllowedScoringTypes(compositeScoring: string): string[];
  export function validateCompositeMeasure(
    measure: Measure,
    measureServiceApi: MeasureServiceApi
  ): Promise<string[]>;
}
