import React from "react";
import * as _ from "lodash";
import { Box } from "@mui/material";
import TypeEditor from "./TypeEditor";
import ElementSection from "../../../../../../common/ElementSection";
import { transformArrays } from "./transformArrays";
import {
  stripResourcePath,
  removeLastPathSegment,
  getValueByPath,
  insertIndexIntoPath,
  getIndexFromPath,
  mapElementsByPath,
  getAllChildren,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import { useFormikContext } from "formik";
import ElementEditorActionCenter from "./elementEditorActionCenter/ElementEditorActionCenter";
// import RenderTypeEditors from "./RenderTypeEditors";

const Element = ({ element, label, resource, canEdit }) => {
  return (
    <Box>
      <TypeEditor
        type={element?.type?.[0].code}
        required={element?.min > 0}
        structureDefinition={element}
        canEdit={canEdit}
        label={label}
        resource={resource}
        parentStructureDefinition={null}
      />
    </Box>
  );
};

// apply button needs to only be put at the bottom of the form
const ElementEditorChildren = ({
  mappedSnapshotElements = null,
  rootDefinition = null, // are we at the root of the tree? if so render it as such
  selectedResource,
  currentDepth,
  resource,
  handleChange, // we don't want to use this anymore since it's going to be detached from state.
  canEdit,
  resourcePath,
  handleIndividualElementApplyButtonClick,
  deleteElement,
  passedLabel = null
}) => {
  currentDepth = currentDepth + 1;
  const childrenToRender = [];
  const currentPath = rootDefinition?.path;
  const allChildren = getAllChildren(selectedResource, currentPath);
  const childrenLeftOver = [];

  allChildren.forEach((child) => {
    if (child.path.split(".").length === currentDepth) {
      childrenToRender.push(child);
    } else {
      childrenLeftOver.push(child);
    }
  });
  let heading = "";
  if (childrenToRender?.length > 0) {
    const path = childrenToRender[0].path.split(".");
    heading = path[currentDepth - 2];
  }
  const newAllChildren = childrenToRender.filter(
    (child) => child.type?.[0]?.code === "BackboneElement"
  );
  const { values } = useFormikContext();
  let numberOfElements = 0;
  const multipleCardinality = rootDefinition?.max === "*";
  const type = rootDefinition?.type?.[0];
  const required = +rootDefinition.min > 0;
  const elemPath = stripResourcePath(resourcePath, rootDefinition.path);
  let elementValue = _.get(resource, elemPath);
  if (multipleCardinality) {
    const label = rootDefinition.id;
    numberOfElements = getValueByPath(values, label)?.length || 1;
  }
  console.log("rootDefinition", rootDefinition);
  // console.log("mappedSnapshotElements", mappedSnapshotElements);
  function getLastPathPart(path) {
    const parts = path.split('.');
    return parts[parts.length - 1];
  }
  if (currentDepth === 3) {
    // const updatedPath = 
    return (
      <div
        className="test-case-tab-heading"
        data-testid={`elements-${rootDefinition?.id.split(".")[1]}-sub-heading`}
      >
        <div
          className="heading-row"
          style={{ cursor: "default", border: "none", marginBottom: 24 }}
        >
          <h4 className="header">
            {_.startCase(rootDefinition?.id.split(".")[1])}
          </h4>
          <div style={{ position: "relative", top: "-7px" }}>
            <ElementEditorActionCenter
              numElements={
                Object.prototype.toString.call(elementValue) ===
                "[object Array]"
                  ? elementValue.length
                  : 1
              }
              rootDefinition={rootDefinition}
              handleDelete={deleteElement}
            />
          </div>
        </div>
        {/* only worked at root */}
        {multipleCardinality ? (
          Array.from({ length: numberOfElements }).map((_, i) => (
            <>
              {/*we hit the root, and if there's children we render under it*/}
              <TypeEditor
                key={i}
                type={type.code}
                resource={resource}
                required={required}
                structureDefinition={rootDefinition}
                parentStructureDefinition={null}
                canEdit={canEdit}
                // label={`${rootDefinition?.id}[${i}]`}
                label={passedLabel ? `${passedLabel}[${i}]` : `${rootDefinition?.id}[${i}]`}

                // label={}
              />
              {/* {console.log('newAllChildren', newAllChildren, passedLabel, rootDefinition)} */}
              
              {/* item = "ClaimResponse.addItem.detail" */}
              {/* needs to be ClaimResponse[0].addItem.detail[0] */}
              {/* {console.log(newAllChildren)} */}
              {/* here we need to manipulate the path coming in For rootDefinition.id = ClaimResponse.addItem.detail
              child -> ClaimResponse.addItem[index].detail[anotherIndex]  */}
              {/* full path and index would be -> ClaimResponse.addItem[index] + detail (last part) index[] */}
              {newAllChildren &&
                newAllChildren.map((item, index) => (
                  <ElementEditorChildren
                    selectedResource={selectedResource}
                    rootDefinition={item}
                    resourcePath={resourcePath}
                    currentDepth={currentDepth}
                    resource={resource}
                    handleChange={handleChange}
                    canEdit={canEdit}
                    handleIndividualElementApplyButtonClick={
                      handleIndividualElementApplyButtonClick
                    }
                    deleteElement
                    passedLabel={`${rootDefinition?.id}[${i}].${getLastPathPart(item.id)}[${index}]`}
                    // passedLabel={`${item?.id}[${i}]`}
                    // passedLabel={`${rootDefinition?.id}[${i}]${getLastPathPart(item.id)}[${index}]`}
                  />
                ))}
            </>
          ))
        ) : (
          <>
          {console.log('~~~', rootDefinition.id, passedLabel)}
            {/*no multiple cardinality, just render a root typeEditor*/}
            <TypeEditor
              type={type.code}
              resource={resource}
              required={required}
              structureDefinition={rootDefinition}
              parentStructureDefinition={null}
              canEdit={canEdit}
              label={passedLabel ? passedLabel : rootDefinition.id}
            />
          </>
        )}
      </div>
    );
  }

  // should we not be at the top root, we need to know weather the parent was a multiple cardinality element to append tot he label.
  else if (rootDefinition) {
    console.log('base case? ', rootDefinition, passedLabel)
    function mergePathWithLabel(passedLabel, label) {
      const passedLabelParts = passedLabel.split('.');
      const labelParts = label.split('.');
    
      // Replace the parts of label up to the same length as passedLabelParts
      const mergedParts = [...passedLabelParts, ...labelParts.slice(passedLabelParts.length)];
    
      return mergedParts.join('.');
    }
    let label = rootDefinition.id
    // if (passedLabel){
    //   // const resultLabel = appendSubPath(passedLabel, rootDefinition.id);
    //   // console.log(' label =', label, ' passedLabel = ', passedLabel, ' result=', mergePathWithLabel(passedLabel, rootDefinition.id));
    //   label = mergePathWithLabel(passedLabel, rootDefinition.id);
    //   console.log('appended label', label)
    // }
    return (
      <ElementSection
        title={_.startCase(heading)}
        startOpen={false}
        children={
          <Box
            style={{
              paddingLeft: "16px",
            }}
          >
              {multipleCardinality ? (
          Array.from({ length: numberOfElements }).map((_, i) => (
            <>
              <TypeEditor
                key={i}
                type={type.code}
                resource={resource}
                required={required}
                structureDefinition={rootDefinition}
                parentStructureDefinition={null}
                canEdit={canEdit}
                label={passedLabel ? passedLabel : label}
              />
              {newAllChildren &&
                newAllChildren.map((item, index) => (
                  <ElementEditorChildren
                    selectedResource={selectedResource}
                    rootDefinition={item}
                    resourcePath={resourcePath}
                    currentDepth={currentDepth}
                    resource={resource}
                    handleChange={handleChange}
                    canEdit={canEdit}
                    handleIndividualElementApplyButtonClick={
                      handleIndividualElementApplyButtonClick
                    }
                    deleteElement
                    passedLabel={`${label}[${i}]`}
                  />
                ))}
            </>
          ))
        ) : (
          <>
            <br></br>
            <TypeEditor
              type={type.code}
              resource={resource}
              required={required}
              structureDefinition={rootDefinition}
              parentStructureDefinition={null}
              canEdit={canEdit}
              label={passedLabel ? passedLabel : label}
            />
            <br></br>
          </>
        )}
          </Box>
        }
      />
    );
  }
  return null;
};

export default ElementEditorChildren;
