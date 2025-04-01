import React from "react";
import * as _ from "lodash";
import { Box } from "@mui/material";
import TypeEditor from "./TypeEditor";
import ElementSection from "../../../../../../common/ElementSection";
import { transformArrays } from "./transformArrays";
import { stripResourcePath } from "../../../../../../../api/fhirDefinitionServiceUtilities";
import { useFormikContext } from "formik";
import ElementEditorActionCenter from "./ElementEditorActionCenter";

const Element = ({ element, label, resource, handleChange, canEdit }) => {
  let elementValue = _.get(resource, label);
  return (
    <Box>
      <TypeEditor
        type={element?.type?.[0].code}
        required={element?.min > 0}
        value={elementValue}
        onChange={(e) => {
          elementValue = e;
          handleChange(element.path, e);
        }}
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
  rootDefinition = null, // are we at the root of the tree? if so render it as such
  allChildren,
  currentDepth,
  resource,
  handleChange,
  canEdit,
  fhirDefinitionsService,
  resourcePath,
  handleIndividualElementApplyButtonClick,
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
  const formikContext = useFormikContext();
  // if we're at the top level we want to at minimum make sure we render our current level as opposed to all the sub levels.
  if (rootDefinition) {
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
            />
          </div>
        </div>
        {/* given root definition we do a base level render */}
        <TypeEditor
          type={type.code}
          resource={resource}
          required={required}
          value={elementValue}
          onChange={(e) => {
            elementValue = e;
            handleChange(elemPath, e);
          }}
          structureDefinition={rootDefinition}
          parentStructureDefinition={null}
          canEdit={canEdit}
          label={rootDefinition?.id}
        />
        {childrenToRender.map((child) => (
          <Element
            element={child}
            label={child?.id}
            resource={resource}
            handleChange={handleChange}
            canEdit={canEdit}
          />
        ))}
        {/* item.detail vs item.adjudication are 2 separate trees, we need to split them into separate children trees.  
          how do we do that?
          We group them based on a normalizedPrefix.
        */}

        {transformArrays(childrenLeftOver, currentDepth).length > 0 &&
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
            />
          ))}
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
            {childrenToRender.map((child) => (
              <Element
                element={child}
                label={child?.id}
                resource={resource}
                handleChange={handleChange}
                canEdit={canEdit}
              />
            ))}
            {transformArrays(childrenLeftOver, currentDepth).length > 0 &&
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
                  />
                )
              )}
          </Box>
        }
      />
    );
  }
  return null;
};

export default ElementEditorChildren;
