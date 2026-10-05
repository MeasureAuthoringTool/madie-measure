import * as Yup from "yup";

// RFC 3986: a scheme, a colon, and a non-empty authority or path. Accepts both
// URLs ("https://www.cms.gov/foo") and URNs ("urn:oid:2.16.840.1.113883").
export const URI_REGEX = /^[a-zA-Z][a-zA-Z0-9+\-.]*:(\/\/)?[^\s/?#]+\S*$/;

export const AuthoritativeSourceValidator = Yup.object().shape({
  authoritativeSource: Yup.string()
    .trim()
    .matches(URI_REGEX, {
      message: "Must be a URI value",
      excludeEmptyString: true,
    })
    .notRequired(),
});
