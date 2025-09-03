import { CqlAntlr, CqlResult } from "@madie/cql-antlr-parser/dist/src";
import { Code, Model } from "@madie/madie-models";
import { CqlApplyActionResult } from "./CqlApplyActionResult";

// e.g. returns 20240901 for 'http://snomed.info/sct/731000124108/version/20240901'
const getShortVersion = (version: string) => {
  return version?.split("/version/").pop();
};

const findCodeSystem = (code, codeSystems, measureModel) => {
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

    if (measureModel === Model.QDM_5_6) {
      if (code.versionIncluded) {
        return (
          oldCodeSystemName === `${code.codeSystem}:${code.svsVersion}` &&
          oldCodeSystemOid === code.codeSystemOid &&
          oldCodeSystemVersion === code.svsVersion
        );
      }
      return (
        oldCodeSystemName === code.codeSystem &&
        oldCodeSystemOid === code.codeSystemOid
      );
    } else {
      if (code.versionIncluded) {
        const shortVersion = getShortVersion(code.fhirVersion);
        return (
          oldCodeSystemName === `${code.codeSystem}:${shortVersion}` &&
          oldCodeSystemOid === code.codeSystemUrl &&
          oldCodeSystemVersion === code.fhirVersion
        );
      }
      return (
        oldCodeSystemName === code.codeSystem &&
        oldCodeSystemOid === code.codeSystemUrl
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

const createCodeDeclaration = (code: Code, measureModel: Model) => {
  let newCode = `code "${code.display}`;
  if (code.suffix) {
    newCode += ` (${code.suffix})`;
  }
  if (code.versionIncluded) {
    let shortVersion: string;
    if (measureModel === Model.QDM_5_6) {
      shortVersion = code.svsVersion;
    } else {
      shortVersion = getShortVersion(code.fhirVersion);
    }
    newCode += `": '${code.name}' from "${code.codeSystem}:${shortVersion}" display '${code.display}'`;
  } else {
    newCode += `": '${code.name}' from "${code.codeSystem}" display '${code.display}'`;
  }
  return newCode;
};

const createCodeSystemDeclaration = (code: Code, measureModel: Model) => {
  let oid: string;
  let codeSystemVersion: string;
  let versionSuffix: string;
  if (measureModel === Model.QDM_5_6) {
    versionSuffix = code.svsVersion;
    oid = `urn:oid:${code.codeSystemOid}`;
    codeSystemVersion = `urn:hl7:version:${code.svsVersion}`;
  } else {
    versionSuffix = getShortVersion(code.fhirVersion);
    oid = code.codeSystemUrl;
    codeSystemVersion = code.fhirVersion;
  }
  if (code.versionIncluded) {
    return `codesystem "${code.codeSystem}:${versionSuffix}": '${oid}' version '${codeSystemVersion}'`;
  } else {
    return `codesystem "${code.codeSystem}": '${oid}'`;
  }
};

const applyCode = (
  cql: string,
  code: Code,
  measureModel?: Model
): CqlApplyActionResult => {
  const cqlArr: string[] = cql.split("\n");

  // Parse CQL to get code and code systems
  const parseResults: CqlResult = new CqlAntlr(cql).parse();
  // Let's check if the code system is already in the CQL
  const previousCodeSystem = findCodeSystem(
    code,
    parseResults.codeSystems,
    measureModel
  );
  // Add code system to CQL if it does not exist
  if (!previousCodeSystem) {
    const newCodeSystem = createCodeSystemDeclaration(code, measureModel);
    cqlArr.splice(findCodeSystemInsertPoint(parseResults), 0, newCodeSystem);
  }

  let status = "success";
  let message: string;
  // find if the code exists
  const previousCode = findCode(code, parseResults.codes);
  // prepare new code
  const newCode = createCodeDeclaration(code, measureModel);
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
    return parseResults.valueSets[parseResults.valueSets.length - 1].stop.line;
  } else if (parseResults.codeSystems.length > 0) {
    return (
      parseResults.codeSystems[parseResults.codeSystems.length - 1].stop.line +
      1
    );
  } else if (parseResults.includes.length > 0) {
    return (
      parseResults.includes[parseResults.includes.length - 1].stop.line + 1
    );
  } else if (parseResults.usings?.length) {
    const lastUsing = parseResults.usings[parseResults.usings.length - 1];
    return lastUsing.stop.line + 1;
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
  } else if (parseResults.usings?.length) {
    return parseResults.usings[0].start.line + 1;
  } else if (parseResults.library) {
    return 1;
  } else {
    return 0;
  }
};
export default applyCode;
