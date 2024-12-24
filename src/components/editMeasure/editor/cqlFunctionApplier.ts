import { CqlAntlr, CqlResult } from "@madie/cql-antlr-parser/dist/src";
import { CqlApplyActionResult } from "./CqlApplyActionResult";
import { CQLFunction } from "@madie/madie-editor";

function findMatchingArguments(objects, matchCriteria) {
  // first parse out and compare function names.
  const appliedFuntionName = matchCriteria.functionName.toLowerCase();
  const functionName = /"(.*?)"/;
  // further filter down objects array with only members whos name matches applied function name
  objects = objects.filter((obj) => {
    const matchResult = obj.text.match(functionName);
    const res = matchResult ? matchResult[1].toLowerCase() : null;
    return res === appliedFuntionName;
  });

  // string values inside of arguments parens
  const firstParensRegex = /\(([^)]+)\)/;
  // Extracts arguments (name and data type)
  const argumentRegex = /(\w+)\s+"([^"]+)"/g;

  const result = [];
  // iterate through all objects text properties
  const { functionsArguments } = matchCriteria;
  objects.forEach((obj) => {
    if (!obj.text) return;
    const parensMatch = obj.text.match(firstParensRegex);
    // if nothing in the parens of our comparison obj and nothing in the supplied fn to apply, we know it's the same by earlier name match
    if (!parensMatch && functionsArguments.length == 0) {
      result.push(obj);
      return;
    }
    //get only first parens
    const parensContent = parensMatch[1];
    //parse out the args from the string to compare
    const args = [];
    let match;
    while ((match = argumentRegex.exec(parensContent)) !== null) {
      args.push({ argumentName: match[1], dataType: match[2] });
    }
    // now we need to make sure that there are no misses on all args.
    // if they don't have the same number of arguments we know we can skip a deeper check
    if (functionsArguments.length !== args.length) {
      return null;
    }

    // iterate through all cql matches, if args shallowEqual functionsArguments we push the object.
    let missed = false;
    args.forEach((arg, index) => {
      const target = functionsArguments[index];
      if (
        target.argumentName !== arg.argumentName ||
        target.dataType !== arg.dataType
      ) {
        missed = true;
        return;
      }
    });

    if (!missed) {
      result.push(obj);
    }
  });
  if (result.length) {
    return result[0];
  }
  return null;
}

const findExistingCQLFunction = (cqlFunction, expressionDefinitions) => {
  if (!cqlFunction || !expressionDefinitions) {
    return undefined;
  }

  //   Do a primary check on function name before we regex it.
  const matchingCqlFunctionNames = [];
  expressionDefinitions.forEach((expression) => {
    // get the name of the expression (first encounter of characters in double quotes)
    const match = expression?.text.match(/"([^"]+)"/);
    const expressionName = match ? match[1] : null;
    if (expressionName && expressionName === cqlFunction.functionName) {
      matchingCqlFunctionNames.push(expressionName);
    }
  });
  //   if we have a matching functionName, we want to compare the args # and dataTypes in order;
  const result = findMatchingArguments(expressionDefinitions, cqlFunction);
  return result;
};

const createCQLFunctionDeclaration = (cqlFunction: CQLFunction) => {
  let functionDeclarationString = "define ";
  // fluent?
  if (cqlFunction?.fluentFunction) {
    functionDeclarationString += "fluent ";
  }
  functionDeclarationString += `function "${cqlFunction.functionName}"`;
  // prepend comment
  if (cqlFunction?.comment) {
    functionDeclarationString =
      `/* ${cqlFunction?.comment} */` + "\n" + functionDeclarationString;
  }
  // begin args
  functionDeclarationString += "(";
  const args = cqlFunction?.functionsArguments;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    functionDeclarationString += `${arg.argumentName} "${arg.dataType}"`;
    // do we add a comma?
    if (i < args.length - 1) {
      functionDeclarationString += ", ";
    }
  }
  // end args
  functionDeclarationString += "):";
  // new line before expression?
  functionDeclarationString += "\n";
  // prepend newline for format
  return "\n" + functionDeclarationString + "  " + cqlFunction?.expressionValue;
};

const applyCQLFunction = (
  cql: string,
  cqlFunction: CQLFunction
): CqlApplyActionResult => {
  const cqlArr: string[] = cql.split("\n");
  const parseResults: CqlResult = new CqlAntlr(cql).parse();
  // quick filter out the non function or fluent function definitions.
  // the parser will assume whatever comes after define is the name. in this case it's fluent or function
  const functionDefinitions = parseResults?.expressionDefinitions.filter(
    (exp) => {
      return (
        exp?.name.toLowerCase() === "fluent" ||
        exp?.name.toLowerCase() === "function"
      );
    }
  );

  const existingFunction = findExistingCQLFunction(
    cqlFunction,
    functionDefinitions
  );

  let status = "";
  let message: string = "";
  //  it's not defined
  if (!existingFunction) {
    let newFunctionDeclaration = createCQLFunctionDeclaration(cqlFunction);
    cqlArr.splice(
      findCQLFunctionInsertPoint(parseResults),
      0,
      newFunctionDeclaration
    );
    status = "success";
    message = `Function ${cqlFunction.functionName} has been successfully added to the CQL.`;
  } else {
    message = `Function ${cqlFunction.functionName} has already been defined in CQL.`;
    status = "info";
  }
  return {
    cql: cqlArr.join("\n"),
    status: status,
    message: message,
  } as unknown as CqlApplyActionResult;
};

/*
    0 Library
    1 using
    2  include
    3 codeSystem
    4 valueSet
    5 code
    6 parameter
    7 expressionDefinitions
*/
export const findCQLFunctionInsertPoint = (parseResults: CqlResult) => {
  if (!parseResults || Object.keys(parseResults).length === 0) {
    // put at front if empty
    return 0;
  }
  // at end of expressionDefinitions if it exists as priority 1
  if (parseResults.expressionDefinitions.length) {
    return parseResults.expressionDefinitions[
      parseResults.expressionDefinitions.length - 1
    ].stop.line;
  }
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
  if (parseResults.usings[0]) {
    const lastUsing = parseResults.usings[parseResults.usings.length - 1];
    return lastUsing.stop.line + 1;
  }
  if (parseResults.library) {
    return 2;
  } else {
    return 1;
  }
};

export const deleteCQLFunction = (
  cql: string,
  cqlFunction: CQLFunction
): CqlApplyActionResult => {
  const cqlArr: string[] = cql.split("\n");
  const parseResults: CqlResult = new CqlAntlr(cql).parse();

  const functionDefinitions = parseResults?.expressionDefinitions.filter(
    (exp) => {
      return (
        exp?.name.toLowerCase() === "fluent" ||
        exp?.name.toLowerCase() === "function"
      );
    }
  );

  const existingFunction = functionDefinitions?.find((funct) => {
    return funct.text === cqlFunction.expression;
  });

  let status = "";
  let message: string = "";
  if (existingFunction) {
    cqlArr.splice(
      existingFunction.start.line - 1,
      existingFunction.stop.line - existingFunction.start.line + 1,
      ""
    );
    status = "success";
    message = `Function ${cqlFunction.functionName} has been successfully removed from the CQL.`;
  } else {
    message = `Function ${cqlFunction.functionName} has not been defined in CQL.`;
    status = "info";
  }
  return {
    cql: cqlArr.join("\n"),
    status: status,
    message: message,
  } as unknown as CqlApplyActionResult;
};

export default applyCQLFunction;
