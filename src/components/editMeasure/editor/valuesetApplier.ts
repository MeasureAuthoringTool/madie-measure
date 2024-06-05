import { CqlAntlr, CqlResult } from "@madie/cql-antlr-parser/dist/src";
import { CodeChangeResult } from "./codeApplier";
import { ValueSetForSearch } from "@madie/madie-editor";

// given correct vs line order and the cqlArr, splice in the declarations
const sortCQLValuesetsInPlace = (
  sortedValueSets: any[],
  cqlArr: string[]
): void => {
  for (const tvs of sortedValueSets) {
    cqlArr.splice(tvs.start.line - 1, 1, tvs.text);
  }
};

// create a helper array of valuesets, declared in the expected line order
const createTransformedValuesets = (parseResults: CqlResult): any[] => {
  const lines = parseResults.valueSets
    .map((vs) => vs.start.line)
    .sort((a, b) => a - b);
  // sort the valuesets alphabetically
  const sortedValuesets = parseResults.valueSets.sort((a, b) => {
    const nameA = a.name.replace(/["']/g, "").toLowerCase();
    const nameB = b.name.replace(/["']/g, "").toLowerCase();
    return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
  });
  //  update the lines
  const sortedValuesetsWithCorrectLineNumbers = [];
  for (let i = 0; i < sortedValuesets.length; i++) {
    const vs = sortedValuesets[i];
    const lineDifference = vs.stop.line - vs.start.line;
    vs.start.line = lines[i];
    vs.stop.line = lines[i] + lineDifference;
    sortedValuesetsWithCorrectLineNumbers.push(vs);
  }
  return sortedValuesetsWithCorrectLineNumbers;
};

const findInsertionIndexInSortedVsList = (vsArr: any[], newName): number => {
  let left = 0;
  let right = vsArr.length - 1;
  const lowerCaseNewName = newName.toLowerCase();
  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const comparison = vsArr[middle].name
      .replace(/["']/g, "")
      .toLowerCase()
      .localeCompare(lowerCaseNewName);
    if (comparison < 0) {
      left = middle + 1;
    } else if (comparison > 0) {
      right = middle - 1;
    } else {
      return middle;
    }
  }

  return left;
};

const findInsertPointWhenNoValuesets = (parseResults: CqlResult): number => {
  const codesystems: number = parseResults?.codeSystems.length;
  const includes: number = parseResults?.includes.length;
  const usings: number = parseResults?.using?.start?.line;
  if (codesystems > 0) {
    return parseResults.codeSystems[parseResults.codeSystems.length - 1].stop
      .line;
  } else if (includes > 0) {
    return (
      parseResults.includes[parseResults.includes.length - 1].stop.line + 1
    );
  } else if (usings > 0) {
    return parseResults.using.start.line + 1;
  } else {
    return 2;
  }
};

const applyValueset = (
  cql: string,
  vs: ValueSetForSearch
): CodeChangeResult => {
  const cqlArr: string[] = cql.split("\n");
  const parseResults: CqlResult = new CqlAntlr(cql).parse();
  let valuesetChangeStatus: boolean = false;
  let message: string = "The requested operation was unsuccessful";
  let vsExists: boolean = false;

  // are there valuesets at all?
  if (parseResults?.valueSets?.length > 0) {
    parseResults.valueSets.forEach((valueSet) => {
      const oldVsName = valueSet.name.replace(/["']/g, "");
      const oldUrl = valueSet.url.replace(/["']/g, "");
      vsExists = vsExists || (oldVsName === vs.title && oldUrl === vs.oid);
    });
  }
  // no matching valueset in the cql, add it.
  if (!vsExists) {
    const { title, oid } = vs;
    const valueSetStatement = `valueset "${title}": '${oid}'`;
    valuesetChangeStatus = true;
    message = `Value Set ${title} has been successfully added to the CQL.`;
    // no vs, no vs array
    if (!parseResults.valueSets.length) {
      const insertionIndex = findInsertPointWhenNoValuesets(parseResults);
      cqlArr.splice(insertionIndex, 0, valueSetStatement);
      // no vs, but vs array to sort and work on
    } else {
      const sortedValueSets = createTransformedValuesets(parseResults);
      sortCQLValuesetsInPlace(sortedValueSets, cqlArr);
      const insertionIndex = findInsertionIndexInSortedVsList(
        sortedValueSets,
        vs.title
      );
      cqlArr.splice(
        sortedValueSets[insertionIndex].stop.line - 1,
        0,
        valueSetStatement
      );
    }
  } else {
    message = "This valueset is already defined in the CQL.";
  }
  return {
    cql: cqlArr.join("\n"),
    status: valuesetChangeStatus,
    message: message,
  } as unknown as CodeChangeResult;
};
export default applyValueset;
