import React, { FC } from "react";
import ReactDOMClient from "react-dom/client";
import singleSpaReact, { SingleSpaContext } from "single-spa-react";
import Root from "./root.component";
import Home from "./components/Home";

const lifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: Root,
  renderType: "createRoot",
  errorBoundary(err, info, props) {
    console.log("madie-measure-error", err);
    return (
      <div>
        The app has fallen, and cannot get up. Please contact the help desk
      </div>
    );
  },
});

export const MadieMeasure: FC = Home;

export const { bootstrap, mount, unmount } = lifecycles;
