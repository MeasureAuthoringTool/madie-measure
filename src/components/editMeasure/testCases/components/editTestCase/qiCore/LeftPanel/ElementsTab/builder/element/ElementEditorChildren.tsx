import React, { useMemo } from "react";
import * as _ from "lodash";
import TypeEditor from "./TypeEditor";
import {
  stripResourcePath,
  getElementName,
  getNestedProperty,
  stripAllIndexes,
  addCardinalityToElement,
  formatChoiceType,
  getFirstChildren,
  isComponentDataType,
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
import { useRequiredFields } from "./RequiredFieldsContext";

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
  hasSubAttributes,
}) => {
  currentDepth = currentDepth + 1;
  const elemPath = stripResourcePath(resourcePath, rootDefinition.path);
  const { values } = useFormikContext();
  let elementValue = _.get(resource, elemPath);
  const { dispatch, state } = useQiCoreResource();
  const expandCollapseCtx = useExpandCollapse();
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
        </div>
      )}
      <Box sx={{ rowGap: 0 }}>
        <TypeEditor
          key={formatChoiceType(rootDefinition)} //React uses the key to determine whether a component instance should be reused or recreated when re-rendering.
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

const ElementEditorChildren = (props) => {
  const { formInfo } = useRequiredFields();
  const type = props.rootDefinition?.type?.[0]?.code;
  const hasSubAttributes = useMemo(() => {
    if (!formInfo || isComponentDataType(type)) return false;
    const strippedId = stripAllIndexes(props.rootDefinition?.id ?? "");
    return getFirstChildren(strippedId, formInfo).length > 0;
  }, [formInfo, type, props.rootDefinition?.id]);

  return (
    <ExpandCollapseProvider>
      <ElementEditorChildrenInner
        {...props}
        hasSubAttributes={hasSubAttributes}
      />
    </ExpandCollapseProvider>
  );
};

export default ElementEditorChildren;
