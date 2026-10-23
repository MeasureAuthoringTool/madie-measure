const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const babel = require("@babel/core");
const postcss = require("postcss");

const root = path.resolve(__dirname, "..");
const digest = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(file)
      : /\.tsx?$/.test(file)
      ? [file]
      : [];
  });
}

function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "comments"].includes(key)) continue;
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
    else if (value && typeof value === "object") walk(value, visit);
  }
}

async function checkStyles() {
  const globals = babel.parseSync(
    fs.readFileSync(path.join(root, "src/styles/GlobalStyles.tsx"), "utf8"),
    {
      configFile: false,
      babelrc: false,
      parserOpts: { plugins: ["typescript", "jsx"] },
    }
  );
  const reset = globals.program.body.find(
    (node) => node.declarations?.[0]?.id.name === "BaseStyles"
  ).declarations[0].init.quasi.quasis[0].value.cooked;
  assert.equal(
    digest(reset),
    "1730ff8fe63cd36829437a67cb06b06f9746a39ce115032af10e2db179f3b4b9",
    "Preserve the original global reset and forms CSS"
  );
  const file = path.join(root, "src/styles/tailwind.css");
  const source = fs.readFileSync(file, "utf8");
  const theme = [];
  const compatibility = new Map();
  postcss.parse(source).walkAtRules("theme", (rule) => {
    rule.walkDecls((decl) => {
      if (/^--(color|font)-/.test(decl.prop)) {
        theme.push([decl.prop, decl.value]);
      } else {
        compatibility.set(decl.prop, decl.value);
      }
    });
  });
  assert.equal(
    digest(JSON.stringify(theme.sort((a, b) => a[0].localeCompare(b[0])))),
    "43f80f69d3904d7739f2220cfd09b25cbc3c29673b6c4fccf77fef5d942cede3",
    "Preserve all 96 original theme colors and fonts"
  );
  for (const [name, value] of Object.entries({
    "--breakpoint-sm": "640px",
    "--breakpoint-md": "768px",
    "--breakpoint-lg": "1024px",
    "--breakpoint-xl": "1280px",
    "--breakpoint-2xl": "1536px",
    "--text-xs--line-height": "1rem",
    "--text-sm--line-height": "1.25rem",
    "--text-base--line-height": "1.5rem",
    "--text-lg--line-height": "1.75rem",
  })) {
    assert.equal(compatibility.get(name), value, name);
  }

  const config = require("../postcss.config");
  const plugins = Object.entries(config.plugins).map(([name, options]) =>
    require(name)(options)
  );
  const result = await postcss(plugins).process(source, { from: file });
  assert(
    !result.css.includes(":not(#"),
    "Do not increase utility specificity when preserving native cascade layers"
  );
  const utilities = new Set();
  for (const file of sourceFiles(path.join(root, "src"))) {
    const content = fs.readFileSync(file, "utf8");
    if (!content.includes("mm:")) continue;
    const ast = babel.parseSync(content, {
      configFile: false,
      babelrc: false,
      parserOpts: { plugins: ["typescript", "jsx"] },
    });
    walk(ast.program, (node) => {
      if (
        (node.type === "JSXAttribute" && node.name.name === "className") ||
        (node.type === "ObjectProperty" && node.key.name === "className")
      ) {
        walk(node.value, (value) => {
          const text =
            value.type === "StringLiteral"
              ? value.value
              : value.type === "TemplateElement"
              ? value.value.cooked
              : "";
          for (const utility of text.match(/\bmm:[\w:!./-]+/g) || []) {
            utilities.add(utility);
          }
        });
      }
    });
  }
  for (const utility of utilities) {
    const selector = "." + utility.replace(/[^\w-]/g, "\\$&");
    let found = false;
    result.root.walkRules((rule) => {
      if (
        rule.selector === selector ||
        rule.selector.startsWith(selector + ":") ||
        rule.selector.startsWith(selector + " ")
      ) {
        found = true;
      }
    });
    assert(found, `Missing compiled utility: ${utility}`);
  }
  assert(result.css.includes("0 1px 2px 0 var(--tw-shadow-color"));
  assert(result.css.includes("&:hover") || result.css.includes(":hover"));
  assert(result.css.includes(":not([hidden]) ~ :not([hidden])"));
  assert(
    fs
      .readFileSync(path.join(root, "src/root.component.tsx"), "utf8")
      .includes('import "./styles/tailwind.css"')
  );
  console.log(
    `Original reset/forms, 96 theme values, and ${utilities.size} compiled utilities verified.`
  );
}

checkStyles().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
