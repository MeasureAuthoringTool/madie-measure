import * as Yup from "yup";
import { getInstantValidator, getValidation } from "./fhirR4Validations";

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

  it("getValidation IntegerValidator positiveInt", () => {
    const requiredString = getValidation("positiveInt", true);
    const nonRequiredString = getValidation("positiveInt", false);
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    expect(requiredString.validate("1")).resolves.toBe("1");
    expect(requiredString.validate("abc")).rejects.toThrow(
      "Invalid Integer format"
    );
    expect(nonRequiredString.validate("1")).resolves.toBe("1");
  });

  it("getValidation IntegerValidator unsignedInt", () => {
    const requiredString = getValidation("unsignedInt", true);
    const nonRequiredString = getValidation("unsignedInt", false);
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    expect(requiredString.validate("1")).resolves.toBe("1");
    expect(requiredString.validate("abc")).rejects.toThrow(
      "Invalid Integer format"
    );
    expect(nonRequiredString.validate("1")).resolves.toBe("1");
  });

  it("getValidation IntegerValidator System.Integer", () => {
    const requiredString = getValidation(
      "http://hl7.org/fhirpath/System.Integer",
      true
    );
    const nonRequiredString = getValidation(
      "http://hl7.org/fhirpath/System.Integer",
      false
    );
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    expect(requiredString.validate("1")).resolves.toBe("1");
    expect(requiredString.validate("abc")).rejects.toThrow(
      "Invalid Integer format"
    );
    expect(nonRequiredString.validate("1")).resolves.toBe("1");
  });

  it("succeeds when required URL is present ", () => {
    const requiredString = getValidation("uri", true);
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    expect(
      requiredString.validate("http://hl7.org/fhirpath/System.String")
    ).resolves.toBe("http://hl7.org/fhirpath/System.String");
  });
  it("fails when required URL is not present ", () => {
    const requiredString = getValidation("uri", true);
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    expect(requiredString.validate("")).rejects.toThrow(
      "This field is required"
    );
  });

  it("succeeds when URL is present && not required", () => {
    const nonRequiredString = getValidation("uri", false);
    expect(nonRequiredString).toBeInstanceOf(Yup.StringSchema);
    expect(nonRequiredString.validate("http://google.com")).resolves.toBe(
      "http://google.com"
    );
  });

  it("succeeds when OID is present && is not required", () => {
    const nonRequiredString = getValidation("uri", false);
    expect(nonRequiredString).toBeInstanceOf(Yup.StringSchema);
    expect(
      nonRequiredString.validate("urn:oid:1.2.36.146.595.217.0.")
    ).resolves.toBe("urn:oid:1.2.36.146.595.217.0.");
  });

  it("succeeds when OID is present && is required", () => {
    const requiredString = getValidation("uri", true);
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    expect(
      requiredString.validate("urn:oid:1.2.36.146.595.217.0.1")
    ).resolves.toBe("urn:oid:1.2.36.146.595.217.0.1");
  });

  it("fails when OID is required && is not present", () => {
    const requiredString = getValidation("uri", true);
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    expect(requiredString.validate("")).rejects.toThrow(
      "This field is required"
    );
  });

  it("succeeds when OID is not present && is not required", () => {
    const requiredString = getValidation("uri", false);
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    expect(requiredString.validate("")).resolves.toBe("");
  });

  it("fails when OID is required && is present but incorrect", async () => {
    const requiredString = getValidation("uri", true);
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    await expect(requiredString.validate("urn:oid:1123")).rejects.toThrow(
      "This is not a valid OID"
    );
  });
  it("succeeds when UUI is present && is not required", () => {
    const nonRequiredString = getValidation("uri", false);
    expect(nonRequiredString).toBeInstanceOf(Yup.StringSchema);
    expect(
      nonRequiredString.validate(
        "urn:uuid:c757873d-ec9a-4326-a141-556f43239520"
      )
    ).resolves.toBe("urn:uuid:c757873d-ec9a-4326-a141-556f43239520");
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
    const requiredId = getValidation(
      "http://hl7.org/fhirpath/System.String",
      true,
      "id"
    );
    const nonRequiredId = getValidation(
      "http://hl7.org/fhirpath/System.String",
      false,
      "id"
    );

    expect(requiredId).toBeInstanceOf(Yup.StringSchema);
    expect(requiredId.validate(undefined)).rejects.toThrow(
      "This field is required"
    );
    expect(requiredId.validate("")).rejects.toThrow("Invalid ID format");
    //id cannot have spaces
    expect(requiredId.validate("id with spaces")).rejects.toThrow(
      "Invalid ID format"
    );
    //only special character allowed is "-"
    expect(requiredId.validate("!@#")).rejects.toThrow("Invalid ID format");
    //id must be between 1 and 64 characters
    expect(requiredId.validate("x".repeat(65))).rejects.toThrow(
      "Invalid ID format"
    );

    expect(nonRequiredId.validate("test")).resolves.toBe("test");
    expect(nonRequiredId.validate("A-z-0")).resolves.toBe("A-z-0");
  });

  it("getValidation DateValidator", () => {
    const requiredDate = getValidation("date", true);
    const nonRequiredDate = getValidation("date", false);

    expect(requiredDate).toBeInstanceOf(Yup.StringSchema);

    expect(requiredDate.validate("")).rejects.toThrow("This field is required");
    expect(requiredDate.validate("01010101011010")).rejects.toThrow(
      "Invalid Date format"
    );
    expect(nonRequiredDate.validate("1992-01-01")).resolves.toBe("1992-01-01");
  });

  it("getValidation timeValidator", () => {
    const requiredTime = getValidation("time", true);
    const nonrequiredTime = getValidation("time", false);

    expect(requiredTime).toBeInstanceOf(Yup.StringSchema);
    expect(requiredTime.validate("")).rejects.toThrow("Invalid Time format");

    expect(requiredTime.validate("random time")).rejects.toThrow(
      "Invalid Time format"
    );
    expect(nonrequiredTime.validate("23:15:07")).resolves.toBe("23:15:07");
  });

  it("getValidation DateTimeValidator", () => {
    const requiredDateTime = getValidation("dateTime", true);
    const nonrequiredDateTime = getValidation("dateTime", false);

    expect(requiredDateTime).toBeInstanceOf(Yup.StringSchema);
    expect(requiredDateTime.validate("")).rejects.toThrow(
      "This field is required"
    );
    expect(requiredDateTime.validate("random time")).rejects.toThrow(
      "Invalid DateTime format"
    );
    expect(nonrequiredDateTime.validate("1992-01-01")).resolves.toBe(
      "1992-01-01"
    );
  });

  it("returns aa yup. mixed if lookup fails", () => {
    const mixed = getValidation("test", false);
    expect(mixed).toBeInstanceOf(Yup.MixedSchema);
  });

  it("should return validation schema for Instant type", () => {
    // if Instant is invalid
    let schema = getInstantValidator(true);
    expect(schema).toBeInstanceOf(Yup.MixedSchema);
    expect(schema.validate("2025-02")).rejects.toThrow(
      "Invalid instant format"
    );
    // valid instant
    expect(
      schema.validate("2025-02-04T00:00:00.000+00:00")
    ).resolves.not.toThrow();
  });
});
