import React from "react";
import { RadioGroup, Radio, FormControlLabel } from "@mui/material";
import { ProfileDisplayMode } from "./ProfileDisplayMode";

export interface ProfileDisplayToggleProps {
  mode: ProfileDisplayMode;
  allProfileCount: number;
  relevantProfileCount: number;
  onChange: (mode: ProfileDisplayMode) => void;
  showRelevantProfiles?: boolean;
}

const ProfileDisplayToggle = ({
  mode,
  allProfileCount,
  relevantProfileCount,
  onChange,
  showRelevantProfiles = true,
}: ProfileDisplayToggleProps) => {
  return (
    <RadioGroup
      row
      value={mode}
      onChange={(event) => onChange(event.target.value as ProfileDisplayMode)}
      data-testid="profile-display-toggle"
    >
      <FormControlLabel
        value={ProfileDisplayMode.ALL}
        control={<Radio data-testid="all-profiles-radio" size="small" />}
        label={`All Profiles (${allProfileCount})`}
        data-testid="all-profiles-option"
      />
      {showRelevantProfiles && (
        <FormControlLabel
          value={ProfileDisplayMode.RELEVANT}
          control={<Radio data-testid="relevant-profiles-radio" size="small" />}
          label={`Measure-relevant profiles (${relevantProfileCount})`}
          data-testid="relevant-profiles-option"
        />
      )}
    </RadioGroup>
  );
};

export default ProfileDisplayToggle;
