import React from "react";
import * as _ from "lodash";
import TypeEditor from "./TypeEditor";
import {
  stripResourcePath,
  getElementName,
  getNestedProperty,
  stripAllIndexes,
  addCardinalityToElement,
  formatChoiceType,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import ElementEditorActionCenter from "./elementEditorActionCenter/ElementEditorActionCenter";
import {
  ResourceActionType,
  useQiCoreResource,
} from "../../../../../../../util/QiCorePatientProvider";
import Box from "@mui/material/Box";
import { useFormikContext } from "formik";
import "../../../../../../common/UIOnlyModelAgnostic/ElementSection.scss";

const ElementEditorChildren = ({
  setLastAddedElemPath,
  selectedResourceID,
  parentStructureDefinition, // Patient, or ClaimResponse
  rootDefinition, // Patient.name or something not top level
  currentDepth,
  resource,
  canEdit,
  resourcePath,
  deleteElement,
}) => {
  currentDepth = currentDepth + 1;
  const elemPath = stripResourcePath(resourcePath, rootDefinition.path);
  const { values } = useFormikContext();
  let elementValue = _.get(resource, elemPath);
  const { dispatch, state } = useQiCoreResource();
  const addElementOfMultipleCardinality = () => {
    const nextEntry = _.cloneDeep(
      state.bundle?.entry?.find(
        (entry) => entry.resource.id === selectedResourceID
      )
    );
    const updatedEntry = addCardinalityToElement(nextEntry, elemPath);
    dispatch({
      type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
      payload: updatedEntry,
    });
    setLastAddedElemPath(rootDefinition.path);
  };
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
          {`${getElementName(
            rootDefinition,
            resourcePath,
            getNestedProperty(values, stripAllIndexes(rootDefinition.id))
          )}`}
        </h4>
        {canEdit && (
          <div style={{ position: "relative", top: "-7px" }}>
            <ElementEditorActionCenter
              numElements={
                Object.prototype.toString.call(elementValue) ===
                "[object Array]"
                  ? elementValue.length
                  : 1
              }
              elementName={`${getElementName(
                rootDefinition,
                resourcePath,
                getNestedProperty(values, stripAllIndexes(rootDefinition.id))
              )}`}
              elementValue={elementValue}
              addElementOfMultipleCardinality={addElementOfMultipleCardinality}
              rootDefinition={rootDefinition}
              handleDelete={deleteElement}
            />
          </div>
        )}
      </div>
      <Box sx={{ rowGap: 0 }}>
        <TypeEditor
          resource={resource}
          structureDefinition={rootDefinition}
          parentStructureDefinition={parentStructureDefinition}
          canEdit={canEdit}
          label={formatChoiceType(rootDefinition)}
        />
      </Box>
    </div>
  );
};

export default ElementEditorChildren;
