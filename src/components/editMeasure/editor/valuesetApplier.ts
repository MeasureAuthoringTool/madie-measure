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

const extractValueSetNameAndSuffix = (valueSetName) => {
  const match = valueSetName.replace(/["']/g, "").match(/^(.*)\((\d+)\)\s*$/);

  if (match) {
    return {
      baseValueSetName: match[1].trim(),
      suffix: match[2] ? parseInt(match[2], 10) : -1, // Treat no number as -1
    };
  } else {
    // No number found, treat as -1
    return {
      baseValueSetName: valueSetName.replace(/["']/g, "").trim(),
      suffix: -1,
    };
  }
};

// create a helper array of valuesets, declared in the expected line order
const createTransformedValuesets = (valueSets) => {
  const lines = valueSets.map((vs) => vs.start.line).sort((a, b) => a - b);
  const sortedValuesets = valueSets.sort((a, b) => {
    const valueSetNameA = a.name.replace(/["']/g, "").toLowerCase(); // Convert to lower case for case-insensitive sorting
    const valueSetNameB = b.name.replace(/["']/g, "").toLowerCase(); // Convert to lower case for case-insensitive sorting

    // Function to extract base name and numeric part
    const { baseValueSetName: baseValueSetNameA, suffix: suffixA } =
      extractValueSetNameAndSuffix(valueSetNameA);
    const { baseValueSetName: baseValueSetNameB, suffix: suffixB } =
      extractValueSetNameAndSuffix(valueSetNameB);

    // Compare base names first
    if (baseValueSetNameA < baseValueSetNameB) return -1;
    if (baseValueSetNameA > baseValueSetNameB) return 1;

    // If base names are the same, compare numeric parts
    return suffixA - suffixB;
  });

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

function findInsertionIndexInSortedVsList(valueSets, newValueSet) {
  // Find the insertion index based on the valueset name and suffix part
  const { baseValueSetName: newValueSetBaseName, suffix: newValueSetSuffix } =
    extractValueSetNameAndSuffix(newValueSet.toLowerCase());

  let insertionIndex = 0;
  for (let i = 0; i < valueSets.length; i++) {
    const currentValueSetName = valueSets[i].name
      .replace(/["']/g, "")
      .toLowerCase(); // Convert to lower case for case-insensitive comparison
    const {
      baseValueSetName: currentValueSetBaseName,
      suffix: currentValueSetSuffix,
    } = extractValueSetNameAndSuffix(currentValueSetName);
    // Compare base names first
    if (newValueSetBaseName < currentValueSetBaseName) {
      insertionIndex = i;
      break;
    } else if (newValueSetBaseName === currentValueSetBaseName) {
      // If base names are the same, compare numeric parts
      if (newValueSetSuffix < currentValueSetSuffix) {
        insertionIndex = i;
        break;
      } else {
        insertionIndex = i + 1;
      }
    } else {
      insertionIndex = i + 1;
    }
  }

  return insertionIndex;
}

function findReplacementIndexInSortedVsList(valueSets, newValueSet) {
  // Find the replacement index based on the valueset name and suffix part
  const { baseValueSetName: newValueSetBaseName, suffix: newValueSetSuffix } =
    extractValueSetNameAndSuffix(newValueSet.toLowerCase());

  let replacementIndex = 0;
  for (let i = 0; i < valueSets.length; i++) {
    const currentValueSetName = valueSets[i].name
      .replace(/["']/g, "")
      .toLowerCase(); // Convert to lower case for case-insensitive comparison
    const { baseValueSetName: currentValueSetBaseName } =
      extractValueSetNameAndSuffix(currentValueSetName);
    // Only compairing names as suffix can be added and removed
    if (newValueSetBaseName < currentValueSetBaseName) {
      replacementIndex = i;
      break;
    } else {
      replacementIndex = i + 1;
    }
  }

  return replacementIndex;
}

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

const getValueSetTitleName = (vs) => {
  if (vs?.suffix) {
    return `${vs.title} (${vs.suffix})`;
  }
  return vs.title;
};

const applyValueset = (
  cql: string,
  vs: ValueSetForSearch,
  previousVs?: ValueSetForSearch
): CodeChangeResult => {
  const cqlArr: string[] = cql.split("\n");
  const parseResults: CqlResult = new CqlAntlr(cql).parse();
  let valuesetChangeStatus: "success" | "info" | "danger" = "danger";
  let message: string = "The requested operation was unsuccessful";
  let vsExactExists: boolean = false;
  let vsSameTitleExist: boolean = false;

  // are there valuesets at all?
  if (parseResults?.valueSets?.length > 0) {
    parseResults.valueSets.forEach((valueSet) => {
      const oldVsName = valueSet.name.replace(/["']/g, "");
      const oldUrl = valueSet.url.replace(/["']/g, "");
      vsExactExists =
        vsExactExists ||
        (oldVsName === getValueSetTitleName(vs) && oldUrl === vs.oid);
      vsSameTitleExist =
        vsSameTitleExist ||
        (oldVsName &&
          extractValueSetNameAndSuffix(oldVsName)
            .baseValueSetName.toLowerCase()
            .replace(/\s/g, "") === vs.name.toLowerCase() &&
          oldUrl === vs.oid) ||
        vs?.oid === previousVs?.oid;
    });
  }

  // no matching valueset in the cql, add it.
  if (!vsExactExists && !vsSameTitleExist) {
    const valueSetStatement = `valueset "${getValueSetTitleName(vs)}": '${
      vs.oid
    }'`;
    valuesetChangeStatus = "success";
    message = `Value Set ${getValueSetTitleName(
      vs
    )} has been successfully added to the CQL.`;
    // no vs, no vs array
    if (!parseResults.valueSets.length) {
      const insertionIndex = findInsertPointWhenNoValuesets(parseResults);
      cqlArr.splice(insertionIndex, 0, valueSetStatement);
      // no vs, but vs array to sort and work on
    } else {
      const sortedValueSets = createTransformedValuesets(
        parseResults?.valueSets
      );
      sortCQLValuesetsInPlace(sortedValueSets, cqlArr);
      const insertionIndex = findInsertionIndexInSortedVsList(
        sortedValueSets,
        getValueSetTitleName(vs)
      );

      if (insertionIndex > sortedValueSets.length - 1) {
        cqlArr.splice(
          sortedValueSets[insertionIndex - 1].stop.line,
          0,
          valueSetStatement
        );
      } else {
        cqlArr.splice(
          sortedValueSets[insertionIndex].stop.line - 1,
          0,
          valueSetStatement
        );
      }
    }
  } else if (vsSameTitleExist && !vsExactExists) {
    const valueSetStatement = `valueset "${getValueSetTitleName(vs)}": '${
      vs.oid
    }'`;
    valuesetChangeStatus = "success";
    message = `Value Set ${getValueSetTitleName(
      vs
    )} has been successfully updated in the CQL.`;

    const sortedValueSets = createTransformedValuesets(parseResults?.valueSets);
    sortCQLValuesetsInPlace(sortedValueSets, cqlArr);
    const replacementIndex = findReplacementIndexInSortedVsList(
      sortedValueSets,
      getValueSetTitleName(vs)
    );

    cqlArr.splice(
      sortedValueSets[replacementIndex - 1].stop.line - 1,
      1,
      valueSetStatement
    );
  } else {
    message = "This valueset is already defined in the CQL.";
    valuesetChangeStatus = "info";
  }
  return {
    cql: cqlArr.join("\n"),
    status: valuesetChangeStatus,
    message: message,
  } as unknown as CodeChangeResult;
};
export default applyValueset;
