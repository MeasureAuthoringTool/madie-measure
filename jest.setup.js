import util from "@madie/madie-util";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import advancedFormat from "dayjs/plugin/advancedFormat";

// Mock SystemJS
global.System = {
  import: jest.fn(mockImport),
};

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
dayjs.utc().format();
function mockImport(importName) {
  if (importName === "@madie/madie-util") {
    return Promise.resolve(util);
  } else {
    console.warn("No mock module found");
    return Promise.resolve({});
  }
}

jest.setTimeout(30000);
