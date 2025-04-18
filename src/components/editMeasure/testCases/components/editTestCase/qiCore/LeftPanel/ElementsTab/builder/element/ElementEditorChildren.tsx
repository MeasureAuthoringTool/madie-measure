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
  getIndexFromPath
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import { useFormikContext } from "formik";
import ElementEditorActionCenter from "./elementEditorActionCenter/ElementEditorActionCenter";

// multiple cardinality check
const Element = ({
  mappedSnapshotElements,
  element,
  label,
  resource,
  canEdit,
}) => {
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
  mappedSnapshotElements,
  rootDefinition = null, // are we at the root of the tree? if so render it as such
  allChildren,
  currentDepth,
  resource,
  handleChange,
  canEdit,
  fhirDefinitionsService,
  resourcePath,
  handleIndividualElementApplyButtonClick,
  deleteElement,
}) => {
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
  let heading = "";
  if (childrenToRender?.length > 0) {
    const path = childrenToRender[0].path.split(".");
    heading = path[currentDepth - 2];
  }
  const { values } = useFormikContext();
  
  // if we're at the top level we want to at minimum make sure we render our current level as opposed to all the sub levels.
  if (rootDefinition) {
    const label = rootDefinition.id;
    let numberOfElements = 0;
    const multipleCardinality = rootDefinition?.max === "*";
    if (multipleCardinality) {
      numberOfElements = getValueByPath(values, label)?.length || 1;
    }
    const type = rootDefinition?.type?.[0];
    const required = +rootDefinition.min > 0;
    const elemPath = stripResourcePath(resourcePath, rootDefinition.path);
    let elementValue = _.get(resource, elemPath);

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
        {/* given root definition we do a base level render */}
        {/* I think we only want this to render if there is no multiple cardinality && there are no elements that are children in the form */}
        {/* {
          !multipleCardinality ? (
            // Render a base TypeEditor IF formik does not have a collection of values at the current property, that we can check against the element.id
          // !getValueByPath(values, rootDefinition.id)?.length ? (
            <TypeEditor
              type={type.code}
              resource={resource}
              required={required}
              structureDefinition={rootDefinition}
              parentStructureDefinition={null}
              canEdit={canEdit}
              label={rootDefinition?.id}
            />
          ) : (
            (() => {
              console.log('we get here')
              return Array.from({ length: numberOfElements }).map((_, i) => (
                <TypeEditor
                  key={i}
                  type={type.code}
                  resource={resource}
                  required={required}
                  structureDefinition={rootDefinition}
                  parentStructureDefinition={null}
                  canEdit={canEdit}
                  label={`${rootDefinition?.id}[${i}]`}
                />
              ))
            })()
          )
        } */}
        {
          multipleCardinality ? (
            Array.from({ length: numberOfElements }).map((_, i) => (
              <TypeEditor
                key={i}
                type={type.code}
                resource={resource}
                required={required}
                structureDefinition={rootDefinition}
                parentStructureDefinition={null}
                canEdit={canEdit}
                label={`${rootDefinition?.id}[${i}]`}
              />
            ))
          ) :(
            <TypeEditor
              type={type.code}
              resource={resource}
              required={required}
              structureDefinition={rootDefinition}
              parentStructureDefinition={null}
              canEdit={canEdit}
              label={rootDefinition?.id}
            />
          )
        }


        {/* childrenToRender in one case will be a collection of nodes that are the the next sequential path
        given something like Patient.identifier as the rootDefinition, These would be Patient.identifier.id, Patient.identifier.value, Patient.identifier.system, etc
        Therefore with multiple cardinality, we want to render each list of children once for every Patient.identifier element that exists in formik.values
        */}

        
        {/* we want to a second map here in instances where we have multiple elements. */}
        {/* {childrenToRender.map((child) => {
          const label = child.id;
          let numberOfElements = 1;
          const pathBefore = removeLastPathSegment(label);
          const elBefore = mappedSnapshotElements[pathBefore];
          const multipleCardinality = elBefore?.max === "*";
          if (multipleCardinality) {
            numberOfElements = getValueByPath(values, pathBefore)?.length || 1;
          }
          return (
            <>
              {Array.from({ length: numberOfElements }).map((_, index) => {
                const pathBefore = removeLastPathSegment(label);
                const labelWithIndex = insertIndexIntoPath(label, pathBefore, index);
                console.log("labelWithIndex", labelWithIndex);
                return (
                  <Element
                    element={child}
                    label={labelWithIndex}
                    resource={resource}
                    canEdit={canEdit}
                    mappedSnapshotElements={mappedSnapshotElements}
                  />
                );
              })}
            </>
          );
        })} */}
        {/* item.detail vs item.adjudication are 2 separate trees, we need to split them into separate children trees.
          how do we do that?
          We group them based on a normalizedPrefix.
        */}

        {/* {transformArrays(childrenLeftOver, currentDepth).length > 0 &&
          transformArrays(childrenLeftOver, currentDepth).map((item, index) => (
            <ElementEditorChildren
              rootDefinition={null}
              fhirDefinitionsService={fhirDefinitionsService}
              resourcePath={resourcePath}
              allChildren={item}
              currentDepth={currentDepth}
              resource={resource}
              handleChange={handleChange}
              canEdit={canEdit}
              handleIndividualElementApplyButtonClick={
                handleIndividualElementApplyButtonClick
              }
              deleteElement
              mappedSnapshotElements={mappedSnapshotElements}
            />
          ))} */}
      </div>
    );
  }
  // should we not be at the top root
  else if (childrenToRender.length > 0) {
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
            {/* We want to add a label for path similarity. here it would be ClaimResponse.item */}
            {/* {childrenToRender.map((child) => (
              <Element
                mappedSnapshotElements={mappedSnapshotElements}
                element={child}
                label={child?.id}
                resource={resource}
                canEdit={canEdit}
                />
            ))} */}
            {/* {transformArrays(childrenLeftOver, currentDepth).length > 0 &&
              transformArrays(childrenLeftOver, currentDepth).map(
                (item, index) => (
                  <ElementEditorChildren
                    rootDefinition={null}
                    fhirDefinitionsService={fhirDefinitionsService}
                    resourcePath={resourcePath}
                    allChildren={item}
                    currentDepth={currentDepth}
                    resource={resource}
                    handleChange={handleChange}
                    canEdit={canEdit}
                    handleIndividualElementApplyButtonClick={
                      handleIndividualElementApplyButtonClick
                    }
                    deleteElement
                    mappedSnapshotElements={mappedSnapshotElements}

                    />
                )
              )} */}
          </Box>
        }
      />
    );
  }
  return null;
};

export default ElementEditorChildren;
