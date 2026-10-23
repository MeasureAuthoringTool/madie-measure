const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { createStaticServer } = require("./dev-server");

test("serves current output and public assets without stale builds or unsafe paths", async () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "madie-measure-server-")
  );
  const output = path.join(directory, "dist");
  const assets = path.join(directory, "public");
  fs.mkdirSync(output);
  fs.mkdirSync(assets);
  const bundle = path.join(output, "bundle.js");
  fs.writeFileSync(bundle, "System.register([]);");
  fs.writeFileSync(path.join(output, "index.html"), "<main>Ready</main>");
  fs.writeFileSync(path.join(assets, "font.woff2"), "font");
  fs.writeFileSync(path.join(assets, "bundle.js"), "not the build");
  let ready = false;
  const server = createStaticServer([output, assets], () => ready);
  await new Promise((resolve) => server.listen(0, "localhost", resolve));
  const request = (url, method = "GET") =>
    new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "localhost",
          port: server.address().port,
          path: url,
          method,
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () =>
            resolve({ status: res.statusCode, headers: res.headers, body })
          );
        }
      );
      req.on("error", reject);
      req.end();
    });
  try {
    assert.equal((await request("/bundle.js")).status, 503);
    ready = true;
    const response = await request("/bundle.js?version=1");
    assert.equal(response.status, 200);
    assert.equal(response.body, "System.register([]);");
    assert.equal(response.headers["access-control-allow-origin"], "*");
    assert.equal(response.headers["cache-control"], "no-store");
    assert.match(response.headers["content-type"], /javascript/);
    assert.equal((await request("/")).body, "<main>Ready</main>");
    assert.equal(
      (await request("/font.woff2")).headers["content-type"],
      "font/woff2"
    );
    fs.writeFileSync(bundle, "System.register(['react']);");
    assert.equal(
      (await request("/bundle.js")).body,
      "System.register(['react']);"
    );
    ready = false;
    assert.equal((await request("/bundle.js")).status, 503);
    ready = true;
    assert.equal((await request("/missing.js")).status, 404);
    assert.equal((await request("/%2e%2e/package.json")).status, 403);
    assert.equal((await request("/%2e%2e%2fsecret")).status, 403);
    assert.equal((await request("/%00")).status, 400);
    assert.equal((await request("/%ZZ")).status, 400);
    assert.equal((await request("/bundle.js", "POST")).status, 405);
    assert.equal((await request("/bundle.js", "OPTIONS")).status, 204);
    const head = await request("/bundle.js", "HEAD");
    assert.equal(head.status, 200);
    assert.equal(head.body, "");
    assert.equal(
      Number(head.headers["content-length"]),
      Buffer.byteLength("System.register(['react']);")
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
