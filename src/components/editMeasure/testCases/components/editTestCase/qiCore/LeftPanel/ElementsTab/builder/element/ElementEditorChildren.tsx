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
  getIndexFromPathWithoutBrackets,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import ElementEditorActionCenter from "./elementEditorActionCenter/ElementEditorActionCenter";
import {
  ResourceActionType,
  useQiCoreResource,
} from "../../../../../../../util/QiCorePatientProvider";
import Box from "@mui/material/Box";
import { useFormikContext } from "formik";
import "../../../../../../common/UIOnlyModelAgnostic/ElementSection.scss";
import {
  ExpandCollapseProvider,
  useExpandCollapse,
} from "./ExpandCollapseContext";

const ElementEditorChildrenInner = ({
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
  const expandCollapseCtx = useExpandCollapse();
  const hasSubAttributes = (expandCollapseCtx?.sectionCount ?? 0) > 0;
  currentDepth = currentDepth + 1;
  const elemPath = stripResourcePath(resourcePath, rootDefinition.path);
  const { values } = useFormikContext();
  let elementValue = _.get(resource, elemPath);
  const { dispatch, state } = useQiCoreResource();
  const typeEditorLabel =
    rootDefinition?.id?.endsWith("[x]") || rootDefinition?.path?.endsWith("[x]")
      ? rootDefinition.id
      : formatChoiceType(rootDefinition);
  const addElementOfMultipleCardinality = () => {
    const nextEntry = _.cloneDeep(
      state.bundle?.entry?.find(
        (entry) => entry.resource.id === selectedResourceID
      )
    );
    const updatedEntry = addCardinalityToElement(
      nextEntry,
      elemPath,
      rootDefinition
    );
    dispatch({
      type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
      payload: updatedEntry,
    });
    setLastAddedElemPath(rootDefinition.path);
  };
  const cloneElementOfMultipleCardinality = () => {
    const nextEntry = _.cloneDeep(
      state.bundle?.entry?.find(
        (entry) => entry.resource.id === selectedResourceID
      )
    );
    const index = getIndexFromPathWithoutBrackets(rootDefinition.id);
    const currentValue = nextEntry.resource[elemPath];
    if (Array.isArray(currentValue) && index !== null) {
      const elementToClone = _.cloneDeep(currentValue[Number(index)]);
      nextEntry.resource[elemPath] = [...currentValue, elementToClone];
    } else if (currentValue !== undefined) {
      const elementToClone = _.cloneDeep(currentValue);
      nextEntry.resource[elemPath] = [currentValue, elementToClone];
    }
    dispatch({
      type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
      payload: nextEntry,
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
        style={{
          cursor: "default",
          border: "none",
          marginBottom: hasSubAttributes ? 8 : 24,
        }}
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
              cloneElementOfMultipleCardinality={
                cloneElementOfMultipleCardinality
              }
              rootDefinition={rootDefinition}
              handleDelete={deleteElement}
            />
          </div>
        )}
      </div>
      {hasSubAttributes && (
        <div
          style={{ display: "flex", gap: "16px", marginBottom: "16px" }}
          data-testid="expand-collapse-buttons"
        >
          <button
            type="button"
            data-testid="expand-all-button"
            onClick={() => expandCollapseCtx?.expandAll()}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "#3171C2",
              cursor: "pointer",
              fontSize: "14px",
              fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
            }}
          >
            Expand All
          </button>
          |
          <button
            type="button"
            data-testid="collapse-all-button"
            onClick={() => expandCollapseCtx?.collapseAll()}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "#3171C2",
              cursor: "pointer",
              fontSize: "14px",
              fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
            }}
          >
            Collapse All
          </button>
          |
          <button
            type="button"
            data-testid="expand-populated-fields-button"
            onClick={() => expandCollapseCtx?.expandPopulated()}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "#3171C2",
              cursor: "pointer",
              fontSize: "14px",
              fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
            }}
          >
            Expand Populated Fields
          </button>
        </div>
      )}
      <Box sx={{ rowGap: 0 }}>
        <TypeEditor
          key={typeEditorLabel} //React uses the key to determine whether a component instance should be reused or recreated when re-rendering.
          resource={resource}
          structureDefinition={rootDefinition}
          parentStructureDefinition={parentStructureDefinition}
          canEdit={canEdit}
          label={typeEditorLabel}
        />
      </Box>
    </div>
  );
};

const ElementEditorChildren = (props) => {
  return (
    <ExpandCollapseProvider key={props.rootDefinition?.id}>
      <ElementEditorChildrenInner {...props} />
    </ExpandCollapseProvider>
  );
};

export default ElementEditorChildren;
