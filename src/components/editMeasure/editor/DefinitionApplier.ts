import { CqlAntlr } from "@madie/cql-antlr-parser/dist/src";
import { Definition } from "@madie/madie-editor";

export const applyDefinition = (
  defValues: Definition,
  editorVal: string
): string => {
  const formattedComment = `/*\n${defValues.comment.toString()}\n*/`;
  const formattedDefinitionStructure = formatDefinitionStructure(defValues);
  return (
    editorVal +
    "\n" +
    (defValues.comment
      ? `${formattedComment}\n${formattedDefinitionStructure}`
      : formattedDefinitionStructure) +
    "\n"
  );
};

export const editDefinition = (
  selectedDefinition: any,
  defValues: Definition,
  editorVal: string,
  measureStoreCql: string
) => {
  const cqlComponents = new CqlAntlr(editorVal).parse();
  let cqlLineArr: string[] = measureStoreCql?.split("\n");
  cqlComponents.expressionDefinitions.forEach((definition) => {
    const definitionName = definition.name.replace(/['"]+/g, "");
    if (definitionName === selectedDefinition?.definitionName) {
      const formattedComment = `/*\n${defValues.comment.toString()}\n*/`;
      const formattedDefinitionStructure = formatDefinitionStructure(
        defValues,
        "edit"
      );
      cqlLineArr.splice(
        definition.start.line - 1,
        definition.stop.line - definition.start.line + 1,
        defValues.comment
          ? `${formattedComment}\n${formattedDefinitionStructure}`
          : formattedDefinitionStructure
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
  const formattedExpressionValue = defValues.expressionValue
    .toString()
    .split("\n")
    .map((line) => (operation === "edit" ? `${line}` : `  ${line}`))
    .join("\n");
  return `define "${defValues.definitionName}":\n${formattedExpressionValue}`;
};
