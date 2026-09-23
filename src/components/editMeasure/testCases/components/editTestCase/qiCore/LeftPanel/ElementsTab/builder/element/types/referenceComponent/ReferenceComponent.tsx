import React, { useContext, useEffect, useState, useMemo } from "react";
import "twin.macro";
import "styled-components/macro";
import ResourceContext from "../../../ResourceContext";
import { Select } from "@madie/madie-design-system/dist/react";
import { IconButton, MenuItem, Tooltip, InputLabel } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  ResourceActionType,
  useQiCoreResource,
} from "../../../../../../../../../util/QiCorePatientProvider";
import AddElementButton from "../../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { useFormikContext } from "formik";
import {
  buildMadieResourceFromResourceIdentifier,
  removeUndefinedProperties,
} from "../../../../../../../../../api/fhirDefinitionServiceUtilities";
import AddNewReferenceDialog from "./AddNewReferenceDialog";
import {
  findProfileUrlFromReferenceType,
  getSpecificResourceOptions,
  getReferenceComponentLabel,
  getReferenceTypeOptions,
  getProfilesForResourceType,
  getAddNewProfileOptions,
  ResourceProfile,
} from "./referenceUtils";

export {
  getSpecificResourceOptions,
  getHighestPriorityResourceList,
  getProfileMatchTypes,
  getReferenceComponentLabel,
} from "./referenceUtils";

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
  resource,
}: any) {
  const { dispatch, state } = useQiCoreResource();
  const formikContext = useFormikContext();
  // First dropdown Utilities
  const allResourceProfiles = useContext(ResourceContext); // get all profiles loaded from builder

  const [open, setOpen] = useState<boolean>(false);
  const [selectedProfileAddNew, setSelectedProfileAddNew] = useState(null);

  const referenceTypeOptions = useMemo(
    () =>
      getReferenceTypeOptions(
        structureDefinition,
        allResourceProfiles as ResourceProfile[] | undefined
      ),
    [allResourceProfiles, structureDefinition]
  );

  const [selectedReferenceId, setSelectedReferenceId] = useState<string>(
    value?.reference || ""
  ); // default to existing reference while editing

  const [selectedReferenceType, setSelectedReferenceType] = useState<string>(
    value?.reference?.split("/")?.[0] || ""
  ); // default to existing type while editing

  // Profiles available for the currently selected reference type;
  // used to drive the "Add New" flow and its options.
  const finalList = useMemo(
    () =>
      getProfilesForResourceType(
        selectedReferenceType,
        allResourceProfiles as ResourceProfile[] | undefined
      ),
    [allResourceProfiles, selectedReferenceType]
  );

  // The first profile option in the final list; used as the default when triggering the "Add New" flow.
  const finalResourceOptionForAddNew = finalList[0];
  const addNewProfileOptions = useMemo(
    () => getAddNewProfileOptions(finalList),
    [finalList]
  );

  // Store selected profile URL instead of just type
  const [selectedProfileUrl, setSelectedProfileUrl] = useState<string>(
    value?.reference || ""
  );

  // specific options for the second dropdown, based on the selected reference type
  const specificResourceOptions = useMemo(
    () =>
      getSpecificResourceOptions(
        selectedReferenceType,
        selectedProfileUrl,
        state.bundle.entry,
        resource
      ),
    [resource, selectedProfileUrl, selectedReferenceType, state.bundle.entry]
  );

  // this appears to be unavoidable to prevent stale state from switching between two references.
  useEffect(() => {
    const newType = value?.reference?.split("/")?.[0] || "";
    const newId = value?.reference || "";

    // Initialize selectedProfileUrl - derive it from the reference type if it exists
    const initialProfileUrl = findProfileUrlFromReferenceType(
      newType,
      referenceTypeOptions
    );
    // Only sync the type/profile from the incoming reference when we can
    // resolve a profile for it. The `value` prop (spread from the parent's
    // formik.getFieldProps) can lag a render behind formikContext.values, so a
    // transient empty reference would otherwise clear a valid user selection
    // (resetting the Reference Type dropdown).
    if (initialProfileUrl) {
      setSelectedReferenceType(newType);
      setSelectedProfileUrl(initialProfileUrl);
    }
    // Once the referenced resource actually exists in the bundle it shows up as
    // a concrete option in the second ("Specify") dropdown. When that happens we
    // must reflect it as the selected value even if we were still displaying the
    // "ID Not Present (Add New)" earmark - otherwise the dropdown stays pinned to
    // "add_new_id" and never populates with the newly added resource. This also
    // covers the case where `value.reference` did not change across an
    // apply/re-initialize (same reference string) but the option list did.
    const referencedResourceIsInBundle =
      !!newId && specificResourceOptions.some((opt) => opt.value === newId);

    // if the earmark is present, we do not want to update our local state -
    // unless the referenced resource is now present in the bundle (committed).
    const addNewResources = formikContext.values["add_new_resources"] || [];
    if (referencedResourceIsInBundle || addNewResources.length === 0) {
      setSelectedReferenceId(newId);
    }
    // Re-sync when the incoming reference string, the loaded profile options, or
    // the available specific-resource options change (e.g. the new resource was
    // committed to the bundle) - not on every formik value change, which caused
    // the Reference Type box to reset while selecting a value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.reference, referenceTypeOptions, specificResourceOptions]);

  const triggerAddNewFlow = () => {
    // what's the list length of possible profiles of type per model
    if (!finalResourceOptionForAddNew) {
      // No matching profile bucket (e.g. unmapped reference type) - nothing to build
      return;
    }
    const newMadieResource = buildMadieResourceFromResourceIdentifier(
      finalResourceOptionForAddNew
    );
    // Append to array instead of overwriting - supports multiple "Add New" references
    const existingResources = formikContext.values["add_new_resources"] || [];
    formikContext.setFieldValue("add_new_resources", [
      ...existingResources,
      newMadieResource,
    ]);
    formikContext.setFieldValue(
      `${label}.reference`,
      `${selectedReferenceType}/${newMadieResource.resource.id}`
    );
    setSelectedReferenceId("add_new_id");
  };
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
          options={referenceTypeOptions.map((opt, i) => (
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
            const item = referenceTypeOptions.find(
              (item) => item.profile === selected
            );
            return item?.label || "Select";
          }}
          onChange={(e) => {
            setSelectedProfileUrl(e.target.value);
            // Find the resource type for the selected profile URL
            const selectedProfile = referenceTypeOptions.find(
              (opt) => opt.profile === e.target.value
            );
            setSelectedReferenceType(selectedProfile?.value || "");
            setSelectedReferenceId("");
          }}
          helperText={helperText}
          error={error}
        />
        {canEdit && (
          <div tw="mt-5 flex items-center">
            {showDeleteButton && (
              <Tooltip title="Delete" placement="top" arrow>
                <span>
                  <IconButton
                    onClick={handleDeleteElement}
                    data-testid={`delete-button-${label}`}
                    aria-label={`delete ${label}`}
                    size="small"
                  >
                    <DeleteOutlineIcon fontSize="small" color="error" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {showAddAttributeButton && (
              <AddElementButton name={addTitle} onClick={handleAddElement} />
            )}
          </div>
        )}
      </div>
      {/* Select a specific resource from the selected reference type, from tc json */}
      {/* in case of label: AdverseEvent.recorder, this select would be AdverseEvent.recorder.reference */}
      {selectedReferenceType && (
        <div className="element-editor-add-row reference">
          <Select
            label={`Specify ${
              referenceTypeOptions.find(
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
            options={specificResourceOptions.map((opt, i) => (
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
                // Only prompt for a profile when the selection could resolve to
                // more than one. QI-Core is the most specific model (derived from
                // us-core, which derives from base FHIR). For a base FHIR / us-core
                // target, look up the most specific available profiles; if more
                // than one exists, open the dialog so the user can choose.
                // A QI-Core target is already the most specific, so never prompt.
                if (selectedProfileUrl.includes("qicore")) {
                  triggerAddNewFlow();
                } else if (finalList?.length > 1) {
                  setOpen(true);
                } else {
                  // Only one profile available for this type - build it directly
                  triggerAddNewFlow();
                }
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
              const item = specificResourceOptions.find(
                (item) => item.value === selected
              );
              return item?.label || "Select";
            }}
            value={selectedReferenceId}
            helperText={helperText}
            error={error}
          />
          <div />
        </div>
      )}
      <AddNewReferenceDialog
        open={open}
        profileOptions={addNewProfileOptions}
        selectedProfile={selectedProfileAddNew}
        onClose={() => {
          setOpen(false);
          setSelectedProfileAddNew(null);
        }}
        onSelectProfile={setSelectedProfileAddNew}
        onSubmit={(e) => {
          e.stopPropagation();
          e.preventDefault();

          const selectedProfile = finalList.find(
            (item) => item.profile === selectedProfileAddNew
          );
          if (!selectedProfile) return;

          const newMadieResource =
            buildMadieResourceFromResourceIdentifier(selectedProfile);
          formikContext.setFieldValue(
            `${label}.reference`,
            `${selectedReferenceType}/${newMadieResource.resource.id}`
          );

          const formikCleanedValues = removeUndefinedProperties(
            formikContext.values
          );
          dispatch({
            type: ResourceActionType.ADD_RESOURCE_BY_REFERENCE,
            payload: {
              bundleEntry: formikCleanedValues,
              add_new_resources: [newMadieResource],
            },
          });
          setOpen(false);
        }}
      />
    </>
  );
}
