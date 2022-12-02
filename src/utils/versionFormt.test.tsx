import * as React from "react";
import { versionFormat } from "./versionFormat";

describe("Version Formatting", () => {
  it("For MADiE measures", () => {
    const version = versionFormat("1.0.000", null);
    expect(version).toEqual("1.0.000");
  });

  it("For transfered measures", () => {
    const version = versionFormat("1.000", "12");
    expect(version).toEqual("1.0.012");
  });
});
