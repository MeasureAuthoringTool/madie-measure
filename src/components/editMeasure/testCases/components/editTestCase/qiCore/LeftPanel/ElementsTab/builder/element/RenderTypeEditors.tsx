import React from "react";
import * as _ from "lodash";
import ElementEditorChildren from "./ElementEditorChildren";
import TypeEditor from "./TypeEditor";
import { transformArrays } from "./transformArrays";
import {
  getValueByPath,
  stripResourcePath,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import { useFormikContext } from "formik";

const RenderTypeEditors = ({
  resource,
  rootDefinition,
  canEdit,
  childrenLeftOver,
  currentDepth,
  handleIndividualElementApplyButtonClick,
  handleChange,
  resourcePath,
}) => {
  const { values } = useFormikContext();
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

  if (multipleCardinality) {
    return (
      <>
        {Array.from({ length: numberOfElements }).map((_, i) => (
          <React.Fragment key={i}>
            start multi card root
            <TypeEditor
              type={type.code}
              resource={resource}
              required={required}
              structureDefinition={rootDefinition}
              parentStructureDefinition={null}
              canEdit={canEdit}
              label={`${rootDefinition?.id}[${i}]`}
            />
            {transformArrays(childrenLeftOver, currentDepth).length > 0 &&
              transformArrays(childrenLeftOver, currentDepth).map(
                (item, index) => (
                  <ElementEditorChildren
                    key={index}
                    rootDefinition={null}
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
                  />
                )
              )}
            end multi card root
          </React.Fragment>
        ))}
      </>
    );
  } else {
    return (
      <>
        <br />
        start single card root
        <TypeEditor
          type={type.code}
          resource={resource}
          required={required}
          structureDefinition={rootDefinition}
          parentStructureDefinition={null}
          canEdit={canEdit}
          label={rootDefinition?.id}
        />
        End of a single card root
        <br />
      </>
    );
  }
};

export default RenderTypeEditors;
