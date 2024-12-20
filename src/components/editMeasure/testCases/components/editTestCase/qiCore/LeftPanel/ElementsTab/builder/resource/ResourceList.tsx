import React, { useState } from "react";
import { Box, TextField } from "@mui/material";
import ResourceListTile from "./ResourceListTile";
import * as _ from "lodash";
import { ResourceIdentifier } from "../../../../../../../api/models/ResourceIdentifier";
import { MadieSpinner } from "@madie/madie-design-system/dist/react";

export interface ResourceListProps {
  resourceIdentifiers: ResourceIdentifier[];
  onClick: (resourceIdentifier: ResourceIdentifier) => void;
}

const ResourceList = ({ resourceIdentifiers, onClick }: ResourceListProps) => {
  const [resourceFilter, setResourceFilter] = useState("");

  return (
    <>
      <Box
        sx={{
          py: 1,
          pr: 1,
          width: "100%",
        }}
      >
        <TextField
          onChange={(e) => setResourceFilter(e.target.value.trim())}
          value={resourceFilter}
          placeholder="Filter Resources"
          size="small"
          fullWidth
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        {resourceIdentifiers ? (
          resourceIdentifiers
            ?.filter(
              (resource) =>
                _.isEmpty(resourceFilter.trim()) ||
                resource.title
                  .toUpperCase()
                  .includes(resourceFilter.toUpperCase())
            )
            .map((resourceIdentifier) => (
              <ResourceListTile
                resourceIdentifier={resourceIdentifier}
                onClick={onClick}
              />
            ))
        ) : (
          <MadieSpinner style={{ height: 50, width: 50 }} />
        )}
      </Box>
    </>
  );
};

export default ResourceList;
