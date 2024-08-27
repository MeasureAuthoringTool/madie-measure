import { CqlAntlr, CqlResult } from "@madie/cql-antlr-parser/dist/src";
import { Code } from "@madie/madie-models";
import { CqlApplyActionResult } from "./CqlApplyActionResult";

const findCodeSystem = (code, codeSystems) => {
  if (!code || !codeSystems) {
    return undefined;
  }
  return codeSystems.find((codeSystem) => {
    const oldCodeSystemName = codeSystem.name.replace(/["']/g, "");
    const oldCodeSystemOid = codeSystem.oid
      .replace(/["']/g, "")
      ?.replace(/urn:oid:/g, "");
    const oldCodeSystemVersion = codeSystem.version
      ?.replace(/["']/g, "")
      ?.replace(/urn:hl7:version:/g, "");

    if (code.versionIncluded) {
      return (
        oldCodeSystemName === `${code.codeSystem}:${code.svsVersion}` &&
        oldCodeSystemOid === code.codeSystemOid &&
        oldCodeSystemVersion === code.svsVersion
      );
    } else {
      return (
        oldCodeSystemName === code.codeSystem &&
        oldCodeSystemOid === code.codeSystemOid
      );
    }
  });
};

const findCode = (code, codes) => {
  if (!code || !codes) {
    return undefined;
  }
  return codes.find((oldCode) => {
    const oldCodeCodeId = oldCode.codeId.replace(/["']/g, "");
    // get code system by ignoring version
    const oldCodeCodeSystem = oldCode.codeSystem
      .replace(/["']/g, "")
      .split(":")[0];
    return oldCodeCodeId === code.name && oldCodeCodeSystem === code.codeSystem;
  });
};

const createCodeDeclaration = (code: Code) => {
  let newCode = `code "${code.display}`;
  if (code.suffix) {
    newCode += ` (${code.suffix})`;
  }
  if (code.versionIncluded) {
    newCode += `": '${code.name}' from "${code.codeSystem}:${code.svsVersion}" display '${code.display}'`;
  } else {
    newCode += `": '${code.name}' from "${code.codeSystem}" display '${code.display}'`;
  }
  return newCode;
};

const createCodeSystemDeclaration = (code: Code) => {
  if (code.versionIncluded) {
    return `codesystem "${code.codeSystem}:${code.svsVersion}": 'urn:oid:${code.codeSystemOid}' version 'urn:hl7:version:${code.svsVersion}'`;
  } else {
    return `codesystem "${code.codeSystem}": 'urn:oid:${code.codeSystemOid}'`;
  }
};

const applyCode = (cql: string, code: Code): CqlApplyActionResult => {
  const cqlArr: string[] = cql.split("\n");

  // Parse CQL to get code and code systems
  const parseResults: CqlResult = new CqlAntlr(cql).parse();

  // Let's check if the code system is already in the CQL
  const previousCodeSystem = findCodeSystem(code, parseResults.codeSystems);
  // Add code system to CQL if it does not exist
  if (!previousCodeSystem) {
    let newCodeSystem = createCodeSystemDeclaration(code);
    cqlArr.splice(findCodeSystemInsertPoint(parseResults), 0, newCodeSystem);
  }

  let status = "success";
  let message: string;
  // find if the code exists
  const previousCode = findCode(code, parseResults.codes);
  // prepare new code
  const newCode = createCodeDeclaration(code);
  // check if new code is same as existing
  if (previousCode?.text === newCode) {
    message = `Code ${code.name} has already been defined in CQL.`;
    status = "info";
  } //if code exists, update it
  else if (previousCode) {
    if (previousCodeSystem) {
      cqlArr[previousCode.stop.line - 1] = newCode;
    } else {
      cqlArr[previousCode.stop.line] = newCode;
    }
    message = `Code ${code.name} has been updated successfully.`;
  } // Add new code
  else {
    if (previousCodeSystem) {
      cqlArr.splice(findCodeInsertPoint(parseResults), 0, newCode);
    } else {
      cqlArr.splice(findCodeInsertPoint(parseResults) + 1, 0, newCode);
    }
    message = `Code ${code.name} has been successfully added to the CQL.`;
  }
  //return the array as a string
  return {
    cql: cqlArr.join("\n"),
    status: status,
    message: message,
  } as unknown as CqlApplyActionResult;
};

export const findCodeInsertPoint = (parseResults: CqlResult) => {
  if (!parseResults || Object.keys(parseResults).length === 0) {
    // 1 because code system would be added at 0 if editor is empty and code would be on line 1
    return 1;
  }
  if (parseResults.codes.length > 0) {
    return parseResults.codes[parseResults.codes.length - 1].stop.line;
  } else if (parseResults.valueSets.length > 0) {
    return (
      parseResults.valueSets[parseResults.valueSets.length - 1].stop.line + 1
    );
  } else if (parseResults.codeSystems.length > 0) {
    return (
      parseResults.codeSystems[parseResults.codeSystems.length - 1].stop.line +
      1
    );
  } else if (parseResults.includes.length > 0) {
    return (
      parseResults.includes[parseResults.includes.length - 1].stop.line + 1
    );
  } else if (parseResults.using) {
    return parseResults.using.stop.line + 1;
  } else if (parseResults.library) {
    return 2;
  } else {
    return 1;
  }
};

export const findCodeSystemInsertPoint = (parseResults: CqlResult) => {
  if (!parseResults || Object.keys(parseResults).length === 0) {
    // code system would be added at 0 if editor is empty
    return 0;
  }
  if (parseResults.codeSystems.length > 0) {
    return parseResults.codeSystems[parseResults.codeSystems.length - 1].stop
      .line;
  } else if (parseResults.includes.length > 0) {
    return (
      parseResults.includes[parseResults.includes.length - 1].stop.line + 1
    );
  } else if (parseResults.using) {
    return parseResults.using.start.line + 1;
  } else if (parseResults.library) {
    return 1;
  } else {
    return 0;
  }
};
export default applyCode;
