import { CqlAntlr } from "@madie/cql-antlr-parser/dist/src";
import { Definition } from "@madie/madie-editor";

export const applyDefinition = (
  defValues: Definition,
  editorVal: string
): string => {
  return editorVal + "\n" + formatDefinitionStructure(defValues) + "\n";
};

export const editDefinition = (
  selectedDefinition: any,
  defValues: Definition,
  editorVal: string
) => {
  const cqlComponents = new CqlAntlr(editorVal).parse();
  let cqlLineArr: string[] = editorVal?.split("\n");
  cqlComponents.expressionDefinitions.forEach((definition) => {
    const definitionName = definition.name.replace(/['"]+/g, "");
    if (definitionName === selectedDefinition?.definitionName) {
      cqlLineArr.splice(
        definition.start.line - 1,
        definition.stop.line - definition.start.line + 1,
        formatDefinitionStructure(defValues, "edit")
      );
      return cqlLineArr.join("\n");
    }
  });
  return cqlLineArr.join("\n");
};

const formatDefinitionStructure = (
  defValues: Definition,
  operation?: string
) => {
  const formattedComment = `/*\n${defValues.comment.toString()}\n*/`;
  const formattedExpressionValue = defValues.expressionValue
    .toString()
    .split("\n")
    .map((line) => (operation === "edit" ? `${line}` : `  ${line}`))
    .join("\n");
  const formattedDefinitionStructure = `define "${defValues.definitionName}":\n${formattedExpressionValue}`;
  return defValues.comment
    ? `${formattedComment}\n${formattedDefinitionStructure}`
    : formattedDefinitionStructure;
};
