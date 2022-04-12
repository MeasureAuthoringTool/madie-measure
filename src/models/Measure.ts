import { Model } from "./Model";
import { MeasureScoring } from "./MeasureScoring";
import { PopulationType } from "./MeasurePopulation";

export interface MeasureMetadata {
  steward?: string;
  description?: string;
  copyright?: string;
  disclaimer?: string;
  rationale?: string;
  author?: string;
  guidance?: string;
}

export interface Group {
  id: string;
  scoring?: string;
  population?: PopulationType;
  groupDescription?: string;
}

export default interface Measure {
  id: string;
  active: boolean;
  measureHumanReadableId: string;
  measureSetId: string;
  version: number;
  revisionNumber: number;
  state: string;
  measureName: string;
  cqlLibraryName: string;
  measureScoring: MeasureScoring | "";
  cql: string;
  createdAt: string;
  createdBy: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  model: Model | "";
  measureMetaData?: MeasureMetadata;
  measurementPeriodStart: Date;
  measurementPeriodEnd: Date;
  groups?: Array<Group>;
  elmJson?: string;
}
