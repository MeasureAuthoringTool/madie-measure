import * as React from "react";
import clearAllMocks = jest.clearAllMocks;
import { describe, expect, it } from "@jest/globals";
import camelCaseConverter from "./camelCaseConverter";

describe("String splitter", () => {
  beforeEach(() => {
    clearAllMocks();
  });

  it("Should split a string at camelCase", () => {
    expect(camelCaseConverter("camelCase")).toBe("Camel Case");
  });
});
