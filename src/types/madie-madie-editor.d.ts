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

  export const MadieEditor: FC<{
    value: string;
    onChange: (value: string) => void;
    parseDebounceTime?: number;
    inboundAnnotations?: EditorAnnotation[];
    inboundErrorMarkers?: EditorErrorMarker[];
    height?: string;
  }>;
  export const bootstrap: LifeCycleFn<void>;
  export const mount: LifeCycleFn<void>;
  export const unmount: LifeCycleFn<void>;
}
