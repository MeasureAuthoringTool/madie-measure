import { CqlAntlr, CqlResult } from "@madie/cql-antlr-parser/dist/src";

const applyCode = (cql: string, code: any): string => {
  const cqlArr: string[] = cql.split("\n");
  //extract code, codesets from code object
  const parseResults: CqlResult = new CqlAntlr(cql).parse();

  // Let's check if the code set is already in the CQL
  let codeSystemExists: boolean = false;
  if (parseResults.codeSystems.length > 0) {
    parseResults.codeSystems.forEach((codesystem) => {
      const oldCodeSystemName = codesystem.name.replace(/["']/g, "");
      const oldCodeSystemOid = codesystem.oid.replace(/["']/g, "");
      codeSystemExists =
        codeSystemExists ||
        (oldCodeSystemName === code.codeSystem &&
          oldCodeSystemOid.split(":")[2] === code.codeSystemOid);
    });
  }

  if (!codeSystemExists) {
    //Add codeSystem to CQL
    const codeSystemAddition = `codesystem "${code.codeSystem}": 'urn:oid:${code.codeSystemOid}'`;
    cqlArr.splice(
      findCodeSystemInsertPoint(parseResults),
      0,
      codeSystemAddition
    );
  }

  //check to see if the code already exists.. add it if it doesn't
  let codeExists: boolean = false;
  if (parseResults.codes.length > 0) {
    //1.  Are there codes?  If so, add this one last
    parseResults.codes.forEach((oldCode) => {
      const oldCodeName = oldCode.name.replace(/["']/g, "");
      const oldCodeCodeId = oldCode.codeId.replace(/["']/g, "");
      const oldCodeCodeSystem = oldCode.codeSystem.replace(/["']/g, "");
      codeExists =
        codeExists ||
        (oldCodeName === code.display &&
          oldCodeCodeId === code.name &&
          oldCodeCodeSystem === code.codeSystem);
    });
  }

  if (!codeExists) {
    //add code to CQL
    cqlArr.splice(
      findCodeInsertPoint(parseResults),
      0,
      `code "${code.display}": '${code.name}' from "${code.codeSystem}" display '${code.display}'`
    );
    //display toast message?
  }

  //return the array as a string
  return cqlArr.join("\n");
};

const findCodeInsertPoint = (parseResults: CqlResult) => {
  const codes: number = parseResults.codes.length;
  const codesystems: number = parseResults.codeSystems.length;
  const includes: number = parseResults.includes.length;
  const usings: number = parseResults.using.start.line;

  if (codes > 0) {
    return parseResults.codes[parseResults.codes.length - 1].stop.line;
  } else if (codesystems > 0) {
    return parseResults.codeSystems[parseResults.codeSystems.length - 1].stop
      .line;
  } else if (includes > 0) {
    return parseResults.includes[parseResults.includes.length - 1].stop.line;
  } else if (usings > 0) {
    return parseResults.using.start.line;
  } else {
    return 1;
  }
};

const findCodeSystemInsertPoint = (parseResults: CqlResult) => {
  const codes: number = parseResults.codes.length;
  const codesystems: number = parseResults.codeSystems.length;
  const includes: number = parseResults.includes.length;
  const usings: number = parseResults.using.start.line;

  if (codesystems > 0) {
    return parseResults.codeSystems[parseResults.codeSystems.length - 1].stop
      .line;
  } else if (includes > 0) {
    return parseResults.includes[parseResults.includes.length - 1].stop.line;
  } else if (usings > 0) {
    return parseResults.using.start.line;
  } else {
    return 1;
  }
};
export default applyCode;
