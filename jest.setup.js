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

jest.mock(
  "monaco-editor",
  () => {
    return {
      KeyCode: { Escape: 9 },
      editor: {
        defineTheme: jest.fn(),
        setTheme: jest.fn(),
      },
    };
  },
  { virtual: true }
);

jest.mock(
  "@monaco-editor/react",
  () => {
    const React = require("react");
    const MockMonacoEditor = ({ value, onChange, onMount, options }) => {
      React.useEffect(() => {
        const fakeEditor = {
          getAction: () => ({ run: jest.fn() }),
        };
        onMount?.(fakeEditor);
      }, [onMount]);

      return React.createElement("textarea", {
        role: "textbox",
        value: value || "",
        readOnly: Boolean(options?.readOnly),
        onChange: (event) => onChange?.(event.target.value),
      });
    };

    return {
      __esModule: true,
      default: MockMonacoEditor,
    };
  },
  { virtual: true }
);
