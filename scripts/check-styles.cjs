const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const babel = require("@babel/core");
const postcss = require("postcss");

const root = path.resolve(__dirname, "..");
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const parse = (filename) =>
  babel.parseSync(fs.readFileSync(filename, "utf8"), {
    configFile: false,
    babelrc: false,
    parserOpts: {
      plugins: ["typescript", ...(filename.endsWith(".tsx") ? ["jsx"] : [])],
    },
  });

async function check() {
  const globalStyles = parse(path.join(root, "src/styles/GlobalStyles.tsx"));
  const reset = globalStyles.program.body.find(
    (node) => node.declarations?.[0]?.id.name === "BaseStyles"
  ).declarations[0].init.quasi.quasis[0].value.cooked;
  assert.equal(
    hash(reset),
    "1730ff8fe63cd36829437a67cb06b06f9746a39ce115032af10e2db179f3b4b9",
    "Preserve the original global reset and form styles"
  );
  const from = path.join(root, "src/styles/tailwind.css");
  const source = fs.readFileSync(from, "utf8");
  const theme = [];
  postcss.parse(source).walkDecls((decl) => {
    if (/^--(color|font)-/.test(decl.prop))
      theme.push([
        "--mm-" + decl.prop.slice(2),
        decl.value.replace(/\\ /g, " ").replace(/["']/g, "").toLowerCase(),
      ]);
  });
  assert.equal(theme.length, 96);
  assert.equal(
    hash(JSON.stringify(theme.sort(([a], [b]) => a.localeCompare(b)))),
    "2082228a7d05f4e272ad69bdc215cc8e384879a65b78f2357cb59fc536ab8865",
    "Preserve all original theme colors and fonts"
  );
  const result = await postcss([
    require("@tailwindcss/postcss")(),
    require("autoprefixer")(),
    require("postcss-preset-env")({
      features: { "cascade-layers": false },
    }),
  ]).process(source, { from });
  const selectors = [];
  result.root.walkRules((rule) => selectors.push(rule.selector));
  const classes = new Set();
  function visit(node, inClassName = false) {
    if (!node || typeof node !== "object") return;
    if (node.type === "JSXAttribute")
      inClassName = node.name.name === "className";
    if (inClassName && node.type === "StringLiteral") {
      for (const value of node.value.split(/\s+/))
        if (value.startsWith("mm:")) classes.add(value);
    }
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "comments", "tokens"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach((n) => visit(n, inClassName));
      else if (value && typeof value === "object") visit(value, inClassName);
    }
  }
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory() && entry.name !== "coverage") walk(filename);
      else if (/\.tsx$/.test(filename)) visit(parse(filename));
    }
  }
  walk(path.join(root, "src"));
  assert(classes.size > 100, "Expected migrated utility classes");
  for (const value of classes) {
    const selector = "." + value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
    assert(
      selectors.some(
        (candidate) =>
          candidate === selector ||
          candidate.startsWith(selector + " ") ||
          candidate.startsWith(selector + ":") ||
          candidate.startsWith(selector + ",")
      ),
      `Missing compiled utility: ${value}`
    );
  }
  assert(!result.css.includes("not(#"), "Keep normal utility specificity");
  result.root.walkRules((rule) => {
    if (/(^|,)\s*(\*|html|body)\s*($|,)/.test(rule.selector)) {
      rule.walkDecls((decl) =>
        assert(
          decl.prop.startsWith("--tw-"),
          "Global utility initialization must not introduce a new reset"
        )
      );
    }
  });
  assert.match(source, /--breakpoint-sm:\s*640px/);
  assert.match(source, /--breakpoint-lg:\s*1024px/);
  assert.match(source, /--text-sm--line-height:\s*1\.25rem/);
  assert.match(source, /:not\(\[hidden\]\) ~ :not\(\[hidden\]\)/);
  assert(
    fs
      .readFileSync(path.join(root, "src/root.component.tsx"), "utf8")
      .includes('import "./styles/tailwind.css"'),
    "Load utility CSS from the root"
  );
  console.log(
    `Original reset/forms, 96 theme values, and ${classes.size} compiled utilities verified.`
  );
}

check().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
