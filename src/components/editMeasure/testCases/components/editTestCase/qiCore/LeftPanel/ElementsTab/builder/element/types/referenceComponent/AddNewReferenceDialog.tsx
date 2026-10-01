import React from "react";
import { MadieDialog, Select } from "@madie/madie-design-system/dist/react";
import { MenuItem } from "@mui/material";
import { ReferenceOption } from "./referenceUtils";

type AddNewReferenceDialogProps = {
  open: boolean;
  profileOptions: ReferenceOption[];
  selectedProfile: string | null;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSelectProfile: (profile: string) => void;
};

export default function AddNewReferenceDialog({
  open,
  profileOptions,
  selectedProfile,
  onClose,
  onSubmit,
  onSelectProfile,
}: AddNewReferenceDialogProps) {
  return (
    <MadieDialog
      form
      title="Choose Profile"
      dialogProps={{
        onClose,
        open,
        onSubmit,
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
        disabled: !selectedProfile,
        continueText: "Save",
      }}
    >
      <div
        data-testid="add-new-profile-ref"
        id="add-new-profile-ref"
        style={{ maxWidth: "350px" }}
      >
        <Select
          label="Reference"
          name="Reference"
          options={profileOptions.map((option, index) => (
            <MenuItem
              key={`${option.label}-${option.value}-${index}`}
              data-testid={`${option.value}-option`}
              value={option.value}
            >
              {option.label}
            </MenuItem>
          ))}
          onChange={(event) => onSelectProfile(event.target.value)}
          value={selectedProfile}
          renderValue={(selected) =>
            profileOptions.find((option) => option.value === selected)?.label ||
            "Select"
          }
        />
      </div>
    </MadieDialog>
  );
}
