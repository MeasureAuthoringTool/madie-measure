/**
 * gzip-compresses the JSON of a value, using the browser's native CompressionStream.
 *
 * Send the result as a request body with `Content-Type: application/json` and
 * `Content-Encoding: gzip`; measure-service decompresses it (GzipRequestDecompressionFilter).
 * Used to keep large request bodies under the CMS WAF request size limit (MAT-10579).
 */
export async function gzipJson(value: unknown): Promise<Blob> {
  const compressed = new Blob([JSON.stringify(value)])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  return new Response(compressed).blob();
}
