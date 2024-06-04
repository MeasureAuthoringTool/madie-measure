import * as Yup from "yup";
import { Model } from "@madie/madie-models";

export const ERROR_MAP = {
  required: {
    test: (name: string, model: Model) => {
      return name.length > 0;
    },
    message: "Library name is required.",
  },
  max: {
    test: (name: string, model: Model) => {
      return name.length <= 64;
    },
    message: "Library name cannot be more than 64 characters.",
  },
  qdmCheck: {
    test: (name: string, model: Model) => {
      if (model !== Model.QDM_5_6) {
        return true;
      }
      return /^[A-Z][a-zA-Z0-9_]*$/.test(name);
    },
    message:
      "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters except for underscore in the case of QDM.",
  },
  qiCoreCheck: {
    test: (name: string, model: Model) => {
      if (model !== Model.QICORE) {
        return true;
      }
      return /^[A-Z][a-zA-Z0-9]*$/.test(name);
    },
    message:
      "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters.",
  },
};

const getLibraryNameErrors = (libraryName: string, model: Model) => {
  const errorList = [];

  for (const errorInfo in ERROR_MAP) {
    const testMatch = ERROR_MAP[errorInfo].test(libraryName, model);
    if (!testMatch) {
      errorList.push(ERROR_MAP[errorInfo].message);
    }
  }
  return errorList;
};

export default getLibraryNameErrors;
