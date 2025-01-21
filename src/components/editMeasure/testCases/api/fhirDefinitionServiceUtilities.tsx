export function getBasePath(resource: any): string {
  return resource?.definition?.snapshot?.element?.[0]?.path;
}

export function getTopLevelElements(resource: any) {
  const elements = [...resource?.definition?.snapshot?.element];
  return elements?.filter(
    (e) => e.path.split(".")?.length === 2 && e.max !== "0"
  );
}

export function getRequiredElements(resource: any) {
  const elements = [...resource?.definition?.snapshot?.element];
  return elements?.filter((e) => e.min > 0 && e.path.split(".")?.length === 2);
}

export function stripResourcePath(resourcePath, elementPath) {
  return elementPath.substring(`${resourcePath}.`.length);
}

export function getAllChildren(resource, path) {
  const elements = [...resource?.definition?.snapshot?.element];
  return elements?.filter((e) => e.path !== path && e.path.includes(path));
}

export function updateChildrenPaths(structureDefinition, elements) {
  // these childType defs need to have their id and path manipulated to play nice.
  // Instead of Procedure.Annotation.text, it should be Procedure.note.text
  const currentPath = structureDefinition?.id;
  const updatedElements = elements.map((el) => {
    let targetPath = el.id.split(".");
    targetPath.shift();
    targetPath.unshift(currentPath);
    targetPath = targetPath.join(".");
    el.id = targetPath;
    el.path = targetPath;
    return el;
  });
  return updatedElements;
}

export function isComponentDataType(datatype) {
  switch (datatype) {
    case "boolean":
    case "date":
    case "dateTime":
    case "http://hl7.org/fhirpath/System.DateTime":
    case "decimal":
    case "id":
    case "instant":
    case "integer":
    case "integer64":
    case "positiveInt":
    case "time":
    case "unsignedInt":
    case "uri":
    case "url":
    case "uuid":
    case "canonical":
    case "string":
    case "markdown":
    case "http://hl7.org/fhirpath/System.String":
    case "code":
    case "Extension":
    case "Reference":
      return true;
    default:
      return false;
  }
}
