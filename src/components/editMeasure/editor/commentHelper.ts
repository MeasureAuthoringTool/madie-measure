import { CqlAntlr, CqlResult } from "@madie/cql-antlr-parser/dist/src";

// lets find all the cqlStrings that are associated with functions
export const getCqlStrings = (cql) => {
  console.log("cql test is", cql);
  const cqlArr: string[] = cql.split("\n");
  console.log("cqlArr", cqlArr);
  const parseResults: CqlResult = new CqlAntlr(cql).parse();
  console.log("parseResults are", parseResults);
};
