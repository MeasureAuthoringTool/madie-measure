import {
  buildDefaultQiCorePatientBundle,
  defaultQiCoreTestCaseJson,
  QICORE_PATIENT_PROFILE,
} from "./QiCoreTestCaseHelper";
import { TestCase } from "@madie/madie-models";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("QiCoreTestCaseHelper", () => {
  it("returns a collection Bundle with a QI-Core Patient entry", () => {
    const bundle = buildDefaultQiCorePatientBundle();

    expect(bundle.resourceType).toBe("Bundle");
    expect(bundle.type).toBe("collection");
    expect(bundle.id).toMatch(UUID_RE);
    expect(bundle.entry).toHaveLength(1);

    const [entry] = bundle.entry;
    expect(entry.resource.resourceType).toBe("Patient");
    expect(entry.resource.id).toMatch(UUID_RE);
    expect(entry.fullUrl).toBe(
      `https://madie.cms.gov/Patient/${entry.resource.id}`
    );
    expect(entry.resource.meta.profile).toEqual([QICORE_PATIENT_PROFILE]);
  });

  it("uses distinct IDs for the Bundle and Patient", () => {
    const bundle = buildDefaultQiCorePatientBundle();
    expect(bundle.id).not.toBe(bundle.entry[0].resource.id);
  });

  it("populates json with a default QI-Core Patient bundle when empty", () => {
    const testCase = { title: "tc", description: "", series: "" } as TestCase;
    const result = defaultQiCoreTestCaseJson(testCase)!;
    expect(result.json).toBeTruthy();

    const parsed = JSON.parse(result.json!);
    expect(parsed.resourceType).toBe("Bundle");
    expect(parsed.entry[0].resource.meta.profile).toEqual([
      QICORE_PATIENT_PROFILE,
    ]);
  });

  it("does not overwrite existing json", () => {
    const existing = JSON.stringify({ resourceType: "Bundle", entry: [] });
    const testCase = {
      title: "tc",
      description: "",
      series: "",
      json: existing,
    } as TestCase;
    const result = defaultQiCoreTestCaseJson(testCase)!;
    expect(result.json).toBe(existing);
  });
});
