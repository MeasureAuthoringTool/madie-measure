import React, { useEffect, useRef, useState } from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import { Box, Divider } from "@mui/material";
import Typography from "@mui/material/Typography";
import { useFormikContext } from "formik";
import { Extension } from "fhir/r4";
import * as _ from "lodash";
import TypeEditor from "../TypeEditor";
import useFhirDefinitionsServiceApi from "../../../../../../../../api/useFhirDefinitionsService";
import { StructureDefinitionDto } from "../../../../../../../../api/models/StructureDefinitionDto";
import {
  stripResourcePath,
  getTopLevelElements,
} from "../../../../../../../../api/fhirDefinitionServiceUtilities";

const ProfiledExtensionComponent = ({
  structureDefinition,
  canEdit,
  resource,
}: TypeComponentProps) => {
  const [extensionProfileDef, setExtensionProfileDef] =
    useState<StructureDefinitionDto>();
  const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());
  const formik = useFormikContext();

  useEffect(() => {
    if (structureDefinition) {
      (async () => {
        const type = structureDefinition.type[0];
        if (type.code === "Extension" && !_.isEmpty(type.profile)) {
          const loadProfiles = type.profile?.map((profile: string) => {
            const resourceId = profile.split("/").pop();
            return fhirDefinitionsService.current.getResourceTree(resourceId);
          });
          const profileDefinitions = await Promise.all(loadProfiles);
          setExtensionProfileDef(profileDefinitions[0]);
        }
      })().catch((error) =>
        console.error(
          "An error occurred while loading extension details",
          error
        )
      );
    }
  }, [structureDefinition]);

  const topLevelElements = extensionProfileDef
    ? getTopLevelElements(extensionProfileDef)
    : null;

  const handleChange = (value) => {
    // get extension from formik if present
    const extensions: Extension[] =
      _.get(formik.values, "Patient.extension") || [];
    // structured elements for extension
    const complexElements = topLevelElements.filter(
      // ignore extension of extension
      (element) => element.path.includes("Extension.extension")
    );
    // get relevant nested extension within extension
    const extension = _.find(
      extensions,
      (extension) => extension?.url === extensionProfileDef.definition.url
    );
    // for complex extensions like race, ethnicity, tribalAffiliation
    if (complexElements.length > 1) {
      if (extension) {
        // relevant extension element definition to check cardinality
        const elementDefinition = topLevelElements.find((element) =>
          element.id.includes(value.url)
        );
        // if cardinality is one-to-one, update existing else add new
        if (elementDefinition.max == 1) {
          const filteredExtension = extension.extension.filter(
            (extension) => extension.url !== value.url
          );
          extension.extension = [...filteredExtension, value];
        } else {
          extension.extension.push(value);
        }
      } else {
        extensions.push({
          extension: [value],
          url: extensionProfileDef.definition.url,
        });
      }
    } else {
      // for simple extensions like birthSex, sex
      const elementDefinition = topLevelElements.find((element) =>
        element.path.includes("Extension.value")
      );
      const ext = {
        url: extensionProfileDef.definition.url,
      };
      const valueKey = `value${_.capitalize(elementDefinition.type[0].code)}`;
      ext[valueKey] = value;

      // if cardinality is one-to-one, update existing else add new
      if (extension && elementDefinition.max === "1") {
        extension[valueKey] = value;
      } else {
        extensions.push(ext);
      }
    }
    formik.setFieldValue("Patient.extension", extensions);
  };

  return extensionProfileDef ? (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box>{structureDefinition.short}</Box>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {topLevelElements.map((elementDefinition) => {
          const type = elementDefinition?.type?.[0];
          const required = +elementDefinition.min > 0;
          const elemPath = stripResourcePath(
            "Extension",
            elementDefinition.path
          );
          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                marginTop: "10px",
              }}
            >
              <TypeEditor
                resource={resource}
                structureDefinition={elementDefinition}
                parentStructureDefinition={extensionProfileDef}
                type={type.code}
                required={required}
                value={elementDefinition?.fixedUri}
                onChange={handleChange}
                canEdit={canEdit}
                label={elemPath}
              />
              <Divider />
            </Box>
          );
        })}
      </Box>
    </Box>
  ) : (
    <>Loading Extension...</>
  );
};

export default ProfiledExtensionComponent;
