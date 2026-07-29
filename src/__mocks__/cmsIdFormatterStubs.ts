// Shared jest stubs for @madie/madie-util's CMS-ID formatters. Bodies mirror
// madie-util/src/util/cmsIdFormatter.ts. Import as a `mock`-prefixed namespace
// and spread into an inline util mock factory:
//   import * as mockCmsIdStubs from "<path>/__mocks__/cmsIdFormatterStubs";
//   jest.mock("@madie/madie-util", () => ({ ...mockCmsIdStubs, ... }));
const CMS_ID_PAD_WIDTH = 4;
const FHIR_SUFFIX = "FHIR";

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
