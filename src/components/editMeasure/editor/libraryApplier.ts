import { IncludeLibrary } from "@madie/madie-editor";
import { CqlAntlr, CqlResult } from "@madie/cql-antlr-parser/dist/src";
import { CqlApplyActionResult } from "./CqlApplyActionResult";

const findInsertionPoint = (parseResults: CqlResult) => {
  // if there are other included libraries present, add this next to them
  if (parseResults.includes.length > 0) {
    return parseResults.includes[parseResults.includes.length - 1].stop.line;
  }
  // if no includes present, add this library after using statement
  if (parseResults.using) {
    return parseResults.using.start.line;
  }
  // if no includes & using present, add this library after library statement
  if (parseResults.library) {
    return parseResults.library.start.line;
  }
  return 0;
};

const getIncludeStatementForLibrary = (library) => {
  return `include ${library.name} version '${library.version}' called ${library.alias}`;
};

export const applyLibrary = (
  cql: string,
  library: IncludeLibrary
): CqlApplyActionResult => {
  if (!library) {
    return;
  }
  if (cql) {
    const cqlArr: string[] = cql.split("\n");
    // Parse CQL to get included libraries
    const parsedResults: CqlResult = new CqlAntlr(cql).parse();
    const existingLibrary = parsedResults?.includes.find(
      (l) => l.name === library.name || l.called === library.alias
    );
    if (existingLibrary) {
      let message;
      if (existingLibrary.name === library.name) {
        message = `Library ${library.name} has already been defined in the CQL.`;
      } else {
        message = `Alias ${library.alias} has already been defined in the CQL.`;
      }
      return {
        cql: cql,
        status: "info",
        message: message,
      };
    }
    cqlArr.splice(
      findInsertionPoint(parsedResults),
      0,
      getIncludeStatementForLibrary(library)
    );
    return {
      cql: cqlArr.join("\n"),
      status: "success",
      message: `Library ${library.name} has been successfully added to the CQL.`,
    };
  } else {
    // if no cql, include it as first line in cql
    return {
      cql: getIncludeStatementForLibrary(library),
      status: "success",
      message: `Library ${library.name} has been successfully added to the CQL.`,
    };
  }
};
