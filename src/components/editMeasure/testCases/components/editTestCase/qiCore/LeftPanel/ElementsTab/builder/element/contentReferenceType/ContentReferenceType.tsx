import {
  getLastPart,
  getParentPath,
  stripAllIndexes,
} from "../../../../../../../../api/fhirDefinitionServiceUtilities";
import { useRequiredFields } from "../RequiredFieldsContext";
import * as _ from "lodash";
import { useFormikContext } from "formik";
import ElementSection from "../../../../../../../common/UIOnlyModelAgnostic/ElementSection";
import { Box, Typography } from "@mui/material";
import React, { useMemo } from "react";
import TypeEditor from "../TypeEditor";
import ChoiceType from "../ChoiceType";
import { ElementDefinition, Resource } from "fhir/r4";
import ElementSectionQiCore from "../ElementSectionQiCore";

export type ExtendedElementDefinition = ElementDefinition & {
  canBeMultipleCardinality?: boolean;
};

// TypeScript Interfaces
interface ContentReferenceTypeProps {
  elementDefinition: ExtendedElementDefinition;
  parentElementDefinition: ElementDefinition;
  resource: Resource;
  canEdit: boolean;
}

interface PathMapEntry {
  path: string;
  allowsMany: boolean;
}

interface PathMap {
  [key: string]: PathMapEntry;
}

interface ElementRendererProps {
  element: ExtendedElementDefinition;
  label: string;
  canEdit: boolean;
  parentElementDefinition: ExtendedElementDefinition;
  resource: Resource;
}

interface MultiCardinalityElementProps {
  element: ExtendedElementDefinition;
  parentPathMap: PathMapEntry;
  idPart: string;
  parentPath: string;
  canEdit: boolean;
  parentElementDefinition: ExtendedElementDefinition;
  resource: Resource;
  formikValues: any;
}

// Constants
const NESTED_BOX_STYLE = { paddingLeft: "0px" };

/**
 * Filter function to determine if an element should be included in the contentReference
 * Excludes: id, extensions, modifierExtensions, and nested contentReferences
 * TODO: This is to simplify the rendering. if required, remove the filter.
 */
const shouldIncludeElement = (
  key: string,
  value: any,
  refType: string
): boolean => {
  return (
    key?.startsWith(`${refType}.`) &&
    !value?.id?.endsWith(".id") &&
    !value.id.includes("extension") &&
    !value.id.includes("modifierExtension") &&
    // exclude nested contentReferences to keep 1 level recursive contentReference otherwise this chain would never end
    !value.contentReference
  );
};

/**
 * Renders a single element, choosing between ChoiceType and TypeEditor
 * based on whether the label contains a choice type indicator "[x]"
 */
const ElementRenderer = ({
  element,
  label,
  canEdit,
  parentElementDefinition,
  resource,
}: ElementRendererProps) => {
  const strippedId = useMemo(() => stripAllIndexes(label), [label]);

  if (label.includes("[x]")) {
    return (
      <ChoiceType
        childDef={{
          ...element,
          id: strippedId,
        }}
        label={label}
        canEdit={canEdit}
        parentStructureDefinition={parentElementDefinition}
        resource={resource}
        key={label}
      />
    );
  }

  return (
    <TypeEditor
      resource={resource}
      parentStructureDefinition={parentElementDefinition}
      structureDefinition={{
        ...element,
        id: strippedId,
      }}
      canEdit={canEdit}
      label={label}
      key={label}
    />
  );
};

/**
 * Renders an element section for elements with multiple cardinality
 * Creates a nested section with array items
 */
const MultiCardinalityElement = ({
  element,
  parentPathMap,
  idPart,
  parentPath,
  canEdit,
  parentElementDefinition,
  resource,
  formikValues,
}: MultiCardinalityElementProps) => {
  const values = _.get(formikValues, parentPathMap.path) || [1];
  return (
    <ElementSectionQiCore
      title={_.startCase(getLastPart(parentPath))}
      startOpen={true}
      children={
        <div className="nested-element-section">
          {values.map((v: any, i: number) => {
            const label = `${parentPathMap.path}[${i}].${idPart}`;
            return (
              <ElementRenderer
                key={label}
                element={element}
                label={label}
                canEdit={canEdit}
                parentElementDefinition={parentElementDefinition}
                resource={resource}
              />
            );
          })}
        </div>
      }
    />
  );
};

