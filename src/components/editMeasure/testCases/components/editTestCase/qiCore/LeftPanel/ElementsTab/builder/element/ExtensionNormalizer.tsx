import { useEffect } from "react";
import { useFormikContext } from "formik";
import * as _ from "lodash";
import { ElementDefinition } from "fhir/r4";
import { normalizeExtensionArray } from "../../../../../../../api/fhirDefinitionServiceUtilities";

interface ExtensionNormalizerProps {
  extensionLabel: string;
  elementDefinitions: ElementDefinition[];
}

/**
 * Component that normalizes extensions once on mount.
 * Ensures extensions are at their correct reserved indices based on elementDefinitions order.
 */
const ExtensionNormalizer = ({
  extensionLabel,
  elementDefinitions,
}: ExtensionNormalizerProps) => {
  const formik = useFormikContext();

  useEffect(() => {
    const currentExtensions = _.get(
      formik.values,
      `${extensionLabel}.extension`,
      []
    );

    if (!elementDefinitions?.length || !currentExtensions?.length) {
      return;
    }

    const normalizedExtensions = normalizeExtensionArray(
      currentExtensions,
      elementDefinitions
    );

    if (!_.isEqual(currentExtensions, normalizedExtensions)) {
      // Build new values with normalized extensions applied
      const newValues = _.cloneDeep(formik.values) as object;
      _.set(newValues, `${extensionLabel}.extension`, normalizedExtensions);

      // Reset form with normalized values as both current and initial values
      // This ensures the form is not considered dirty after normalization
      formik.resetForm({ values: newValues });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extensionLabel, elementDefinitions]);

  return null;
};

export default ExtensionNormalizer;
