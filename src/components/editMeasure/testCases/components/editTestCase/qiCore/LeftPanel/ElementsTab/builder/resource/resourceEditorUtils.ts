import * as _ from "lodash";
import React from "react";
import { ResourceActionType } from "../../../../../../../util/QiCorePatientProvider";

/**
 * Deletes an element from an array-type resource property.
 *
 * Supports two resolution strategies:
 *  1. Numbered label  — "performer 2" or " *name 1 " → 1-based index in label → 0-based array index
 *  2. Extension label — "Extension (Sex)"            → matched against URL tail tokens of each item
 */
export function deleteMultipleCardinalityElement(
  elementName: string,
  element: any[],
  selectedResource: any,
  path: string,
  dispatch: React.Dispatch<any>
): void {
  const nextEntry = _.cloneDeep(selectedResource.bundleEntry);
  const strippedPath = path.includes(".")
    ? path.substring(path.indexOf(".") + 1)
    : path;

  const normalizeForMatch = (value: string = "") =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

  /**
   * Returns a 0-based index for labels with a 1-based numeric suffix,
   * e.g. "performer 2" → 1, " *name 1 " → 0.
   * Also handles single-item arrays whose tab labels carry no suffix.
   */
  const getIndexFromElementName = (): number | null => {
    const numberedMatch = elementName.match(/(\d+)\s*$/);
    if (numberedMatch) {
      const parsed = Number(numberedMatch[1]) - 1;
      return Number.isNaN(parsed) ? null : parsed;
    }
    // Single-item arrays have no numeric suffix in their tab label.
    if (element.length === 1) {
      return 0;
    }
    return null;
  };

  /**
   * Returns a 0-based index for un-numbered extension labels like "Extension (Sex)".
   * Extracts the display word from inside the parentheses, then matches it against
   * the hyphen-delimited tokens of each extension item's URL tail.
   *
   * Uses token-level matching (not plain substring) so that "sex"
   * does not accidentally match inside "sexual-orientation".
   */
  const getIndexFromExtensionLabel = (): number | null => {
    if (!strippedPath.endsWith("extension")) {
      return null;
    }

    // "Extension (Sex)" → "Sex"; fall back to bare label when no parentheses.
    const displayLabel =
      elementName.match(/\(([^)]+)\)/)?.[1] ??
      elementName.replace(/^\s*\*/, "").trim();
    // Strip any trailing numeric suffix that may appear in multi-entry slice labels.
    const cleanDisplayLabel = displayLabel.replace(/\s+\d+\s*$/, "").trim();
    const normalizedLabel = normalizeForMatch(cleanDisplayLabel);

    if (!normalizedLabel) {
      return null;
    }

    const matchedIndex = element.findIndex((item) => {
      const url = item?.url;
      if (!url || typeof url !== "string") {
        return false;
      }
      // Compare against URL tail tokens (e.g. "us-core-sex" → ["us","core","sex"]).
      // Some canonical URLs include a version suffix after "|" (e.g. "...tribal-affiliation|6.1.0").
      const urlTail = _.toLower(url.split("/").pop() || "");
      const canonicalTail = urlTail.split("|")[0];
      const tailTokens = canonicalTail.split(/[^a-z0-9]+/).filter(Boolean);
      if (tailTokens.includes(normalizedLabel)) {
        return true;
      }
      // Secondary: normalized tail ends with the label (handles no-separator edge cases).
      return normalizeForMatch(canonicalTail).endsWith(normalizedLabel);
    });

    return matchedIndex >= 0 ? matchedIndex : null;
  };

  // Empty array — remove the property entirely.
  if (element.length === 0) {
    _.unset(nextEntry.resource, strippedPath);
    dispatch({
      type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
      payload: nextEntry,
    });
    return;
  }

  // Prefer numeric-index label, then fall back to extension URL token matching.
  const idx = getIndexFromElementName() ?? getIndexFromExtensionLabel();

  if (idx !== null && idx >= 0 && idx < element.length) {
    const updatedElement = element.filter((_, i) => i !== idx);
    if (updatedElement.length === 0) {
      _.unset(nextEntry.resource, strippedPath);
    } else {
      _.set(nextEntry.resource, strippedPath, updatedElement);
    }
    dispatch({
      type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
      payload: nextEntry,
    });
  }
}
