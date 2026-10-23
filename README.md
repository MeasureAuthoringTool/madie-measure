<!-- @format -->

# madie-measure

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/00e4a2d8a15b448b9557d26268c0384e)](https://www.codacy.com/gh/MeasureAuthoringTool/madie-measure/dashboard?utm_source=github.com&utm_medium=referral&utm_content=MeasureAuthoringTool/madie-measure&utm_campaign=Badge_Grade)

Measure Application

Use Node.js 20.19 or newer.

Utilities are compiled by Tailwind 4 through PostCSS using the `mm:` prefix.
The original reset, form styles, theme colors, and fonts are retained; Tailwind
Preflight is not loaded. `npm run test:styles` verifies those values and that
every utility used in the source is compiled. Dynamic status styles remain in
styled-components so their existing precedence is preserved.

`npm start` runs webpack watch and a Node static server on port 8505. Source
changes rebuild automatically, but **refresh the browser manually** after
rebuilds: HMR and automatic browser refresh are no longer provided. This removes
webpack-dev-server's unpatched proxy/matcher dependency chain.

The server serves build output and public assets with CORS and no caching.
Build errors are printed, and asset requests return 503 until a successful
build is available. Override the port with `PORT=8525 npm start` or
`npm start -- --port 8525`.

`npm run starts` retains HTTPS support using `localhost.key` and `localhost.crt`;
missing certificates fail explicitly instead of falling back to HTTP.
Run `npm run test:server` to verify the server's response behavior.

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
