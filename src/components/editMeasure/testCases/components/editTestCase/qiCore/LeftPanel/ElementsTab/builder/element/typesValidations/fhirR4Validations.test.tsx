import * as Yup from "yup";
import {
  getInstantValidator,
  getValidation,
  getBinaryValidator,
  getUnsignedIntegerValidator,
  getPositiveIntegerValidator,
  getQuantityValidator,
  getCodingValidator,
  getCodeableConceptValidator,
} from "./fhirR4Validations";

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
      "Only the following numerical range of values are allowed: [1 to 2147483647]"
    );
    expect(nonRequiredString.validate("1")).resolves.toBe("1");
  });

  it("should validate a valid unsigned integer", async () => {
    const validator = getUnsignedIntegerValidator(true);

    await expect(validator.validate("0")).resolves.toBe("0");
    await expect(validator.validate("123")).resolves.toBe("123");
    await expect(validator.validate("2147483647")).resolves.toBe("2147483647");
  });

  it("should invalidate an unsigned integer with leading zeros", async () => {
    const validator = getUnsignedIntegerValidator(true);

    await expect(validator.validate("0123")).rejects.toThrow(
      "Only the following numerical range of values are allowed: [0 to 2147483647]"
    );
  });

  it("should invalidate an unsigned integer which is out of range", async () => {
    const validator = getUnsignedIntegerValidator(true);

    await expect(validator.validate("2147483648")).rejects.toThrow(
      "Only the following numerical range of values are allowed: [0 to 2147483647]"
    );
  });

  it("should invalidate a negative number", async () => {
    const validator = getUnsignedIntegerValidator(true);

    await expect(validator.validate("-123")).rejects.toThrow(
      "Only the following numerical range of values are allowed: [0 to 2147483647]"
    );
  });

  it("should invalidate a non-numeric value", async () => {
    const validator = getUnsignedIntegerValidator(true);

    await expect(validator.validate("abc")).rejects.toThrow(
      "Only the following numerical range of values are allowed: [0 to 2147483647"
    );
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

  it("should invalidate an psitive integer which is out of range", async () => {
    const validator = getPositiveIntegerValidator(true);

    await expect(validator.validate("2147483648")).rejects.toThrow(
      "Only the following numerical range of values are allowed: [1 to 2147483647]"
    );
  });

  it("succeeds when URL is present && not required", () => {
    const nonRequiredString = getValidation("uri", false);
    expect(nonRequiredString).toBeInstanceOf(Yup.StringSchema);
    expect(nonRequiredString.validate("http://google.com")).resolves.toBe(
      "http://google.com"
    );
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

  it("should validate a valid binary string", async () => {
    const validator = getBinaryValidator(false);
    const validBinary = "dGVzdA=="; // Base64 encoded string for "test"

    await expect(validator.validate(validBinary)).resolves.toBe(validBinary);
  });

  it("should validate a valid number string", async () => {
    const validator = getBinaryValidator(false);
    const validBinary = "1234";

    await expect(validator.validate(validBinary)).resolves.toBe(validBinary);
  });

  it("should invalidate a invalid binary string", async () => {
    const validator = getBinaryValidator(true);

    await expect(validator.validate("")).rejects.toThrow(
      "Invalid Binary format"
    );
  });

  it("Validates quantity with all required fields provided", () => {
    const schema = getQuantityValidator(true);
    const validQuantity = {
      value: 10,
      system: "http://unitsofmeasure.org",
      code: "mg",
      unit: "milligram",
    };

    expect(schema.isValidSync(validQuantity)).toBe(true);
  });

  it("Fails validation when required fields are missing", () => {
    const schema = getQuantityValidator(true);
    const invalidQuantity = {
      value: 10,
      unit: "milligram",
    };

    expect(schema.isValidSync(invalidQuantity)).toBe(false);
  });

  it("Allows empty quantity when not required", () => {
    const schema = getQuantityValidator(false);
    const emptyQuantity = null;

    expect(schema.isValidSync(emptyQuantity)).toBe(true);
  });

  it("Fails validation for invalid quantity code", () => {
    const schema = getQuantityValidator(true);
    const invalidQuantity = {
      value: 10,
      system: "http://unitsofmeasure.org",
      code: "invalid-code",
      unit: "milligram",
    };

    expect(schema.isValidSync(invalidQuantity)).toBe(false);
  });

  it("Validates quantity with default system when system is not provided", () => {
    const schema = getQuantityValidator(true);
    const validQuantity = {
      value: 10,
      code: "mg",
      unit: "milligram",
    };

    expect(schema.cast(validQuantity).system).toBe("http://unitsofmeasure.org");
  });
});
describe("OID & UUID Validation Functions", () => {
  it("succeeds when OID is present && is not required", () => {
    const nonRequiredString = getValidation("uri", false);
    expect(nonRequiredString).toBeInstanceOf(Yup.StringSchema);
    expect(
      nonRequiredString.validate("urn:oid:1.2.36.146.595.217.0")
    ).resolves.toBe("urn:oid:1.2.36.146.595.217.0");
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
    const nonRequiredString = getValidation("uri", false);
    expect(nonRequiredString).toBeInstanceOf(Yup.StringSchema);
    expect(nonRequiredString.validate("")).resolves.toBe("");
  });

  it("fails when OID is required && is present but incorrect", async () => {
    const requiredString = getValidation("uri", true);
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    await expect(requiredString.validate("urn:oid:1123")).rejects.toThrow(
      "Invalid OID Format (example format: urn:oid:1.2.36.146.595.217.0.1 )."
    );
  });

  it("fails when OID is required && is present but incorrect 2", async () => {
    const requiredString = getValidation("uri", true);
    expect(requiredString).toBeInstanceOf(Yup.StringSchema);
    await expect(requiredString.validate("urn:oid:1.2.^(&(&")).rejects.toThrow(
      "Invalid OID Format (example format: urn:oid:1.2.36.146.595.217.0.1 )."
    );
  });
  it("succeeds when UUID is present && is not required", () => {
    const nonRequiredString = getValidation("uri", false);
    expect(nonRequiredString).toBeInstanceOf(Yup.StringSchema);
    expect(
      nonRequiredString.validate(
        "urn:uuid:c757873d-ec9a-4326-a141-556f43239520"
      )
    ).resolves.toBe("urn:uuid:c757873d-ec9a-4326-a141-556f43239520");
  });
});

describe("getCodingValidator", () => {
  it("passes when value is null and not required", async () => {
    const schema = getCodingValidator(false);
    await expect(schema.validate(null)).resolves.toBeNull();
  });

  it("fails when value is null and required", async () => {
    const schema = getCodingValidator(true);
    await expect(schema.validate(null)).rejects.toThrow();
  });

  it("passes when coding has both system and code", async () => {
    const schema = getCodingValidator(false);
    const valid = { system: "http://example.org", code: "abc" };
    await expect(schema.validate(valid)).resolves.toEqual(valid);
  });

  it("fails when system is set but code is empty", async () => {
    const schema = getCodingValidator(false);
    const partial = { system: "http://example.org", code: "" };
    await expect(schema.validate(partial)).rejects.toThrow(
      "Both Code System and Code are required"
    );
  });

  it("fails when code is set but system is empty", async () => {
    const schema = getCodingValidator(false);
    const partial = { system: "", code: "abc" };
    await expect(schema.validate(partial)).rejects.toThrow(
      "Both Code System and Code are required"
    );
  });

  it("fails when both system and code keys exist but are empty", async () => {
    const schema = getCodingValidator(false);
    const marker = { system: "", code: "", display: "" };
    await expect(schema.validate(marker)).rejects.toThrow(
      "Both Code System and Code are required"
    );
  });

  it("passes for an object without system or code keys", async () => {
    const schema = getCodingValidator(false);
    const obj = { display: "Something" };
    await expect(schema.validate(obj)).resolves.toEqual(obj);
  });

  it("is accessible via getValidation with type Coding", () => {
    const schema = getValidation("Coding", false);
    expect(schema).toBeInstanceOf(Yup.ObjectSchema);
  });
});

describe("getCodeableConceptValidator", () => {
  it("passes when value is null and not required", async () => {
    const schema = getCodeableConceptValidator(false);
    await expect(schema.validate(null)).resolves.toBeNull();
  });

  it("fails when value is null and required", async () => {
    const schema = getCodeableConceptValidator(true);
    await expect(schema.validate(null)).rejects.toThrow();
  });

  it("passes when coding array has a complete coding", async () => {
    const schema = getCodeableConceptValidator(false);
    const valid = {
      coding: [{ system: "http://example.org", code: "abc", display: "Abc" }],
    };
    await expect(schema.validate(valid)).resolves.toEqual(valid);
  });

  it("fails when coding array has system but no code", async () => {
    const schema = getCodeableConceptValidator(false);
    const partial = {
      coding: [{ system: "http://example.org", code: "" }],
    };
    await expect(schema.validate(partial)).rejects.toThrow(
      "Both Code System and Code are required for each coding"
    );
  });

  it("fails when coding array has code but no system", async () => {
    const schema = getCodeableConceptValidator(false);
    const partial = {
      coding: [{ system: "", code: "abc" }],
    };
    await expect(schema.validate(partial)).rejects.toThrow(
      "Both Code System and Code are required for each coding"
    );
  });

  it("fails when any coding in the array is incomplete", async () => {
    const schema = getCodeableConceptValidator(false);
    const mixed = {
      coding: [
        { system: "http://example.org", code: "abc", display: "Abc" },
        { system: "http://example.org", code: "" },
      ],
    };
    await expect(schema.validate(mixed)).rejects.toThrow(
      "Both Code System and Code are required for each coding"
    );
  });

  it("passes when coding array is empty", async () => {
    const schema = getCodeableConceptValidator(false);
    const empty = { coding: [] };
    await expect(schema.validate(empty)).resolves.toEqual(empty);
  });

  it("passes when coding has null entry", async () => {
    const schema = getCodeableConceptValidator(false);
    const val = { coding: [null] };
    await expect(schema.validate(val)).resolves.toEqual(val);
  });

  it("passes when no coding property exists", async () => {
    const schema = getCodeableConceptValidator(false);
    const val = { text: "some text" };
    await expect(schema.validate(val)).resolves.toEqual(val);
  });

  it("fails when marker coding with empty system and code exists", async () => {
    const schema = getCodeableConceptValidator(false);
    const marker = {
      coding: [{ system: "", code: "", display: "" }],
    };
    await expect(schema.validate(marker)).rejects.toThrow(
      "Both Code System and Code are required for each coding"
    );
  });

  it("is accessible via getValidation with type CodeableConcept", () => {
    const schema = getValidation("CodeableConcept", false);
    expect(schema).toBeInstanceOf(Yup.ObjectSchema);
  });
});
