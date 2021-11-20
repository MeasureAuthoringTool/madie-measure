module.exports = {
  rootDir: "src",
  roots: ["<rootDir>/src/"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(j|t)sx?$": "babel-jest",
  },
  transformIgnorePatterns: ["node_modules/(?!formik)/"],
  moduleNameMapper: {
    "\\.(css)$": "identity-obj-proxy",
    "single-spa-react/parcel": "single-spa-react/lib/cjs/parcel.cjs",
    "@madie/madie-components":
      "<rootDir>/node_modules/@madie/madie-components/src/madie-madie-components.tsx",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
};
