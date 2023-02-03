import * as React from "react";
import clearAllMocks = jest.clearAllMocks;
import { describe, expect } from "@jest/globals";
import versionErrorHelper from "./versionErrorHelper";

describe("Versioning error helper", () => {
  beforeEach(() => {
    clearAllMocks();
  });

  it("should return expected output for draft state error", () => {
    expect(versionErrorHelper("draft state")).toBe(
      "Please ensure the measure is first in draft state before versioning this measure."
    );
  });
  it("should return expected output for CQL errors error", () => {
    expect(versionErrorHelper("CQL errors")).toBe(
      "Please include valid CQL in the CQL editor to version before versioning this measure."
    );
  });
  it("should return expected output for no CQL error", () => {
    expect(versionErrorHelper("no CQL")).toBe(
      "Please include valid CQL in the CQL editor to version before versioning this measure."
    );
  });
  it("should return expected output for invalid test cases error", () => {
    expect(versionErrorHelper("invalid test case")).toBe(
      "Please include valid test cases to version before versioning this measure."
    );
  });
  it("should return expected output for non caught cases", () => {
    expect(versionErrorHelper("test")).toBe(
      "An unexpected error has occurred. Please contact the help desk."
    );
  });
});