/**
 * Renders a ContentReference Type element by dereferencing the contentReference
 * and rendering the child elements of the referenced type.
 *
 * Examples:
 * - QuestionnaireResponse.item.item references Questionnaire.item
 * - Questionnaire.item.answer.item references Questionnaire.item
 *
 * More info: https://hl7.org/fhir/elementdefinition-definitions.html#ElementDefinition.contentReference
 *
 * @param elementDefinition - The element definition for the contentReference type attribute
 * @param parentElementDefinition - The element definition for the parent attribute being edited
 * @param resource - The resource being edited
 * @param canEdit - Boolean indicating if the resource can be edited
 */
const ContentReferenceType = ({
  elementDefinition,
  parentElementDefinition,
  resource,
  canEdit,
}: ContentReferenceTypeProps) => {
  const formik = useFormikContext();
  const { formInfo } = useRequiredFields();

  // Memoize element retrieval from contentReference
  const elements = useMemo(() => {
    const contentReference = elementDefinition?.contentReference;
    if (!contentReference) {
      return null;
    }
    const refType = contentReference.split("#").pop();
    return formInfo
      .filter(([key, value]) => shouldIncludeElement(key, value, refType))
      .map(([, el]) => el);
  }, [elementDefinition?.contentReference, formInfo]);

  // Memoize section label and cardinality check
  const { sectionLabel, isMultipleCardinality } = useMemo(
    () => ({
      sectionLabel: getLastPart(elementDefinition.id),
      isMultipleCardinality: elementDefinition.canBeMultipleCardinality,
    }),
    [elementDefinition]
  );

  // Memoize values array
  const values = useMemo(
    () => _.get(formik.values, elementDefinition.id) || [1],
    [formik.values, elementDefinition.id]
  );

  // Build pathMap for tracking element paths and cardinality
  const pathMap = useMemo<PathMap>(() => {
    const map: PathMap = {};
    if (!elements) return map;

    values.forEach((value: any, index: number) => {
      const prefix = isMultipleCardinality
        ? `${elementDefinition.id}[${index}]`
        : elementDefinition.id;

      elements.forEach((element) => {
        const idPart = getLastPart(element.id);
        const parentPath = getParentPath(element.id);
        const parentPathMap = map[parentPath];

        let label: string;
        if (parentPathMap && parentPathMap.allowsMany) {
          label = `${parentPathMap.path}.${idPart}`;
        } else {
          label = `${prefix}.${idPart}`;
        }

        map[`${element.id}_${index}`] = {
          path: label,
          allowsMany: element.canBeMultipleCardinality,
        };
      });
    });

    return map;
  }, [elements, values, isMultipleCardinality, elementDefinition.id]);

  if (_.isEmpty(elements)) {
    return <div>This ContentReference Type attribute is not supported</div>;
  }

  return (
    <>
      {values.map((value: any, index: number) => {
        const prefix = isMultipleCardinality
          ? `${elementDefinition.id}[${index}]`
          : elementDefinition.id;

        return (
          <ElementSectionQiCore
            key={`${elementDefinition.id}[${index}]`}
            title={_.startCase(
              `${sectionLabel} ${values.length > 1 ? index + 1 : ""}`
            )}
            startOpen={true}
            children={
              <>
                <Typography
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    color: "#717171",
                    paddingBottom: "20px",
                    marginTop: "-10px",
                  }}
                >
                  Test Case Builder only supports one level of ContentReference
                  Nesting. Please use the JSON editor if you need more levels of
                  nesting.
                </Typography>
                {/* ClaimResponse.Adjudication */}
                <div
                  className="nested-element-section"
                  style={NESTED_BOX_STYLE}
                >
                  {elements.map((element) => {
                    const idPart = getLastPart(element.id);
                    const parentPath = getParentPath(element.id);
                    const parentPathMap = pathMap[`${parentPath}_${index}`];

                    // Handle elements with parent that allows multiple cardinality
                    if (parentPathMap?.allowsMany) {
                      return (
                        <MultiCardinalityElement
                          key={element.id}
                          element={element}
                          parentPathMap={parentPathMap}
                          idPart={idPart}
                          parentPath={parentPath}
                          canEdit={canEdit}
                          parentElementDefinition={parentElementDefinition}
                          resource={resource}
                          formikValues={formik.values}
                        />
                      );
                    }

                    // Calculate label for single cardinality elements
                    const label = parentPathMap
                      ? `${parentPathMap.path}.${idPart}`
                      : `${prefix}.${idPart}`;

                    return (
                      <ElementRenderer
                        key={label}
                        element={element}
                        label={label}
                        canEdit={canEdit}
                        parentElementDefinition={parentElementDefinition}
                        resource={resource}
                      />
                    );
                  })}
                </div>
              </>
            }
          />
        );
      })}
    </>
  );
};

export default ContentReferenceType;
