import { CqlAntlr, CqlResult } from "@madie/cql-antlr-parser/dist/src";
import { CqlApplyActionResult } from "./CqlApplyActionResult";
import { Parameter } from "@madie/madie-editor";

const findExistingParameter = (parameter, parameters) => {
  if (!parameter || !parameters) {
    return undefined;
  }
  return parameters.find((p) => {
    const current = p.name.replace(/["']/g, "");
    return current === parameter.parameterName;
  });
};

const createParameterDeclaration = (parameter: Parameter) => {
  return `parameter "${parameter.parameterName}" ${parameter.expression}`;
};

const applyParameter = (
  cql: string,
  parameter: Parameter
): CqlApplyActionResult => {
  const cqlArr: string[] = cql.split("\n");

  // Parse CQL to get code and code systems
  const parseResults: CqlResult = new CqlAntlr(cql).parse();
  // Let's check if the code system is already in the CQL
  const existingParameter = findExistingParameter(
    parameter,
    parseResults.parameters
  );
  // Add code system to CQL if it does not exist
  let status = "";
  let message: string;
  //  it's not defined
  if (!existingParameter) {
    let newParameter = createParameterDeclaration(parameter);
    cqlArr.splice(findParameterInsertPoint(parseResults), 0, newParameter);
    status = "success";
    message = `Parameter ${parameter.parameterName} has been successfully added to the CQL.`;
  } else {
    message = `Parameter ${parameter.parameterName} has already been defined in CQL.`;
    status = "info";
  }
  return {
    cql: cqlArr.join("\n"),
    status: status,
    message: message,
  } as unknown as CqlApplyActionResult;
};

/*
Insertion is going to attempt from paramters up towards the top of the page, ideally hitting parameters,
but if not we'll keep going one higher until a line number is present, otherwise we hit zero
    0 Library
    1 using
    2  include
    3 codeSystem
    4 valueSet
    5 code
    6 parameter
*/
export const findParameterInsertPoint = (parseResults: CqlResult) => {
  if (!parseResults || Object.keys(parseResults).length === 0) {
    // put at front if empty
    return 0;
  }
  // at end of parameters if it exists as priority 1
  if (parseResults.parameters.length) {
    return parseResults.parameters[parseResults.parameters.length - 1].stop
      .line;
  }
  if (parseResults.codes.length) {
    return parseResults.codes[parseResults.codes.length - 1].stop.line;
  }
  if (parseResults.valueSets.length) {
    return parseResults.valueSets[parseResults.valueSets.length - 1].stop.line;
  }
  if (parseResults.codeSystems.length) {
    return parseResults.codeSystems[parseResults.codeSystems.length - 1].stop
      .line;
  }
  if (parseResults.includes.length) {
    return parseResults.includes[parseResults.includes.length - 1].stop.line;
  }
  if (parseResults.using) {
    return parseResults.using.stop.line + 1;
  }
  if (parseResults.library) {
    return 2;
  } else {
    return 1;
  }
};
export default applyParameter;
