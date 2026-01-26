import React, { useContext, useEffect, useState } from "react";
import ResourceContext from "../../ResourceContext";
import { Select } from "@madie/madie-design-system/dist/react";
import { IconButton, MenuItem, Tooltip, InputLabel } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useQiCoreResource } from "../../../../../../../../util/QiCorePatientProvider";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { useFormikContext } from "formik";
import { buildMadieResourceFromResourceIdentifier } from "../../../../../../../../api/fhirDefinitionServiceUtilities";
import * as _ from "lodash";

export const getReferenceComponentLabel = (label: string) => {
  //e.g. for label = ClaimResponse.addItem[0].provider[0] return Provider
  const componentLabel = label
    .split(".")
    ?.pop()
    ?.replace(/\[.*\]$/, "");
  return componentLabel ? _.startCase(componentLabel) : "";
};

export const getHighestPriorityResourceList = (
  qiCoreProfiles,
  usCoreProfiles,
  baseFhirProfiles
) => {
  if (qiCoreProfiles.length > 0) {
    return qiCoreProfiles[0];
  } else if (usCoreProfiles.length > 0) {
    return usCoreProfiles[0];
  } else {
    return baseFhirProfiles[0];
  }
};
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
  index = 0,
  handleAddElement,
  handleDeleteElement,
  showDeleteButton = false,
}: any) {
  const { state } = useQiCoreResource();
  const formikContext = useFormikContext();
  // First dropdown Utilities
  const allResourceProfiles = useContext(ResourceContext); // get all profiles loaded from builder

  const targetProfiles =
    structureDefinition.type?.find(
      (type: { code: string }) => type.code === "Reference"
    )?.targetProfile || []; // get the profiles declared in the structure definition
  const resourceProfileOptions =
    allResourceProfiles
      ?.filter((r) => targetProfiles.includes(r.profile))
      .filter(
        (r, index, self) =>
          index === self.findIndex((t) => t.profile === r.profile)
      )
      .map((resourceProfile) => ({
        label: resourceProfile.title,
        value: resourceProfile.type,
        profile: resourceProfile.profile,
      })) || [];

  const [selectedReferenceType, setSelectedReferenceType] = useState<string>(
    value?.reference?.split("/")?.[0] || ""
  ); // will need to default to something if editing existing element
  const possibleResourceOptionsForAddNew = allResourceProfiles
    ? allResourceProfiles.filter((r) => {
        return r.type === selectedReferenceType;
      })
    : [];
  // For now we're going to return lists of each and select index 0. Future story to allow user to pick between them if multiple exist. Observation.
  const qiCoreProfiles = possibleResourceOptionsForAddNew.filter((rp) =>
    rp.profile.includes("qicore")
  );
  const usCoreProfiles = possibleResourceOptionsForAddNew.filter((rp) =>
    rp.profile.includes("us-core")
  );
  const baseFhirProfiles = possibleResourceOptionsForAddNew.filter(
    (rp) =>
      rp.profile.includes("fhir/StructureDefinition") &&
      !rp.profile.includes("/us/")
  );

  let finalResourceOptionForAddNew;
  finalResourceOptionForAddNew = getHighestPriorityResourceList(
    qiCoreProfiles,
    usCoreProfiles,
    baseFhirProfiles
  );
  const emptyOption = [
    { label: "ID Not Present (Add New)", value: "add_new_id" },
  ]; // If no resources of that type exist, we need to show a message in the dropdown

  // Store selected profile URL instead of just type
  const [selectedProfileUrl, setSelectedProfileUrl] = useState<string>(
    value?.referenceProfileUrl || ""
  );

  // Helper function to determine profile match type and hierarchy
  const getProfileMatchTypes = (profileUrl) => {
    if (profileUrl.includes("/fhir/us/qicore")) return ["/fhir/us/qicore"];
    if (profileUrl.includes("/fhir/us/core"))
      return ["/fhir/us/core", "/fhir/us/qicore"];
    if (profileUrl.includes("/fhir/StructureDefinition/"))
      return [
        "/fhir/StructureDefinition/",
        "/fhir/us/core/",
        "/fhir/us/qicore/",
      ];
    return [];
  };

  // Updated getFinalOptions to filter by resourceType and meta.profile hierarchy
  const getFinalOptions = (
    selectedReferenceType,
    selectedProfileUrl,
    bundleEntries
  ) => {
    if (!selectedReferenceType || !selectedProfileUrl) return emptyOption;
    const matchTypes = getProfileMatchTypes(selectedProfileUrl);
    const filtered = bundleEntries.filter((entry) => {
      if (entry.resource.resourceType !== selectedReferenceType) return false;
      const profiles = entry.resource.meta?.profile || [];
      return profiles.some((url) =>
        matchTypes.some((type) => url.includes(type))
      );
    });
    if (filtered.length === 0) return emptyOption;
    return filtered.map((res) => ({
      label: `${selectedReferenceType}/${res.resource.id}`,
      value: `${selectedReferenceType}/${res.resource.id}`,
    }));
  };

  // Use new getFinalOptions logic
  const finalOptions = getFinalOptions(
    selectedReferenceType,
    selectedProfileUrl,
    state.bundle.entry
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
    const addNewResources = formikContext.values["add_new_resources"] || [];
    if (addNewResources.length === 0) {
      setSelectedReferenceId(newId);
    }
  }, [value, formikContext.values]); // Use formikContext.values for dependency

  return (
    <>
      <div
        className="element-editor-add-row reference"
        data-component-type="ReferenceComponent"
      >
        <InputLabel
          aria-labelledby="reference-label"
          required={required}
          data-testid="reference-label"
          style={showAddAttributeButton ? { marginBottom: -8 } : undefined}
        >
          {getReferenceComponentLabel(label)}
        </InputLabel>
      </div>
      {/* Select a reference type from all available profiles */}
      <div className="element-editor-add-row reference double-row">
        <Select
          label={"Reference Type"}
          id={`reference-type-select-${index}`}
          data-testid={`reference-type-select-${index}`}
          inputProps={{
            "data-testid": `reference-type-select-input-${index}`,
            "aria-describedby": `reference-type-helper-text-reference-type-${index}`,
            id: `reference-type-input-select-${index}`,
            required: required,
          }}
          readOnly={!canEdit}
          options={resourceProfileOptions.map((opt, i) => (
            <MenuItem
              key={`${opt.label}-${opt.profile}-${i}`}
              data-testid={`${opt.label}-option`}
              value={opt.profile}
            >
              {opt.label}
            </MenuItem>
          ))}
          placeHolder={{
            name: "Select",
            value: "",
          }}
          value={selectedProfileUrl}
          renderValue={(selected) => {
            const item = resourceProfileOptions.find(
              (item) => item.profile === selected
            );
            return item?.label || "Select";
          }}
          onChange={(e) => {
            setSelectedProfileUrl(e.target.value);
            // Find the resource type for the selected profile URL
            const selectedProfile = resourceProfileOptions.find(
              (opt) => opt.profile === e.target.value
            );
            setSelectedReferenceType(selectedProfile?.value || "");
            setSelectedReferenceId("");
          }}
          helperText={helperText}
          error={error}
        />
        {showDeleteButton && canEdit && (
          <Tooltip title="Delete" placement="top" arrow>
            <IconButton
              onClick={handleDeleteElement}
              data-testid={`delete-button-${label}`}
              aria-label={`delete ${label}`}
              size="small"
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {showAddAttributeButton && addTitle && (
          <AddElementButton name={addTitle} onClick={handleAddElement} />
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
            id={`reference-select-${index}`}
            disabled={!canEdit}
            required={required}
            name={`${label}.reference`}
            data-testid={`reference-select-${index}`}
            inputProps={{
              "data-testid": `reference-select-input-${index}`,
              "aria-describedby": `reference-helper-text-reference-${index}`,
              id: `reference-select-input-${index}`,
              required: required,
            }}
            readOnly={!canEdit}
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
                const newMadieResource =
                  buildMadieResourceFromResourceIdentifier(
                    finalResourceOptionForAddNew
                  );
                // Append to array instead of overwriting - supports multiple "Add New" references
                const existingResources =
                  formikContext.values["add_new_resources"] || [];
                formikContext.setFieldValue("add_new_resources", [
                  ...existingResources,
                  newMadieResource,
                ]);
                formikContext.setFieldValue(
                  `${label}.reference`,
                  `${selectedReferenceType}/${newMadieResource.resource.id}`
                );
                setSelectedReferenceId("add_new_id");
              } else {
                // Selecting an existing resource - just update the reference
                formikContext.setFieldValue(label, {
                  reference: e.target.value,
                });
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
