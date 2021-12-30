declare module "@madie/madie-patient" {
  import { FC } from "react";
  import { LifeCycleFn } from "single-spa";

  export const MadiePatient: FC;
  export const bootstrap: LifeCycleFn<void>;
  export const mount: LifeCycleFn<void>;
  export const unmount: LifeCycleFn<void>;
}
