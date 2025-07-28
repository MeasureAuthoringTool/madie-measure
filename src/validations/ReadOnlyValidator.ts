import * as Yup from "yup";

// Validates that a string (that could possibly contain HTML) contains non-empty content (not just tags or whitespace).
export const notEmptyHtml = (message) =>
  Yup.string()
    .required(message)
    .test("not-empty-html", message, (value) => {
      if (typeof value !== "string") return false;

      // Remove all HTML tags (if present) and trim
      const text = value.replace(/<[^>]*>/g, "").trim();

      return text.length > 0;
    });
