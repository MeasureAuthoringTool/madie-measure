import React, { useEffect, useRef, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { TypeComponentProps } from "./TypeComponentProps";
import { Select, TextField } from "@madie/madie-design-system/dist/react";
import { MenuItem } from "@mui/material";
import useFhirDefinitionsServiceApi from "../../../../../../../../api/useFhirDefinitionsService";
import useExecutionContext from "../../../../../../../routes/qiCore/useExecutionContext";
import { ValueSet } from "fhir/r4";
import { getValueSetUrl } from "../../../../../../../../api/fhirDefinitionServiceUtilities";

interface Concept {
  code: string;
  display: string;
  system: string;
}

const placeHolder = (label: string) => (
  <span style={{ color: "#717171" }}>{label}</span>
);

const CodingComponent = ({
  canEdit,
  structureDefinition,
  label,
  value,
  onChange,
}: TypeComponentProps) => {
  // binding value set
  const [bindingValueSet, setBindingValueSet] = useState<ValueSet>();
  const [selectedValueSet, setSelectedValueSet] = useState<ValueSet>();
  const [selectedConcepts, setSelectedConcepts] = useState<Concept[]>();
  const [selectedConcept, setSelectedConcept] = useState<Concept>();

  const fhirDefinitionService = useRef(useFhirDefinitionsServiceApi());
  const { valueSetsState, executionContextReady } = useExecutionContext();

  const isBindingRequired =
    structureDefinition.binding?.strength === "required";
  const allValueSets = [];
  // collect binding value set if present
  if (bindingValueSet) {
    allValueSets.push(bindingValueSet);
  }
  // if binding is not required, add all the value sets used in CQL
  if (executionContextReady && !isBindingRequired) {
    // value sets that are used in measure CQL
    const [valueSets] = valueSetsState;
    allValueSets.push(...valueSets);
  }
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
            setBindingValueSet(valueSet);
          })
          .catch((error) => {
            console.error(
              `An error occurred while fetching valueSet expansion for valueSet [${valueSetUrl}]`,
              error
            );
          });
      }
    }
  }, [structureDefinition]);

  useEffect(() => {
    if (selectedConcept?.code && selectedConcept?.system) {
      onChange(selectedConcept);
    }
  }, [selectedConcept]);

  // Change handlers
  const handleValueSetChange = (value: string) => {
    // clear code system and code
    setSelectedConcepts([]);
    setSelectedConcept(undefined);
    if (value === "Custom Code") {
      setSelectedValueSet({
        title: "Custom Code",
        name: "Custom Code",
      } as unknown as ValueSet);
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
    if (selectedValueSet.title !== "Custom Code") {
      const concepts = selectedValueSet.expansion?.contains.filter(
        (concept) => concept.system === codeSystem
      );
      setSelectedConcepts(concepts as Concept[]);
    }
  };

  const handleCodeChange = (code: string) => {
    if (selectedValueSet.title === "Custom Code") {
      setSelectedConcept((prevState) => ({
        ...prevState,
        code: code,
        display: code,
      }));
    } else {
      const concept = selectedConcepts.find((concept) => concept.code === code);
      setSelectedConcept({
        system: concept.system,
        code: concept.code,
        display: concept.display,
      });
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
        ...allValueSets.map((valueSet) => {
          return (
            <MenuItem
              key={valueSet?.name}
              value={valueSet?.name}
              data-testid={`value-set-option-${valueSet?.name}`}
            >
              {valueSet?.title}
            </MenuItem>
          );
        }),
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
    return selectedConcepts.map((concept) => {
      return (
        <MenuItem
          key={concept.code}
          value={concept.code}
          data-testid={`code-option-${concept.code}`}
        >
          {`${concept.code} - ${concept.display}`}
        </MenuItem>
      );
    });
  };

  return (
    <>
      <Select
        label="Value Set / Direct Reference Code"
        id={`value-set-selector-${label}`}
        inputProps={{
          "data-testid": `value-set-selector-input-${label}`,
        }}
        data-testid={`value-set-${label}`}
        disabled={!canEdit}
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
                  disabled={!canEdit}
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
                  disabled={!canEdit}
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
                  disabled={!canEdit}
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
                  disabled={!canEdit}
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
    </>
  );
};

export default CodingComponent;
