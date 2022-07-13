declare module "@madie/madie-editor" {
  import { FC } from "react";
  import { LifeCycleFn } from "single-spa";
  import { CqlCode, CqlCodeSystem } from "@madie/cql-antlr-parser/dist/src";

  export type EditorAnnotation = {
    row?: number;
    column?: number;
    text: string;
    type: string;
  };

  export interface Point {
    row: number;
    column: number;
  }
  export interface Range {
    start: Point;
    end: Point;
  }

  export type EditorErrorMarker = {
    range: Range;
    clazz: string;
    type: "text" | null;
  };

  export interface LineInfo {
    line: number;
    position: number;
  }

  export interface CqlError {
    text?: string;
    name?: string;
    start?: LineInfo;
    stop?: LineInfo;
    message: string;
  }

  export type ElmTranslationError = {
    startLine: number;
    startChar: number;
    endChar: number;
    endLine: number;
    errorSeverity: string;
    errorType: string;
    message: string;
    targetIncludeLibraryId: string;
    targetIncludeLibraryVersionId: string;
    type: string;
  };

  export type ElmTranslationLibrary = {
    annotation: any[];
    contexts: any;
    identifier: any;
    parameters: any;
    schemaIdentifier: any;
    statements: any;
    usings: any;
    valueSets?: any;
  };

  export type ElmValueSet = {
    localId: any;
    locator: any;
    name: any;
    id: any;
  };

  export type ElmTranslation = {
    errorExceptions: ElmTranslationError[];
    externalErrors: any[];
    library: ElmTranslationLibrary;
  };

  export interface CustomCqlCodeSystem extends CqlCodeSystem {
    valid?: boolean;
    errorMessage?: string;
  }
  export interface CustomCqlCode extends Omit<CqlCode, "codeSystem"> {
    codeSystem: CustomCqlCodeSystem;
    valid?: boolean;
    errorMessage?: string;
  }

  export const parseContent: (content: string) => CqlError[];
  export const translateContentCqlToElm: (
    content: string
  ) => Promise<ElmTranslation>;
  export const validateContentCodes: (
    customCqlCodes: CustomCqlCode[],
    loggedInUMLS: boolean
  ) => Promise<ElmTranslationError[]>;
  export const validateContentValueSets: (
    valuesetsArray: ElmValueSet[],
    loggedInUMLS: boolean
  ) => Promise<ElmTranslationError[]>;

  export const MadieEditor: FC<{
    value: string;
    onChange: (value: string) => void;
    parseDebounceTime?: number;
    inboundAnnotations?: EditorAnnotation[];
    inboundErrorMarkers?: EditorErrorMarker[];
    height?: string;
    readOnly?: boolean;
  }>;
  export const bootstrap: LifeCycleFn<void>;
  export const mount: LifeCycleFn<void>;
  export const unmount: LifeCycleFn<void>;
}
