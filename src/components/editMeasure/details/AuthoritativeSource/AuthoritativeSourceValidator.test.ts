import { AuthoritativeSourceValidator } from "./AuthoritativeSourceValidator";

describe("AuthoritativeSourceValidator", () => {
  const validate = (authoritativeSource: string) =>
    AuthoritativeSourceValidator.validate({ authoritativeSource });

  it.each([
    "https://www.test.org",
    "http://www.test.org/measure/123",
    "https://www.test.org/foo?bar=baz#frag",
    "urn:oid:1.2.3.4.5",
    "mailto:someone@test.org",
  ])("should accept the URI %s", async (uri) => {
    await expect(validate(uri)).resolves.toEqual({
      authoritativeSource: uri,
    });
  });

  it.each([
    "www.test.org",
    "test.org",
    "not a uri",
    "http://",
    "://test.org",
    "1http://test.org",
  ])("should reject the non-URI %s", async (value) => {
    await expect(validate(value)).rejects.toThrow("Must be a URI value");
  });

  it("should allow an empty value, since Authoritative Source is optional", async () => {
    await expect(validate("")).resolves.toEqual({ authoritativeSource: "" });
  });
});
