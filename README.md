<!-- @format -->

# madie-measure

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/00e4a2d8a15b448b9557d26268c0384e)](https://www.codacy.com/gh/MeasureAuthoringTool/madie-measure/dashboard?utm_source=github.com&utm_medium=referral&utm_content=MeasureAuthoringTool/madie-measure&utm_campaign=Badge_Grade)

Measure Application

## Development

Use Node.js 22.15 or newer. `npm start` serves the SystemJS microfrontend on
port 8505 with webpack-dev-server and hot reload. `npm run starts` uses the
existing HTTPS configuration.

Utilities use `mm:` classes compiled by Tailwind 4 through PostCSS. Class-only
wrappers use normal HTML elements, with `classnames` for conditional/existing
classes. The original global reset, form styles, colors, and fonts are preserved;
Tailwind Preflight is not loaded. Existing dynamic styled-components remain
where needed to retain their style precedence. Run `npm run test:styles` to
verify the original reset/theme and compiled utilities.

webpack-dev-server is retained for hot reload. Its development-only
`http-proxy-middleware` / `micromatch` / `braces` chain currently reports four high
findings from the unpatched
[braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
This tooling is not included in production bundles.

```
npm install .

```

# Running the application

Running server with http

```
npm run start
```

Running Server with https

```
npm run starts
```
