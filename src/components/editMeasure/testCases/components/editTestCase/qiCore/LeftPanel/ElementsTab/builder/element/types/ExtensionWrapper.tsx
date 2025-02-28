import React, { useEffect, useRef, useState } from "react";
import ExtensionComponent, { ExtensionProps } from "./ExtensionComponent";
import useFhirDefinitionsServiceApi from "../../../../../../../../api/useFhirDefinitionsService";
import { Box, Divider, MenuItem, Select, TextField } from "@mui/material";
import * as _ from "lodash";
import Button from "@mui/material/Button";

type ExtensionWrapperProps = ExtensionProps & { children?: any; value: any };

const ExtensionWrapper = ({
  fhirResource,
  canEdit,
  elementDefinition,
  parentStructureDefinition,
  children,
  value,
  onChange,
}: ExtensionWrapperProps) => {
  const fhirDefinitionsService = useRef(useFhirDefinitionsServiceApi());
  const [registeredExtensions, setRegisteredExtensions] = useState([]);
  const [selectedExtension, setSelectedExtension] = useState(null);

  useEffect(() => {
    // check for any registered extensions on this element/resource
    const parts = elementDefinition.id.split(".");
    const target =
      parts[parts.length - 1].toUpperCase() === "EXTENSION"
        ? parts.slice(0, parts.length - 1).join(".")
        : elementDefinition.id;
    // const root
    // const target = elementDefinition.id.toUpperCase().endsWith("EXTENSION")
    //   ? elementDefinition.id.substring(0, elementDefinition.id.length - 9)
    //   : elementDefinition.id;
    console.log("extension target: ", target);
    fhirDefinitionsService.current
      .getExtensionsForTargetElementPath(target)

      .then((extensions) => {
        console.log("extensions: ", extensions);
        setRegisteredExtensions(extensions);
      })
      .catch((error) =>
        console.error("An error occurred while loading extensions", error)
      );
  }, []);

  console.log("rendering wrapper with value: ", JSON.stringify(value));

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!_.isEmpty(registeredExtensions) && (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            p: 1,
          }}
        >
          <TextField
            size="small"
            select
            sx={{
              width: 300,
            }}
            placeholder="Add Registered Extension"
            value={selectedExtension}
            onChange={(e) => setSelectedExtension(e.target.value)}
          >
            {registeredExtensions.map((extension) => {
              return (
                <MenuItem
                  key={extension.definition?.id}
                  value={extension.definition?.id}
                >
                  {extension.definition?.name}
                </MenuItem>
              );
            })}
          </TextField>
          <Button
            onClick={() => {
              const extensionDefinition = registeredExtensions.find(registeredExtensions => registeredExtensions.definition.id === selectedExtension);
              const nextValue = _.isNil(value) ? [{ url: selectedExtension.url}] : [...value, { url: extensionDefinition?.definition?.url}];
              onChange(nextValue);
            }}
            disabled={_.isEmpty(selectedExtension)}
          >
            Add Extension
          </Button>
        </Box>
      )}
      <Box>
        {_.isEmpty(value)
          ? ""
          : _.isArray(value)
          ? value?.map((extension) => {
              return (
                <Box>
                  <ExtensionComponent
                    canEdit={canEdit}
                    onChange={() => {}}
                    fhirResource={fhirResource}
                    elementDefinition={elementDefinition}
                    parentStructureDefinition={parentStructureDefinition}
                    // value={extension}
                  />
                  <Divider sx={{py: 1}} />
                </Box>
              );
            })
          : `isArray: ${_.isArray(value) ? "yes" : "no"}`}
      </Box>
    </Box>
  );
};

export default ExtensionWrapper;
