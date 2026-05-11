export const CMS_ID_PAD_WIDTH = 4;
export const FHIR_SUFFIX = "FHIR";

/**
 * Zero-pads a CMS ID to {@link CMS_ID_PAD_WIDTH} digits. Values already wider
 * than the pad width are returned unchanged. Null / undefined / 0 / negative
 * inputs return an empty string.
 */
export function padCmsId(cmsId: number | string | null | undefined): string {
  if (cmsId === null || cmsId === undefined || cmsId === "") {
    return "";
  }
  const n = typeof cmsId === "number" ? cmsId : Number(cmsId);
  if (!Number.isFinite(n) || n <= 0) {
    return "";
  }
  return String(Math.trunc(n)).padStart(CMS_ID_PAD_WIDTH, "0");
}

/**
 * Display form of a CMS ID: zero-padded, with the "FHIR" suffix appended for
 * QI-Core measures. Returns an empty string when the CMS ID is missing.
 */
export function formatCmsId(
  cmsId: number | string | null | undefined,
  model: string | null | undefined
): string {
  const padded = padCmsId(cmsId);
  if (!padded) {
    return "";
  }
  return model && model.startsWith("QI-Core")
    ? `${padded}${FHIR_SUFFIX}`
    : padded;
}
