declare module "@lhncbc/ucum-lhc" {
  import React from "react";
  import { LifeCycleFn } from "single-spa";

  export interface Unit {
    code: string;
    name: string;
  }
  export interface Synonyms {
    status: string;
    units: Unit[];
  }

  export const ucumUtils: (input: string) => {
    checkSynonyms: (input: string) => any;
  };

  export const bootstrap: LifeCycleFn<void>;
  export const mount: LifeCycleFn<void>;
  export const unmount: LifeCycleFn<void>;
}
