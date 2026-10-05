import * as Yup from "yup";

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
