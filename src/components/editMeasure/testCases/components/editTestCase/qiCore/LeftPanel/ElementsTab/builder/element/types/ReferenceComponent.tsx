import React, { useContext, useState } from "react";
import ResourceContext from "../../ResourceContext";
import { Select } from "@madie/madie-design-system/dist/react";
import { MenuItem } from "@mui/material";
import { useQiCoreResource } from "../../../../../../../../util/QiCorePatientProvider";
import AddElementButton from "../../../../../../../common/AddElementButton";
import { useFormikContext } from "formik";

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
  // if value is passed, we need to initialize this as value.reference.split('/')[0] or an empty string
  const [selectedReferenceType, setSelectedReferenceType] = useState<string>(
    value?.reference?.split("/")[0] || ""
  ); // will need to default to something if editing existing element

  // SecondDropdown Utilities
  const resourcesOfSpecifiedType = state.bundle.entry.filter((entry) => {
    // When a resource type has been selected, we need to populate the second dropdown with resources of that type in the json, if they exist
    return selectedReferenceType === entry.resource.resourceType;
  });

  const emptyOptions = [{ label: "ID Not Present (Add New)", value: "" }]; // If no resources of that type exist, we need to show a message in the dropdown
  const selectableResoureOptions = resourcesOfSpecifiedType.map((res) => ({
    label: `${selectedReferenceType}/${res.resource.id}`,
    value: `${selectedReferenceType}/${res.resource.id}`,
  }));
  const finalOptions =
    selectableResoureOptions.length > 0
      ? selectableResoureOptions
      : emptyOptions;

  const [selectedReferenceId, setSelectedReferenceId] = useState<string>(
    value?.reference || ""
  ); // will need to default to something if editing existing element

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
            value={selectedReferenceId}
            disabled={!canEdit}
            required={required}
            id={"reference-select"}
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
              formikContext.handleChange(e);
              setSelectedReferenceId(e.target.value);
            }}
            helperText={helperText}
            error={error}
          />
          <div />
        </div>
      )}
    </>
  );
}
