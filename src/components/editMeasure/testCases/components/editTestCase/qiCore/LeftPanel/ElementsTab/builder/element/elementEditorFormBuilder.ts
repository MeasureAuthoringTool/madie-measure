
import * as _ from "lodash";

const buildNode = (child, resourcePath, fhirDefinitionsService, resource, childrenToRender) => {
    // given a child, 
    const type = child?.type?.[0];
    const required = +child.min > 0;
    const elemPath = fhirDefinitionsService.current.stripResourcePath(
      resourcePath,
      child.path
    );
    let value = _.get(resource, elemPath);
    return {
        id: child?.id,
        value,
        type,
        required,
        children: childrenToRender
    }
}


// we can probably attach validations here
export const elementEditorFormBuilder = (rootDefinition, allChildren, currentDepth, fhirDefinitionsService, resourcePath, resource) => {
// We will assume that we're at the rootDefinition
    console.log('test')
currentDepth = currentDepth + 1;
  const childrenToRender = [];
  const childrenLeftOver = [];

  allChildren.forEach((child) => {
    if (child.path.split(".").length === currentDepth) {
      childrenToRender.push(child);
    } else {
      childrenLeftOver.push(child);
    }
  });
  console.log('~~~~left', childrenLeftOver)//
  // if we're at the top level we want to at minimum make sure we render our current level as opposed to all the sub levels.

  // should always be root
//   if (rootDefinition) {
    // const type = rootDefinition?.type?.[0];
    // const required = +rootDefinition.min > 0;
    // const elemPath = fhirDefinitionsService.current.stripResourcePath(
    //   resourcePath,
    //   rootDefinition.path
    // );
    // let value = _.get(resource, elemPath);
    const node = buildNode(rootDefinition, resourcePath, fhirDefinitionsService, resource, childrenToRender)
    // start with the node, going to pass it back in
    // const node = {
    //     id: rootDefinition?.id,
    //     value,
    //     type,
    //     required,
    //     children: []
    // }
    
//   }    




    // we may already have a root definition
    // const results = [];



    // ultimately return a nested tree
    return node;
}