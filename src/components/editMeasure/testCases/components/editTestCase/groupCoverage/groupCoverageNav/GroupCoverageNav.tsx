import React from "react";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
import { PopulationType } from "@madie/madie-models";

export interface Population {
  abbreviation: string;
  id: string;
  criteriaReference?: string;
  name: PopulationType;
}

export interface AllDefinitionsTabs {
  name: string;
}

interface Props {
  id: string;
  populations: Array<Population>;
  allDefinitions: Array<AllDefinitionsTabs>;
  selectedHighlightingTab: Population;
  onClick: Function;
  includeSDE?: boolean;
  includeRAV?: boolean;
  model?: string;
}

const GroupCoverageNav = ({
  id,
  populations,
  allDefinitions,
  selectedHighlightingTab,
  onClick,
  includeSDE,
  includeRAV,
  model,
}: Props) => {
  // TODO Remove parameter when either of these flags are removed, or when both feature flags are removed
  const showRAVTab = includeRAV;

  return (
    <>
      <Tabs
        type="C"
        size="standard"
        orientation="vertical"
        value={selectedHighlightingTab.id}
        data-testid={`group-coverage-nav-${id}`}
      >
        {populations &&
          populations.map((population) => (
            <Tab
              type="C"
              label={population.abbreviation}
              key={population.abbreviation}
              value={population.id}
              orientation="vertical"
              onClick={() => {
                onClick(population);
              }}
            />
          ))}
        {includeSDE && (
          <Tab
            type="C"
            label="SDE"
            key="SDE"
            value="SDE"
            aria-label="SDE-tab"
            orientation="vertical"
            data-testid="sde-tab"
            onClick={() => {
              onClick({ name: "SDE", id: "SDE" });
            }}
          />
        )}
        {showRAVTab && (
          <Tab
            type="C"
            label="RAV"
            key="RAV"
            value="RAV"
            aria-label="RAV-tab"
            orientation="vertical"
            data-testid="rav-tab"
            onClick={() => {
              onClick({ name: "RAV", id: "RAV" });
            }}
          />
        )}
      </Tabs>
      <Tabs
        type="C"
        size="standard"
        orientation="vertical"
        value={selectedHighlightingTab.name}
        data-testid={`group-coverage-nav-${name}`}
      >
        {allDefinitions &&
          allDefinitions.map((population) => (
            <Tab
              type="C"
              label={population.name}
              key={population.name}
              value={population.name}
              orientation="vertical"
              onClick={() => {
                onClick(population);
              }}
            />
          ))}
      </Tabs>
    </>
  );
};

export default GroupCoverageNav;
