module.exports = {
  rootDir: "src",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(j|t)sx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css)$": "identity-obj-proxy",
    "single-spa-react/parcel": "single-spa-react/lib/cjs/parcel.cjs",
    "types/(.*)": "<rootDir>/src/types/$1",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  modulePaths: ["<rootDir>"],
};
