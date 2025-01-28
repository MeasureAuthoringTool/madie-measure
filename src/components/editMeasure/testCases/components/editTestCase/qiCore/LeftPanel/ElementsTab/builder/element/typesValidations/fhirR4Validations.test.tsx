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

  it("getValidation BooleanValidator", () => {
    const requiredString = getValidation("boolean", true);
    const nonRequiredString = getValidation("boolean", false);
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    expect(requiredString.validate("true")).resolves.toBe("true");
    expect(requiredString.validate("xxx")).rejects.toThrow(
      "Invalid Boolean format"
    );

    expect(nonRequiredString.validate("false")).resolves.toBe("false");
  });

  it("getValidation uriValidator", () => {
    const requiredString = getValidation("uri", true);
    const nonRequiredString = getValidation("uri", false);
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    expect(
      requiredString.validate("http://hl7.org/fhirpath/System.String")
    ).resolves.toBe("http://hl7.org/fhirpath/System.String");
    expect(requiredString.validate("")).rejects.toThrow(
      "This field is required"
    );
    expect(nonRequiredString.validate("false")).resolves.toBe("false");
  });

  it("getValidation DecimalValidator", () => {
    const requiredString = getValidation("decimal", true);
    const nonRequiredString = getValidation("decimal", false);
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    expect(requiredString.validate("1.23")).resolves.toBe("1.23");
    expect(requiredString.validate("")).rejects.toThrow(
      "Invalid Decimal format"
    );

    expect(nonRequiredString.validate("1.23")).resolves.toBe("1.23");
  });

  it("getValidation markdownValidator", () => {
    const requiredMarkdown = getValidation("markdown", true);
    const nonRequiredMarkdown = getValidation("markdown", false);
    expect(requiredMarkdown).toBeInstanceOf(Yup.StringSchema);
    expect(requiredMarkdown.validate("validmarkdown")).resolves.toBe(
      "validmarkdown"
    );
    expect(requiredMarkdown.validate("")).rejects.toThrow(
      "Invalid markdown format"
    );
    expect(requiredMarkdown.validate(undefined)).rejects.toThrow(
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
