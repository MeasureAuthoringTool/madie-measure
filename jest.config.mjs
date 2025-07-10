import { createRequire } from "module";
const require = createRequire(import.meta.url);
process.env.NODE_OPTIONS = "--experimental-vm-modules --preserve-symlinks";

export default {
  roots: ["<rootDir>"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],

  moduleDirectories: ["node_modules"],
  
  resolver: undefined,
  modulePathIgnorePatterns: [],
  // extensionsToTreatAsEsm: [".ts", ".tsx", ".mjs"],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "mjs"],
    moduleFileExtensions: ['js', 'jsx', 'mjs', 'ts', 'tsx'],
  // haste: {
  //   enableSymlinks: true, 
  //   throwOnModuleCollision: true, 
  // },

  testEnvironment: "jsdom", // previous..
  // testEnvironment: "node", // still doesn't work
  // testEnvironmentOptions: {
  //   customExportConditions: [''],
  // },
  // transform: {
  //   "^.+\\.m?[jt]sx?$": require.resolve("babel-jest"), // ensures correct babel-jest version
  //   "^.+\\.svg$": "<rootDir>/svgTransform.cjs"
  // },
transform: {
    '^.+\\.mjs$': 'babel-jest',
    "^.+\\.svg$": "<rootDir>/svgTransform.cjs",
    "^.+\\.m?[jt]sx?$": ["babel-jest", { configFile: "./babel.config.json" }],
  },

  transformIgnorePatterns: [
    "node_modules/(?!(@madie/madie-util|formik)/)"
    // "node_modules/(?!(@madie/madie-design-system|@madie/madie-util|formik)/)"
    // "node_modules/(?!(@madie/madie-design-system|@madie/madie-util|formik)/)"


  ],
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
    "single-spa-react/parcel": "single-spa-react/lib/cjs/parcel.cjs",
    "^react($|/.+)": "<rootDir>/node_modules/react$1",
    "^@madie/madie-util$": "<rootDir>/src/__mocks__/madie-util.tsx"
  },
  setupFilesAfterEnv: [
    "@testing-library/jest-dom",
    "<rootDir>/jest.setup.mjs"
  ],
};