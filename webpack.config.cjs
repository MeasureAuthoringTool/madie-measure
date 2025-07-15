/** @format */

const { mergeWithRules } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const fs = require("fs");

module.exports = (webpackConfigEnv, argv) => {
  const protocol = webpackConfigEnv.protocol || "http";

  let https;
  try {
    if (protocol === "https") {
      https = {
        key: fs.readFileSync(path.resolve(__dirname, "localhost.key"), "utf-8"),
        cert: fs.readFileSync(
          path.resolve(__dirname, "localhost.crt"),
          "utf-8"
        ),
      };
    } else {
      https = false;
    }
  } catch {
    console.warn(
      "Consider creating an SSL certificate at ./localhost.key and ./localhost.crt, so you can tell your operating system to trust the certificate"
    );
  }

  const defaultConfig = singleSpaDefaults({
    orgName: "madie",
    projectName: "madie-measure",
    webpackConfigEnv,
    argv,
    disableHtmlGeneration: true,
    orgPackagesAsExternal: false,
  });

  const babelLoaderRule = {
    test: /\.(js|ts|jsx|tsx)$/,
    exclude: /node_modules/,
    use: "babel-loader",
  };

  const cssRules = {
    module: {
      rules: [
        { test: /\.m?js$/, type: "javascript/auto" },
        babelLoaderRule,
        {
          test: /\.css$/i,
          include: path.resolve(__dirname, "src"),
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
        {
          test: /\.scss$/,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: { sourceMap: true, importLoaders: 2 },
            },
            {
              loader: "postcss-loader",
              options: { sourceMap: true },
            },
            "sass-loader",
          ],
          exclude: /node_modules/,
        },
        { test: /\.json$/, type: "json" },
      ],
    },
  };

  const polyfillConfig = {
    plugins: [new NodePolyfillPlugin()],
  };

  const handlebarsConfig = {
    module: {
      rules: [
        {
          include: [/node_modules\/.*\/fqm_execution\/templates/],
          test: /\.(js|handlebars|hbs)$/,
          loader: "handlebars-loader",
        },
      ],
    },
  };

  const esmOutputConfig = {
    target: "web",
    output: {
      filename: "madie-madie-measure.js",
    },
    externals: {
      react: "react",
      "react-dom": "react-dom",
      "react-dom/client": "react-dom/client",

      "react/jsx-runtime": "react/jsx-runtime",
      "react/jsx-dev-runtime": "react/jsx-dev-runtime",

      "@madie/madie-util": "@madie/madie-util",
      "@madie/madie-editor": "@madie/madie-editor",
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".jsx", ".scss", ".sass"],
      fallback: {
        fs: false,
      },
      alias: {
        handlebars: "handlebars/dist/handlebars.min.js",
      },
    },
  };

  const devServerConfig = {
    devServer: {
      https,
      static: [
        {
          directory: path.join(__dirname, "local-dev-env"),
          publicPath: "/importmap",
        },
        {
          directory: path.join(
            __dirname,
            "node_modules/@madie/madie-root/dist/"
          ),
          publicPath: "/",
        },
        {
          directory: path.join(
            __dirname,
            "node_modules/@madie/madie-editor/dist/"
          ),
          publicPath: "/madie-editor",
        },
        {
          directory: path.join(
            __dirname,
            "node_modules/@madie/madie-auth/dist/"
          ),
          publicPath: "/madie-auth",
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.join(
          __dirname,
          "node_modules/@madie/madie-root/dist/index.html"
        ),
      }),
    ],
  };

  // I have no idea what this was supposed to do, but it didn't do it.
  const htmlPluginConfig = {
    plugins: [
      new HtmlWebpackPlugin({
        template: path.join(
          __dirname,
          "node_modules/@madie/madie-root/dist/index.html"
        ),
      }),
    ],
  };

  return mergeWithRules({
    module: {
      rules: {
        test: "match",
        use: "replace",
      },
    },
    plugins: "append",
  })(
    defaultConfig,
    polyfillConfig,
    handlebarsConfig,
    htmlPluginConfig,
    cssRules,
    esmOutputConfig,
    devServerConfig,
    {
      optimization: {
        minimize: false,
      },
    }
  );
};
