import util from "@madie/madie-util";
// Mock SystemJS
global.System = {
  import: jest.fn(mockImport),
};

function mockImport(importName) {
  if (importName === "@madie/madie-util") {
    return Promise.resolve(util);
  } else {
    console.warn("No mock module found");
    return Promise.resolve({});
  }
}
