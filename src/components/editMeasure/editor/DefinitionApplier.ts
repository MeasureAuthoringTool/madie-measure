import { Definition } from "@madie/madie-editor";

export const applyDefinition = (
  defValues: Definition,
  editorVal: string
): string => {
  const formattedExpressionValue = defValues.expressionValue
    .toString()
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
  const formattedComment = `/*\n${defValues.comment.toString()}\n*/`;
  const formattedDefinitionStructure = `define "${defValues.definitionName}":\n${formattedExpressionValue}`;
  return (
    editorVal +
    "\n" +
    (defValues.comment
      ? `${formattedComment}\n${formattedDefinitionStructure}`
      : formattedDefinitionStructure) +
    "\n"
  );
};
