import React, { useContext, useEffect, useState, useMemo } from "react";
import "twin.macro";
import "styled-components/macro";
import ResourceContext from "../../ResourceContext";
import { Select, MadieDialog } from "@madie/madie-design-system/dist/react";
import { IconButton, MenuItem, Tooltip, InputLabel } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  ResourceActionType,
  useQiCoreResource,
} from "../../../../../../../../util/QiCorePatientProvider";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { useFormikContext } from "formik";
import {
  buildMadieResourceFromResourceIdentifier,
  removeUndefinedProperties,
} from "../../../../../../../../api/fhirDefinitionServiceUtilities";
import * as _ from "lodash";
import "./ReferenceComponent.scss";

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
    return qiCoreProfiles;
  } else if (usCoreProfiles.length > 0) {
    return usCoreProfiles;
  } else {
    return baseFhirProfiles;
  }
};

// Helper function to determine profile match type and hierarchy
export const getProfileMatchTypes = (profileUrl) => {
  if (profileUrl.includes("/fhir/us/qicore")) return ["/fhir/us/qicore"];
  if (profileUrl.includes("/fhir/us/core"))
    return ["/fhir/us/core", "/fhir/us/qicore"];
  if (profileUrl.includes("/fhir/StructureDefinition/"))
    return ["/fhir/StructureDefinition/", "/fhir/us/core/", "/fhir/us/qicore/"];
  return [];
};

// Helper function to find the profile URL from reference type
const findProfileUrlFromReferenceType = (
  referenceType: string,
  resourceProfileOptions: any
) => {
  if (!referenceType || resourceProfileOptions.length === 0) return "";

  // Find the matching profile option based on the resource type
  const matchingOption = resourceProfileOptions.find(
    (opt) => opt.value === referenceType
  );

  return matchingOption?.profile || "";
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
  const { dispatch, state } = useQiCoreResource();
  const formikContext = useFormikContext();
  // First dropdown Utilities
  const allResourceProfiles = useContext(ResourceContext); // get all profiles loaded from builder

  const [open, setOpen] = useState<boolean>(false);
  const [selectedProfileAddNew, setSelectedProfileAddNew] = useState(null);

  const resourceProfileOptions = useMemo(() => {
    const targetProfiles =
      structureDefinition.type?.find(
        (type: { code: string }) => type.code === "Reference"
      )?.targetProfile || [];

    return (
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
        })) || []
    );
  }, [allResourceProfiles, structureDefinition.type]);

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
  // specificity qi-core -> us-core -> base fhir
  // if us-core selected, check to see if qi-core is available as well

  const finalList = getHighestPriorityResourceList(
    qiCoreProfiles,
    usCoreProfiles,
    baseFhirProfiles
  );

  const finalResourceOptionForAddNew = finalList[0];
  const finalListMappedOptions = finalList.map((res) => ({
    label: res.title,
    value: res.profile,
  }));

  const emptyOption = [
    { label: "ID Not Present (Add New)", value: "add_new_id" },
  ]; // If no resources of that type exist, we need to show a message in the dropdown

  // Store selected profile URL instead of just type
  const [selectedProfileUrl, setSelectedProfileUrl] = useState<string>(
    value?.referenceProfileUrl || ""
  );

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

    // Initialize selectedProfileUrl - derive it from the reference type if it exists
    const initialProfileUrl = findProfileUrlFromReferenceType(
      newType,
      resourceProfileOptions
    );
    setSelectedProfileUrl(initialProfileUrl);
    // if the earmark is present, we do not want to update our local state.
    const addNewResources = formikContext.values["add_new_resources"] || [];
    if (addNewResources.length === 0) {
      setSelectedReferenceId(newId);
    }
  }, [value, formikContext.values]); // Use formikContext.values for dependency

  const triggerAddNewFlow = () => {
    // what's the list length of possible profiles of type per model
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
                // WE WANT TO open the dialog only in the case that our selection has greater levels of specificity available.
                // Qi-Core is an implementation derived from us-core, which is derived from fhir at the most basal resource type.
                // say we choose a base fhir type, find most specific list QI-core, us-Core, fhir. If most specific list has more than 1 item, open dropdown
                // If we slect a qi-core profile type, no dropdown should ever open. It is the most specific
                if (selectedProfileUrl.includes("qicore")) {
                  triggerAddNewFlow();
                } else if (finalList?.length > 1) {
                  setOpen(true);
                } else {
                  // what's the list length of possible profiles of type per model
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
      <MadieDialog
        form
        title="Choose Profile"
        dialogProps={{
          onClose: () => {
            setOpen(false);
            setSelectedProfileAddNew(null);
          },
          open,
          // apply the profile
          onSubmit: (e) => {
            e.stopPropagation();
            e.preventDefault();
            const selectedProfile = finalList.find(
              (item) => item.profile === selectedProfileAddNew
            );
            // generate single resource
            const newMadieResource =
              buildMadieResourceFromResourceIdentifier(selectedProfile);
            // document the resource id and type on current resource
            formikContext.setFieldValue(
              `${label}.reference`,
              `${selectedReferenceType}/${newMadieResource.resource.id}`
            );
            // simulate what we're doing with the individual apply click.
            // clean the values like normal
            const formikCleanedValues = removeUndefinedProperties(
              formikContext.values
            );
            // dispatch our event to modify our current bundle entry (formik.values), with the resource we want to add.
            dispatch({
              type: ResourceActionType.ADD_RESOURCE_BY_REFERENCE,
              payload: {
                bundleEntry: formikCleanedValues,
                add_new_resources: [newMadieResource],
              },
            });
            // append
            setSelectedReferenceId("add_new_id");
            setOpen(false);
          },
          maxWidth: "sm",
          fullWidth: true,
        }}
        cancelButtonProps={{
          variant: "secondary",
          cancelText: "Cancel",
          "data-testid": "add-new-profile-ref-cancel-button",
        }}
        continueButtonProps={{
          variant: "cyan",
          type: "submit",
          "data-testid": "add-new-profile-ref-save-button",
          disabled: !selectedProfileAddNew,
          continueText: "Save",
        }}
      >
        <div data-testid="add-new-profile-ref" id="add-new-profile-ref">
          <Select
            label="Reference"
            name="Reference"
            options={finalListMappedOptions.map((opt, i) => (
              <MenuItem
                key={`${opt.label}-${opt.value}-${i}`}
                data-testid={`${opt.value}-option`}
                value={opt.value}
              >
                {opt.label}
              </MenuItem>
            ))}
            onChange={(e) => {
              setSelectedProfileAddNew(e.target.value);
            }}
            value={selectedProfileAddNew}
            renderValue={(selected) => {
              // Find the corresponding label for the selected value
              const item = finalListMappedOptions.find(
                (item) => item.value === selected
              );
              return item?.label || "Select";
            }}
          />
        </div>
      </MadieDialog>
    </>
  );
}
