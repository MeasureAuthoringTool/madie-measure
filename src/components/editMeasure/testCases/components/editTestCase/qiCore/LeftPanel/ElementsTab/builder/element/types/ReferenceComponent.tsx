import React, { useContext, useEffect, useState } from "react";
import ResourceContext from "../../ResourceContext";
import { Select } from "@madie/madie-design-system/dist/react";
import { MenuItem } from "@mui/material";
import { useQiCoreResource } from "../../../../../../../../util/QiCorePatientProvider";
import AddElementButton from "../../../../../../../common/AddElementButton";
import { useFormikContext } from "formik";
import { buildMadieResourceFromResourceIdentifier } from "../../../../../../../../api/fhirDefinitionServiceUtilities";

export default function ReferenceComponent({
  structureDefinition,
  canEdit,
  required,
  helperText,
  error,
  showAddAttributeButton,
  addTitle,
  label,
  value,
}: any) {
  const { state } = useQiCoreResource();
  const formikContext = useFormikContext();
  // First dropdown Utilities
  const allResourceProfiles = useContext(ResourceContext); // get all profiles loaded from builder
  const targetProfiles =
    structureDefinition.type?.find(
      (type: { code: string }) => type.code === "Reference"
    )?.targetProfile || []; // get the profiles available in the structure definition
  const resourceProfileOptions =
    allResourceProfiles
      ?.filter((r) => targetProfiles.includes(r.profile))
      .map((resourceProfile) => ({
        label: resourceProfile.title,
        value: resourceProfile.type,
      })) || [];
  const [selectedReferenceType, setSelectedReferenceType] = useState<string>(
    value?.reference?.split("/")?.[0] || ""
  ); // will need to default to something if editing existing element
  // SecondDropdown Utilities
  const resourcesOfSpecifiedType = state.bundle.entry.filter((entry) => {
    // When a resource type has been selected, we need to populate the second dropdown with resources of that type in the json, if they exist
    return selectedReferenceType === entry.resource.resourceType;
  });

  const emptyOption = [
    { label: "ID Not Present (Add New)", value: "add_new_id" },
  ]; // If no resources of that type exist, we need to show a message in the dropdown
  const selectableResourceOptions = resourcesOfSpecifiedType.map((res) => ({
    label: `${selectedReferenceType}/${res.resource.id}`,
    value: `${selectedReferenceType}/${res.resource.id}`,
  }));
  // our business logic is that we do not allow multiple patients. cannot create new if one exists.
  const getFinalOptions = (
    selectedReferenceType,
    selectableResourceOptions
  ) => {
    // we concat only if there's no selecatble resource options
    if (
      selectedReferenceType === "Patient" &&
      selectableResourceOptions.length
    ) {
      return selectableResourceOptions;
    } else {
      return selectableResourceOptions.concat(emptyOption);
    }
  };

  // const finalOptions = selectableResourceOptions.concat(emptyOption);
  const finalOptions = getFinalOptions(
    selectedReferenceType,
    selectableResourceOptions
  );

  const [selectedReferenceId, setSelectedReferenceId] = useState<string>(
    value?.reference || ""
  ); // will need to default to something if editing existing element

  // this appears to be unavoidable to prevent stale state from switching between two references.
  useEffect(() => {
    const newType = value?.reference?.split("/")?.[0] || "";
    const newId = value?.reference || "";
    setSelectedReferenceType(newType);
    // if the earmark is present, we do not want to update our local state.
    if (!formikContext.values["add_new_resource"]) {
      // This is the instance that we're adding a new resource. Right now, we have an id for a resource that doesn't exist. We want it to instead display add new
      setSelectedReferenceId(newId);
    }
  }, [value, formikContext.values["add_new_resource"]]);
  return (
    <>
      {/* Select a reference type from all available profiles */}
      <div className="element-editor-add-row reference double-row">
        <Select
          label={"Reference Type"}
          id={"reference-type-select"}
          data-testid={"reference-type-select"}
          inputProps={{
            "data-testid": `reference-type-select-input`,
            "aria-describedby": `reference-type-helper-text-reference-type`,
            id: `reference-type-input-select`,
            required: required,
          }}
          options={resourceProfileOptions.map((opt, i) => (
            <MenuItem
              key={`${opt.label}-${opt.value}-${i}`}
              data-testid={`${opt.value}-option`}
              value={opt.value}
            >
              {opt.label}
            </MenuItem>
          ))}
          placeHolder={{
            name: "Select",
            value: "",
          }}
          onChange={(e) => {
            setSelectedReferenceType(e.target.value);
            setSelectedReferenceId("");
          }}
          value={selectedReferenceType}
          helperText={helperText}
          error={error}
        />
        {showAddAttributeButton && addTitle && (
          <AddElementButton name={addTitle} />
        )}
      </div>
      {/* Select a specific resource from the selected reference type, from tc json */}
      {/* in case of label: AdverseEvent.recorder, this select would be AdverseEvent.recorder.reference */}
      {selectedReferenceType && (
        <div className="element-editor-add-row reference">
          <Select
            label={`Specify ${
              resourceProfileOptions.find(
                (opt) => opt.value === selectedReferenceType
              )?.label
            }`}
            id={"reference-select"}
            disabled={!canEdit}
            required={required}
            name={`${label}.reference`}
            data-testid={"reference-select"}
            inputProps={{
              "data-testid": `reference-select-input`,
              "aria-describedby": `reference-helper-text-reference`,
              id: `reference-select-input`,
              required: required,
            }}
            options={finalOptions.map((opt, i) => (
              <MenuItem
                key={`${opt.label}-${opt.value}-${i}`}
                data-testid={`${opt.label}-option`}
                value={opt.value}
              >
                {opt.label}
              </MenuItem>
            ))}
            placeHolder={{
              name: "Select",
              value: "",
            }}
            onChange={(e) => {
              if (e.target.value === "add_new_id") {
                const selectedResourceIdentifier = allResourceProfiles.find(
                  (r) => r.type === selectedReferenceType
                );
                const newMadieResource =
                  buildMadieResourceFromResourceIdentifier(
                    selectedResourceIdentifier
                  );
                formikContext.setFieldValue(
                  "add_new_resource",
                  newMadieResource
                );
                formikContext.setFieldValue(
                  `${label}.reference`,
                  `${selectedReferenceType}/${newMadieResource.resource.id}`
                );
                setSelectedReferenceId("add_new_id");
              } else {
                // when selecting a known value we need to blank the add_new_id
                formikContext.setFieldValue(label, {
                  reference: e.target.value,
                });
                formikContext.setFieldValue("add_new_resource", undefined);
                setSelectedReferenceId(e.target.value);
              }
            }}
            renderValue={(selected) => {
              // Find the corresponding label for the selected value
              const item = finalOptions.find((item) => item.value === selected);
              return item?.label || "Select";
            }}
            value={selectedReferenceId}
            helperText={helperText}
            error={error}
          />
          <div />
        </div>
      )}
    </>
  );
}
