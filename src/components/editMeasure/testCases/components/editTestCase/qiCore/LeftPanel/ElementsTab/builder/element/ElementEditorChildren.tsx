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


const ElementEditorChildren = ({
  rootDefinition = null, // are we at the root of the tree? if so render it as such
  currentDepth,
  resource,
  canEdit,
  resourcePath,
  deleteElement,
}) => {
  currentDepth = currentDepth + 1;
  const { values } = useFormikContext();
  let numberOfElements = 1;
  const multipleCardinality = rootDefinition?.max === "*";
  const type = rootDefinition?.type?.[0];
  // const type= rootDefinition?.type
  // console.log('type is',type)
  const elemPath = stripResourcePath(resourcePath, rootDefinition.path);
  let elementValue = _.get(resource, elemPath);

  // console.log('resourcePath', resourcePath, rootDefinition.path, elemPath)
  if (multipleCardinality) {
    const label = rootDefinition.id;
    numberOfElements = getValueByPath(values, label)?.length || 1;
  }
  // console.log('structureDefinition', rootDefinition)
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
              Object.prototype.toString.call(elementValue) === "[object Array]"
                ? elementValue.length
                : 1
            }
            rootDefinition={rootDefinition}
            handleDelete={deleteElement}
          />
        </div>
      </div>
      {multipleCardinality ? (
        Array.from({ length: Number(numberOfElements) }).map((_, ii) => {
          return (
            <div key={`${rootDefinition.id}[${ii}]`}>
              <h4>{`${rootDefinition.id}[${ii}]`}</h4>
            <TypeEditor
              key={`${rootDefinition.id}[${ii}]`}              
              type={type}
              resource={resource}
              structureDefinition={rootDefinition}
              parentStructureDefinition={null}
              canEdit={canEdit}
              label={`${rootDefinition?.id}[${ii}]`}
            />
            </div>
          );
        })
      ) : (
        <TypeEditor
          type={type}
          resource={resource}
          structureDefinition={rootDefinition}
          parentStructureDefinition={null}
          canEdit={canEdit}
          label={rootDefinition?.id}
        />
      )}
    </div>
  );
  return null;
};

export default ElementEditorChildren;
