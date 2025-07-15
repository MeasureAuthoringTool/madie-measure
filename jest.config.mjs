import { createRequire } from "module";
process.env.NODE_OPTIONS = "--experimental-vm-modules --preserve-symlinks";

const require = createRequire(import.meta.url);
export default {
  roots: ["<rootDir>"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  preset: "ts-jest/presets/default-esm",
  moduleDirectories: ["node_modules"],
  modulePathIgnorePatterns: [],
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.svg$": "<rootDir>/svgTransform.cjs",
    "^.+\\.(ts|tsx|js|jsx)$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "ESNext",
        },
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@madie/madie-util|@madie/madie-design-system|formik)/)",
  ],
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
    "single-spa-react/parcel": "single-spa-react/lib/cjs/parcel.cjs",
    "^react($|/.+)": "<rootDir>/node_modules/react$1",
    "^@madie/madie-util$": "<rootDir>/src/__mocks__/@madie/madie-util.tsx",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom", "<rootDir>/jest.setup.mjs"],
};
