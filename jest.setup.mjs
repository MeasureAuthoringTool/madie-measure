// import { jest } from "jest/globals";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import advancedFormat from "dayjs/plugin/advancedFormat";
// import util from "@madie/madie-util";
// let util;

beforeAll(async () => {
//   const mod = await import("@madie/madie-design-system");
//   util = mod.default || mod;
    dayjs.extend(utc);
    dayjs.extend(timezone);
    dayjs.extend(advancedFormat);
    dayjs.utc().format();
    // jest.setTimeout(30000);
//   global.System = {
//     import: jest.fn(mockImport),
//   };
});

// function mockImport(importName) {
//   if (importName === "@madie/madie-util") {
//     return Promise.resolve(util);
//   } else {
//     console.warn("No mock module found");
//     return Promise.resolve({});
//   }
// }



// beforeAll(() => {
//   jest.setTimeout(30000);
// });
