import * as Yup from "yup";
import { getValidation } from "./fhirR4Validations";

describe("Validation Functions", () => {
  it("getValidation StringValidator", () => {
    const requiredString = getValidation(
      "http://hl7.org/fhirpath/System.String",
      true
    );
    const nonRequiredString = getValidation(
      "http://hl7.org/fhirpath/System.String",
      false
    );
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    expect(requiredString.validate("validString")).resolves.toBe("validString");
    expect(requiredString.validate("")).rejects.toThrow(
      "Invalid String format"
    );

    expect(nonRequiredString.validate("test")).resolves.toBe("test");
  });

  it("getValidation markdownValidator", () => {
    const requiredMarkdown = getValidation("markdown", true);
    const nonRequiredMarkdown = getValidation("markdown", false);
    expect(requiredMarkdown).toBeInstanceOf(Yup.StringSchema);
    expect(requiredMarkdown.validate("validmarkdown")).resolves.toBe(
      "validmarkdown"
    );
    expect(requiredMarkdown.validate("")).rejects.toThrow(
      "This field is required"
    );

    expect(nonRequiredMarkdown.validate("test")).resolves.toBe("test");
  });

  it("getValidation idValidator", () => {
    const requiredId = getValidation("id", true);
    const nonRequiredId = getValidation("id", false);

    expect(requiredId).toBeInstanceOf(Yup.StringSchema);
    expect(requiredId.validate("")).rejects.toThrow("Invalid ID format");

    expect(requiredId.validate("id with spaces")).rejects.toThrow(
      "Invalid ID format"
    );

    expect(nonRequiredId.validate("test")).resolves.toBe("test");
  });

  it("returns aa yup. mixed if lookup fails", () => {
    const mixed = getValidation("test", false);
    expect(mixed).toBeInstanceOf(Yup.MixedSchema);
  });
});
