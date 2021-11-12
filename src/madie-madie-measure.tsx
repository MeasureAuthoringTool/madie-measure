import React, { FC } from "react";
import ReactDOM from "react-dom";
import singleSpaReact from "single-spa-react";
import Root from "./root.component";
import MeasureLanding from "./components/MeasureLanding";
import CreateNewMeasure from "./components/CreateNewMeasure";
import ViewEditMeasure from "./components/ViewEditMeasure";

const lifecycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: Root,
  errorBoundary(err, info, props) {
    // Customize the root error boundary for your microfrontend here.
    return null;
  },
});

export const MadieMeasure: FC = MeasureLanding;
export const NewMeasure: FC = CreateNewMeasure;
export const EditMeasure: FC = ViewEditMeasure;

export const { bootstrap, mount, unmount } = lifecycles;
