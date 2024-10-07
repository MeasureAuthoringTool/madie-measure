declare module "@madie/madie-editor" {
  import { FC } from "react";
  import { LifeCycleFn } from "single-spa";

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
  export interface ValueSetForSearch {
    codeSystem?: string;
    name?: string;
    author?: string;
    composedOf?: string;
    effectiveDate?: string;
    lastReviewDate?: string;
    lastUpdated?: string;
    publisher?: string;
    purpose?: string;
    oid?: string;
    status?: string;
    steward?: string;
    title?: string;
    url?: string;
    version?: string;
    suffix?: string;
  }

  export interface IncludeLibrary {
    name: string;
    version: string;
    alias: string;
  }
  export interface Definition {
    definitionName?: string;
    comment?: string;
    expressionValue?: string;
  }

  export interface EditorPropsType {
    value: string;
    onChange?: (value: string) => void;
    handleApplyCode?: (code: Code) => void;
    handleApplyValueSet?: (vs: ValueSetForSearch) => void;
    handleApplyDefinition?: (def: Definition) => void;
    handleDefinitionEdit?: (lib: SelectedLibrary, def: Definition) => void;
    handleApplyLibrary?: (lib: SelectedLibrary) => void;
    handleEditLibrary?: (
      lib: SelectedLibrary,
      editedLib: IncludeLibrary
    ) => void;
    handleDeleteLibrary?: (lib: SelectedLibrary) => void;
    parseDebounceTime?: number;
    inboundAnnotations?: Ace.Annotation[];
    inboundErrorMarkers?: Ace.MarkerLike[];
    height?: string;
    readOnly?: boolean;
    validationsEnabled?: boolean;
    measureStoreCql?: string;
    cqlMetaData?: CqlMetaData;
    measureModel?: string;
    handleCodeDelete?: (code: string) => void;
    handleDefinitionDelete?: (definition: string) => void;
    setEditorVal?: Function;
    setIsCQLUnchanged?: Function;
    isCQLUnchanged?: boolean;
    resetCql?: () => void;
    getCqlDefinitionReturnTypes?: () => void;

    // conditional props used to pass up annotations outside of the editor
    setOutboundAnnotations?: Function;
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
  export interface ElmTranslationExternalError extends ElmTranslationError {
    libraryId: string;
    libraryVersion: string;
  }
  export interface ValidationResult {
    translation: ElmTranslation;
    errors: ElmTranslationError[];
    externalErrors: ElmTranslationExternalError[];
  }
  export type ElmTranslation = {
    errorExceptions: ElmTranslationError[];
    externalErrors: any[];
    library: ElmTranslationLibrary;
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
  export interface UpdatedCqlObject {
    cql: string;
    isLibraryStatementChanged?: boolean;
    isUsingStatementChanged?: boolean;
    isValueSetChanged?: boolean;
  }
  export const parseContent: (content: string) => CqlError[];
  export const validateContent: (content: string) => Promise<ValidationResult>;
  export const synchingEditorCqlContent: (
    editorVal: string,
    existingCql: string,
    libraryName: string,
    existingCqlLibraryName: string,
    versionString: string,
    usingName: string,
    usingVersion: string,
    triggeredFrom: string
  ) => Promise<UpdatedCqlObject>;

  export function isUsingEmpty(editorVal: string): boolean;

  export const MadieTerminologyEditor: FC<EditorPropsType>;
  export const MadieEditor: FC<EditorPropsType>;

  export const bootstrap: LifeCycleFn<void>;
  export const mount: LifeCycleFn<void>;
  export const unmount: LifeCycleFn<void>;
}
