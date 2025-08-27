import React, { useEffect, useRef, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import {
  ReadOnlyTextField,
  Select,
  TextField,
} from "@madie/madie-design-system/dist/react";
import { MenuItem } from "@mui/material";
import useFhirDefinitionsServiceApi from "../../../../../../../../api/useFhirDefinitionsService";
import useExecutionContext from "../../../../../../../routes/qiCore/useExecutionContext";
import { Coding, Extension, ValueSet } from "fhir/r4";
import { getValueSetUrl } from "../../../../../../../../api/fhirDefinitionServiceUtilities";
import useTerminologyServiceApi from "../../../../../../../../api/useTerminologyServiceApi";
import { getOidFromString } from "@madie/madie-util";
import AddElementButton from "../../../../../../../common/AddElementButton";

const placeHolder = (label: string) => (
  <span style={{ color: "#717171" }}>{label}</span>
);

export const getValueSetComposeIncludeOids = (valueSet: ValueSet) => {
  return valueSet.compose.include
    .map((include) => include.valueSet)
    .reduce((acc, curr) => {
      const oid = getOidFromString(curr?.[0], "FHIR");
      if (oid) {
        return [...acc, oid];
      }
      return acc;
    }, []);
};

const CodingComponent = ({
  canEdit,
  structureDefinition,
  label,
  value,
  onChange,
  showAddAttributeButton,
  addTitle,
  includePrev = true,
}) => {
  const [allValueSets, setAllValueSets] = useState<ValueSet[]>();
  const [selectedValueSet, setSelectedValueSet] = useState<ValueSet>();
  const [selectedConcept, setSelectedConcept] = useState<Coding>();

  const fhirDefinitionService = useRef(useFhirDefinitionsServiceApi());
  const terminologyService = useRef(useTerminologyServiceApi());
  const { valueSetsState, executionContextReady } = useExecutionContext();

  const isBindingRequired =
    structureDefinition.binding?.strength === "required";

  useEffect(() => {
    setSelectedConcept(value);
  }, [value]);

  useEffect(() => {
    if (value && allValueSets && selectedValueSet?.name !== "Custom Code") {
      const valueSet = allValueSets.find(
        (vs) => vs.url === value?.extension?.[0]?.valueUrl
      );
      if (valueSet?.name !== selectedValueSet?.name) {
        setSelectedValueSet(
          allValueSets.find((vs) => vs.url === value?.extension?.[0]?.valueUrl)
        );
      }
    }
  }, [structureDefinition, allValueSets, value]);

  useEffect(() => {
    const [valueSets] = valueSetsState;
    if (!isBindingRequired && valueSets) {
      // value sets that are used in measure CQL
      setAllValueSets((prev) => {
        if (prev) {
          return [...prev, ...valueSets];
        }
        return valueSets;
      });
    }
  }, [executionContextReady, valueSetsState]);

  useEffect(() => {
    if (structureDefinition) {
      // fetch expansion for binding if present
      if (structureDefinition.binding) {
        const valueSetUrl = getValueSetUrl(
          structureDefinition.binding.valueSet
        );
        fhirDefinitionService.current
          .getValueSetDefinition(valueSetUrl)
          .then((valueSet) => {
            if (valueSet.expansion) {
              setAllValueSets((prev) => {
                if (prev) {
                  return [...prev, valueSet];
                }
                return [valueSet];
              });
            } else if (valueSet.compose) {
              const valueSetOids = getValueSetComposeIncludeOids(valueSet);
              terminologyService.current
                .getValueSetsExpansionForOids(valueSetOids)
                .then((expandedValueSets) => {
                  // TODO: doesn't handle compose.exclude
                  const concepts = expandedValueSets.reduce((acc, vs) => {
                    if (vs.expansion?.contains) {
                      return acc.concat(vs.expansion.contains);
                    }
                    return acc;
                  }, []);
                  valueSet.expansion = {
                    contains: concepts,
                    timestamp: new Date().toISOString(),
                  };
                  if (includePrev) {
                    setAllValueSets((prev) => {
                      if (prev) {
                        return [...prev, valueSet];
                      }
                      return [valueSet];
                    });
                  } else {
                    setAllValueSets([valueSet]);
                  }
                });
            }
          })
          .catch((error) => {
            console.error(
              `An error occurred while fetching binding valueSet: [${valueSetUrl}]`,
              error
            );
          });
      }
    }
  }, [structureDefinition]);

  // Change handlers
  const handleValueSetChange = (value: string) => {
    // clear code system and code
    setSelectedConcept(undefined);
    if (value === "Custom Code") {
      setSelectedValueSet({
        title: "Custom Code",
        name: "Custom Code",
      } as ValueSet);
    } else {
      const valueSet = allValueSets.find((vs) => vs.name === value);
      setSelectedValueSet(valueSet);
    }
  };

  const handleCodeSystemChange = (codeSystem: string) => {
    setSelectedConcept({
      system: codeSystem,
      code: "",
      display: "",
    });
  };

  const handleCodeChange = (code: string) => {
    let coding: Coding;
    if (selectedValueSet.title === "Custom Code") {
      coding = {
        system: selectedConcept?.system,
        code: code,
        display: code,
      } as Coding;
    } else {
      const concept = selectedValueSet?.expansion?.contains?.find(
        (concept) =>
          concept.code === code && concept.system === selectedConcept.system
      );
      coding = {
        system: concept.system,
        code: concept.code,
        display: concept.display,
        extension: [
          {
            url: "http://hl7.org/fhir/StructureDefinition/valueset-reference",
            valueUrl: selectedValueSet.url,
          },
        ] as Extension[],
      } as Coding;
    }
    setSelectedConcept(coding);
    if (coding?.code && coding?.system) {
      onChange(coding);
    }
  };

  // Menu options
  const getValueSetMenuOptions = () => {
    const menuOptions =
      allValueSets?.map((valueSet) => {
        return (
          <MenuItem
            key={valueSet?.name}
            value={valueSet?.name}
            data-testid={`value-set-option-${valueSet?.name}`}
          >
            {valueSet?.title}
          </MenuItem>
        );
      }) || [];

    // for required bindings, show only the binding value set
    if (isBindingRequired && menuOptions.length > 0) {
      return menuOptions;
      // for non-required bindings, allow custom coding, binding value set and value sets used in CQL
    } else if (executionContextReady && !isBindingRequired) {
      return [
        <MenuItem
          key="custom-code"
          value="Custom Code"
          data-testid="value-set-option-custom-code"
        >
          Custom Code
        </MenuItem>,
        ...(allValueSets?.map((valueSet) => {
          return (
            <MenuItem
              key={valueSet?.name}
              value={valueSet?.name}
              data-testid={`value-set-option-${valueSet?.name}`}
            >
              {valueSet?.title}
            </MenuItem>
          );
        }) || []),
      ];
    } else {
      return [
        <MenuItem value="" data-testid="value-set-option-loading">
          Loading...
        </MenuItem>,
      ];
    }
  };

  const getCodeSystemMenuOptions = () => {
    const codeSystems = selectedValueSet?.expansion?.contains?.map(
      (concept) => concept.system
    );
    if (codeSystems) {
      return [...new Set(codeSystems)].map((codeSystem) => {
        return (
          <MenuItem
            key={codeSystem}
            value={codeSystem}
            data-testid={`code-system-option-${codeSystem}`}
          >
            {codeSystem}
          </MenuItem>
        );
      });
    }
    return [];
  };

  const getCodeMenuOptions = () => {
    return (
      selectedValueSet?.expansion?.contains
        ?.filter((concept) => concept.system === selectedConcept?.system)
        .map((concept) => {
          return (
            <MenuItem
              key={concept.code}
              value={concept.code}
              data-testid={`code-option-${concept.code}`}
            >
              {`${concept.code} - ${concept.display}`}
            </MenuItem>
          );
        }) || []
    );
  };
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className="element-editor-add-row">
        <Select
          label="Value Set / Direct Reference Code"
          id={`value-set-selector-${label}`}
          inputProps={{
            "data-testid": `value-set-selector-input-${label}`,
          }}
          data-testid={`value-set-${label}`}
          readOnly={!canEdit}
          options={getValueSetMenuOptions()}
          value={selectedValueSet ? selectedValueSet?.name : ""}
          renderValue={(value) => {
            if (value === "") {
              return placeHolder("- Select -");
            }
            return selectedValueSet?.title;
          }}
          onChange={(e) => handleValueSetChange(e.target.value)}
        />
        {showAddAttributeButton && addTitle && (
          <AddElementButton name={addTitle} />
        )}
      </div>
      {selectedValueSet && (
        <div tw="flex mt-3">
          {selectedValueSet.title == "Custom Code" ? (
            <>
              <div tw="w-1/2">
                <TextField
                  id="custom-code-system"
                  tw="w-full"
                  label="Custom Code System"
                  placeholder="Custom Code System"
                  required={true}
                  readOnly={!canEdit}
                  inputProps={{
                    "data-testid": "custom-code-system-input",
                  }}
                  data-testid="custom-code-system"
                  onChange={(event) =>
                    handleCodeSystemChange(event.target.value)
                  }
                />
              </div>
              <div tw="w-1/2 pl-3">
                <TextField
                  id="custom-code"
                  tw="w-full"
                  label="Custom Code"
                  placeholder="Custom Code"
                  required={true}
                  readOnly={!canEdit || !selectedConcept?.system}
                  inputProps={{
                    "data-testid": "custom-code-input",
                  }}
                  data-testid="custom-code"
                  onChange={(event) => handleCodeChange(event.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div tw="w-1/2">
                <Select
                  placeHolder={{
                    name: "Select Code System",
                    value: "",
                  }}
                  label="Code System"
                  id="code-system-selector"
                  inputProps={{
                    "data-testid": "code-system-selector-input",
                  }}
                  data-testid="code-system-selector"
                  readOnly={!canEdit}
                  required="true"
                  SelectDisplayProps={{
                    "aria-required": "true",
                  }}
                  options={getCodeSystemMenuOptions()}
                  value={selectedConcept?.system ? selectedConcept.system : ""}
                  onChange={(event) =>
                    handleCodeSystemChange(event.target.value)
                  }
                />
              </div>
              <div tw="w-1/2 pl-3">
                <Select
                  label="Code"
                  id="code-selector"
                  inputProps={{
                    "data-testid": "code-selector-input",
                  }}
                  data-testid="code-selector"
                  readOnly={!canEdit}
                  required={true}
                  SelectDisplayProps={{
                    "aria-required": "true",
                  }}
                  options={getCodeMenuOptions()}
                  value={selectedConcept?.code ? selectedConcept.code : ""}
                  renderValue={(value) => {
                    if (value === "") {
                      return placeHolder("Select Code");
                    }
                    return `${selectedConcept?.code} - ${selectedConcept?.display}`;
                  }}
                  onChange={(event) => handleCodeChange(event.target.value)}
                />
              </div>
            </>
          )}
        </div>
      )}
      {!selectedValueSet && value && !value.extension && (
        <>
          <div tw="flex mt-3">
            <div tw="w-1/2">
              <ReadOnlyTextField
                label="Code System"
                id="code-system"
                data-testid={`code-system-${value.code}`}
                value={value.system}
              />
            </div>
            <div tw="w-1/2 pl-3">
              <ReadOnlyTextField
                label="Code"
                id="code"
                data-testid={`code-${value.code}`}
                value={`${value.code} ${
                  value.display ? `- ${value.display}` : ""
                }`}
              />
            </div>
          </div>
          <div
            tw="mt-3 text-sm text-red-500"
            data-testid={`select-valueset-warning-${value.code}`}
          >
            To update code system or code please select a valid value set.
          </div>
        </>
      )}
    </div>
  );
};

export default CodingComponent;
