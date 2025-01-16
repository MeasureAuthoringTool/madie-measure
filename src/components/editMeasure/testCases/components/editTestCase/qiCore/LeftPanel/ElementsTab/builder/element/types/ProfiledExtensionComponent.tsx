import React, { useEffect, useRef, useState } from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import { Box, Divider } from "@mui/material";
import Typography from "@mui/material/Typography";
import * as _ from "lodash";
import TypeEditor from "../TypeEditor";
import useFhirDefinitionsServiceApi from "../../../../../../../../api/useFhirDefinitionsService";
import { StructureDefinitionDto } from "../../../../../../../../api/models/StructureDefinitionDto";

const ProfiledExtensionComponent = ({
  structureDefinition,
  canEdit,
  value,
  onChange,
  resource,
}: TypeComponentProps) => {
  const [extensionProfileDef, setExtensionProfileDef] =
    useState<StructureDefinitionDto>();
  const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());

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
        } else {
          console.error(
            "Not a profiled extension...collecting fields from structure definition...",
            structureDefinition
          );
        }
      })().catch((error) =>
        console.error(
          "An error occurred while loading extension details",
          error
        )
      );
    }
  }, [structureDefinition]);

  return extensionProfileDef ? (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box>{structureDefinition.short}</Box>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {fhirDefinitionsService.current
          .getTopLevelElements(extensionProfileDef)
          .map((elementDefinition) => {
            const type = elementDefinition?.type?.[0];
            const required = +elementDefinition.min > 0;
            const elemPath = fhirDefinitionsService.current.stripResourcePath(
              "Extension",
              elementDefinition.path
            );
            // let elementValue = _.get(resource, elemPath);
            return (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: "10px",
                }}
              >
                <Typography>
                  {_.startCase(elemPath)}
                  {elementDefinition.sliceName
                    ? `:${elementDefinition.sliceName}`
                    : ""}
                </Typography>
                <TypeEditor
                  structureDefinition={elementDefinition}
                  resource={resource}
                  type={type.code}
                  required={required}
                  value={elementDefinition?.fixedUri}
                  onChange={() => {}} // do nothing for now
                  canEdit={canEdit}
                  label={elemPath}
                  parentStructureDefinition={extensionProfileDef}
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
