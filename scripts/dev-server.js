const http = require("node:http");
const https = require("node:https");
const fs = require("node:fs");
const path = require("node:path");

const types = {
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function createStaticServer(directories, isReady, serverOptions) {
  const roots = directories.map((directory) => path.resolve(directory));
  const handler = (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      });
      return res.end();
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, { Allow: "GET, HEAD, OPTIONS" });
      return res.end();
    }
    let pathname;
    try {
      pathname = decodeURIComponent(req.url.split("?")[0]);
    } catch (error) {
      res.writeHead(400);
      return res.end("Invalid URL encoding");
    }
    if (pathname.includes("\0")) {
      res.writeHead(400);
      return res.end("Invalid URL path");
    }
    const relative =
      "." + pathname + (pathname.endsWith("/") ? "index.html" : "");
    const files = roots.map((directory) => path.resolve(directory, relative));
    if (
      files.some(
        (filename, index) =>
          filename !== roots[index] &&
          !filename.startsWith(roots[index] + path.sep)
      )
    ) {
      res.writeHead(403);
      return res.end("Path outside asset directories");
    }
    if (!isReady()) {
      res.writeHead(503, { "Retry-After": "1" });
      return res.end("Waiting for a successful webpack build");
    }
    const read = (index) => {
      if (index === files.length) {
        res.writeHead(404);
        return res.end("Asset not found");
      }
      const filename = files[index];
      fs.readFile(filename, (error, content) => {
        if (error) {
          if (["ENOENT", "ENOTDIR", "EISDIR"].includes(error.code)) {
            return read(index + 1);
          }
          console.error("[server] Unable to read asset:", error);
          res.writeHead(500);
          return res.end("Unable to read asset");
        }
        res.writeHead(200, {
          "Content-Type":
            types[path.extname(filename)] || "application/octet-stream",
          "Content-Length": content.length,
        });
        res.end(req.method === "HEAD" ? undefined : content);
      });
    };
    read(0);
  };
  return serverOptions
    ? https.createServer(serverOptions, handler)
    : http.createServer(handler);
}

function start() {
  const args = process.argv.slice(2);
  let secure = false;
  let port = process.env.PORT || "8505";
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--https") secure = true;
    else if (args[index] === "--port") port = args[++index];
    else throw new Error(`Unknown option: ${args[index]}`);
  }
  port = Number(port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT/--port must be an integer between 1 and 65535");
  }
  const webpack = require("webpack");
  const config = require("../webpack.config")(
    { protocol: secure ? "https" : "http" },
    { mode: "development" }
  );
  if (secure && config.devServer.server?.type !== "https") {
    throw new Error("HTTPS requires localhost.key and localhost.crt");
  }
  let ready = false;
  const compiler = webpack(config);
  const server = createStaticServer(
    [config.output.path, path.resolve(__dirname, "../public")],
    () => ready,
    secure ? config.devServer.server.options : undefined
  );
  let watcher;
  let stopping = false;
  const stop = (code = 0) => {
    if (stopping) return;
    stopping = true;
    if (server.listening) {
      server.close();
      server.closeAllConnections();
    }
    const closeCompiler = () =>
      compiler.close((error) => {
        if (error) console.error("[webpack] Shutdown failed:", error);
        process.exit(error ? 1 : code);
      });
    if (watcher) watcher.close(closeCompiler);
    else closeCompiler();
  };
  compiler.hooks.invalid.tap("dev-server", () => {
    ready = false;
  });
  watcher = compiler.watch({}, (error, stats) => {
    if (error) {
      console.error("[webpack] Build failed:", error);
      return stop(1);
    }
    ready = !stats.hasErrors();
    console.log(
      stats.toString({ colors: process.stdout.isTTY, preset: "minimal" })
    );
  });
  server.on("error", (error) => {
    console.error("[server] Failed:", error);
    stop(1);
  });
  server.listen(port, "localhost", () => {
    console.log(
      `[server] ${
        secure ? "https" : "http"
      }://localhost:${port} (refresh after rebuilds)`
    );
  });
  process.on("SIGINT", () => stop());
  process.on("SIGTERM", () => stop());
}

if (require.main === module) start();

module.exports = { createStaticServer };
