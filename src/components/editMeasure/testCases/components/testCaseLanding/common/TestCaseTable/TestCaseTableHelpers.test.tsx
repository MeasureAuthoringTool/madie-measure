import * as React from "react";
// @ts-ignore
import { useFeatureFlags, checkUserCanEdit } from "@madie/madie-util";

import { getTranslatedValidationStatus } from "./TestCaseTableHelpers";

describe("getTranslatedValidationStatus", () => {
  it("returns 'Invalid' for 'Invalid' status", () => {
    expect(getTranslatedValidationStatus("Invalid")).toBe("Invalid");
  });

  it("returns 'Invalid' for 'Invalid JSON' status", () => {
    expect(getTranslatedValidationStatus("Invalid JSON")).toBe("Invalid");
  });

  it("returns 'Invalid' for 'Not Complete' status", () => {
    expect(getTranslatedValidationStatus("Not Complete")).toBe("Invalid");
  });

  it("returns 'Invalid' for null or undefined status", () => {
    expect(getTranslatedValidationStatus(null)).toBe("Invalid");
    expect(getTranslatedValidationStatus(undefined)).toBe("Invalid");
  });

  it("returns 'Pending' for 'Pending' status", () => {
    expect(getTranslatedValidationStatus("Pending")).toBe("Pending");
  });

  it("returns 'Pending' for 'Validating' status", () => {
    expect(getTranslatedValidationStatus("Validating")).toBe("Pending");
  });

  it("returns 'Valid' for 'Valid' status", () => {
    expect(getTranslatedValidationStatus("Valid")).toBe("Valid");
  });

  it("returns null for unknown status", () => {
    expect(getTranslatedValidationStatus("Unknown")).toBeNull();
    expect(getTranslatedValidationStatus("")).toBeNull();
  });
});
