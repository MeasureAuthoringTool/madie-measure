import { validate } from "./validate";

describe("validate", () => {
  it("should return a passing ValidationResult when additional supported unit is entered", () => {
    const result = validate("years");
    expect(result.error).toBe(false);
    expect(result.label).toBe("years");
  });

  it("should return a passing ValidationResult when a natural ucum unit is entered", () => {
    const result = validate("ml");
    expect(result.error).toBe(false);
    expect(result.label).toBe("milliLiters");
  });

  it("should return a Failing ValidationResult when a non supported unit is entered", () => {
    const result = validate("nothing");
    expect(result.error).toBe(true);
    expect(result.label).toBe(undefined);
  });
});
