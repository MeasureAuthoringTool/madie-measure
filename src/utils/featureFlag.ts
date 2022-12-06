import React from "react";

export function getFeatureFlag(feature: string) {
  //for now it is set to default false until feature flag is implemented
  if (feature === "export") {
    return false;
  }
  return false;
}
