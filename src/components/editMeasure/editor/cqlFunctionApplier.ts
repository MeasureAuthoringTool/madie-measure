import { CqlAntlr, CqlResult } from "@madie/cql-antlr-parser/dist/src";
import { CqlApplyActionResult } from "./CqlApplyActionResult";
import { CQLFunction } from "@madie/madie-editor";

function findMatchingArguments(objects, matchCriteria) {
  // Function to extract arguments from inside parentheses
  function extractArguments(text) {
    const parensMatch = text.match(/\((.*)\)/);
    if (!parensMatch) return [];

    const parensContent = parensMatch[1];
    const argumentBuilder = [];
    const regex = /"([^"]+)"|([^\s",()]+)/g;
    let match;

    while ((match = regex.exec(parensContent)) !== null) {
      if (match[1]) {
        argumentBuilder.push(match[1]); // Remove quotes
      } else if (match[2]) {
        argumentBuilder.push(match[2]);
      }
    }

    const argumentsArray = [];
    for (let i = 0; i < argumentBuilder.length; i += 2) {
      argumentsArray.push({
        argumentName: argumentBuilder[i],
        dataType: argumentBuilder[i + 1] || "",
      });
    }

    return argumentsArray;
  }

  // Map over each object and extract the formatted arguments from `text`
  const outputArray = objects.map((item) => extractArguments(item.text));

  const result = [];
  const { functionsArguments } = matchCriteria;
  outputArray.forEach((obj) => {
    if (!obj) return;

    if (functionsArguments.length !== obj.length) {
      return;
    }

    let missed = false;
    obj.forEach((arg, index) => {
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

  return result.length ? result[0] : null;
}

const findExistingCQLFunction = (cqlFunction, expressionDefinitions) => {
  if (!cqlFunction || !expressionDefinitions) {
    return undefined;
  }

  //   Do a primary check on function name before we regex it.
  const matchingCqlFunctions = [];
  expressionDefinitions.forEach((expression) => {
    // get the name of the expression (first encounter of characters in double quotes)
    const match = expression?.text.match(/"([^"]+)"/);
    const expressionName = match ? match[1] : null;
    if (expressionName && expressionName === cqlFunction.functionName) {
      matchingCqlFunctions.push(expression);
    }
  });
  //   if we have a matching functionName, we want to compare the args # and dataTypes in order;
  const result = findMatchingArguments(matchingCqlFunctions, cqlFunction);
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
    functionDeclarationString += `"${arg.argumentName}" "${arg.dataType}"`;
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
  let message = "";
  //  it's not defined
  if (!existingFunction) {
    const newFunctionDeclaration = createCQLFunctionDeclaration(cqlFunction);
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
  let message = "";
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

export const editCQLFunction = (
  cql: string,
  oldFunction: CQLFunction,
  newFunction: string
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
    return funct.text === oldFunction.expression;
  });

  let status = "";
  let message = "";
  if (existingFunction) {
    cqlArr.splice(
      existingFunction.start.line - 1,
      existingFunction.stop.line - existingFunction.start.line + 1,
      newFunction
    );
    status = "success";
    message = `Function ${oldFunction.functionName} has been successfully updated in the CQL.`;
  } else {
    message = `Function ${oldFunction.functionName} has not been defined in CQL.`;
    status = "info";
  }
  return {
    cql: cqlArr.join("\n"),
    status: status,
    message: message,
  } as unknown as CqlApplyActionResult;
};

export default applyCQLFunction;
