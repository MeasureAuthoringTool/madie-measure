/**
 * @jest-environment node
 */
// jsdom has no CompressionStream; Node 18+ has it, plus Blob and Response.
import { gunzipSync } from "zlib";
import { gzipJson } from "./gzipJson";

describe("gzipJson", () => {
  it("gzips the JSON of a value so it decompresses back to the same value", async () => {
    const value = [
      {
        groupId: "group-1",
        testCaseExecutionResults: [
          { definitions: [{ logic: 'define "Initial Population": true' }] },
        ],
      },
    ];

    const blob = await gzipJson(value);
    const bytes = Buffer.from(await blob.arrayBuffer());

    expect(bytes.subarray(0, 2)).toEqual(Buffer.from([0x1f, 0x8b])); // gzip magic number
    expect(JSON.parse(gunzipSync(bytes).toString("utf8"))).toEqual(value);
  });

  it("makes repetitive JSON much smaller", async () => {
    const value = Array.from({ length: 500 }, (_, i) => ({
      testCaseId: `tc-${i}`,
      logic: 'define "Denominator": "Initial Population" and exists "Statin"',
    }));

    const blob = await gzipJson(value);

    expect(blob.size).toBeLessThan(JSON.stringify(value).length / 10);
  });
});
