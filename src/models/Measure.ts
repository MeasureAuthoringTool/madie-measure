import { Model } from "./Model";
import { MeasureScoring } from "./MeasureScoring";

export interface MeasureMetadata {
  measureSteward?: string;
  measureDescription?: string;
}

export default interface Measure {
  id: string;
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
}
