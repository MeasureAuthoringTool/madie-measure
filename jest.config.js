module.exports = {
  roots: ["<rootDir>"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(j|t)sx?$": "babel-jest",
    "^.+\\.js?$": require.resolve("babel-jest"),
  },
  transformIgnorePatterns: ["node_modules/(?!formik)/"],
  moduleNameMapper: {
    "\\.(css)$": "identity-obj-proxy",
    "single-spa-react/parcel": "single-spa-react/lib/cjs/parcel.cjs",
    "^react($|/.+)": "<rootDir>/node_modules/react$1", // makes sure all React imports are running off of the one in this package.
    "\\.(css|scss)$": "identity-obj-proxy",
    "@madie/madie-components":
      "<rootDir>/node_modules/@madie/madie-components/src/madie-madie-components.tsx",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom", "./jest.setup.js"],
  globals: {
    "ts-jest": {
      tsconfig: {
        jsx: "react-jsx",
      },
      useEsm: true,
    },
  },
};
