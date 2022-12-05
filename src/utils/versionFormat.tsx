import React from "react";

export const versionFormat = (version, revisionNumber) => {
  if (revisionNumber && version) {
    const splitVersionData = version?.split(".");
    return (
      splitVersionData[0] +
      "." +
      +splitVersionData[1] +
      "." +
      revisionNumber.padStart(3, "0")
    );
  }
  return version;
};
