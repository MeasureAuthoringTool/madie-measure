import React from "react";
import * as _ from "lodash";
import TypeEditor from "./TypeEditor";
import {
  stripResourcePath,
  getElementName,
  getNestedProperty,
  stripAllIndexes,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";
import ElementEditorActionCenter from "./elementEditorActionCenter/ElementEditorActionCenter";
import {
  ResourceActionType,
  useQiCoreResource,
} from "../../../../../../../util/QiCorePatientProvider";
import Box from "@mui/material/Box";
import { useFormikContext } from "formik";

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
    // 3 cases -> Nothing there, 1but nav is showing, 2something there not an array, 3an array
    // There's nothing here. But our left nav is showing it.
    if (!nextEntry.resource[elemPath]) {
      // make it accessible to avoid a null
      nextEntry.resource[elemPath] = {};
    }
    // is it an array already?
    if (!Array.isArray(nextEntry.resource[elemPath])) {
      // make it one
      nextEntry.resource[elemPath] = [nextEntry.resource[elemPath]];
    }
    // add a new element;
    nextEntry.resource[elemPath] = nextEntry.resource[elemPath].concat({}); // add an empty object.
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
        style={{ cursor: "default", border: "none", marginBottom: 24 }}
      >
        <h4 className="header">
          {getElementName(
            rootDefinition,
            resourcePath,
            getNestedProperty(values, stripAllIndexes(rootDefinition.id))
          )}
        </h4>
        <div style={{ position: "relative", top: "-7px" }}>
          <ElementEditorActionCenter
            numElements={
              Object.prototype.toString.call(elementValue) === "[object Array]"
                ? elementValue.length
                : 1
            }
            addElementOfMultipleCardinality={addElementOfMultipleCardinality}
            rootDefinition={rootDefinition}
            handleDelete={deleteElement}
          />
        </div>
      </div>
      <Box>
        <TypeEditor
          resource={resource}
          structureDefinition={rootDefinition}
          parentStructureDefinition={parentStructureDefinition}
          canEdit={canEdit}
          label={rootDefinition?.id}
        />
      </Box>
    </div>
  );
};

export default ElementEditorChildren;
