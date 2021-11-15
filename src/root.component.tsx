import React from "react";
import tw from "twin.macro";
import App from "./App";

const Notice = tw.span`text-green-700`;
export default function Root(props) {
  return <App name="Measure" />;
}
