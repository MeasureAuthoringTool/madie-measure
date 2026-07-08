export enum ProfileDisplayMode {
  ALL = "ALL",
  RELEVANT = "RELEVANT",
}

export const getProfileDisplayModeStorageKey = (measureId: string) =>
  `available-elements-profile-mode-${measureId}`;

export const getProfileDisplayMode = (
  measureId: string
): ProfileDisplayMode => {
  const savedMode = localStorage.getItem(
    getProfileDisplayModeStorageKey(measureId)
  );

  if (
    savedMode === ProfileDisplayMode.ALL ||
    savedMode === ProfileDisplayMode.RELEVANT
  ) {
    return savedMode;
  }

  return ProfileDisplayMode.RELEVANT;
};

export const saveProfileDisplayMode = (
  measureId: string,
  mode: ProfileDisplayMode
): void => {
  localStorage.setItem(getProfileDisplayModeStorageKey(measureId), mode);
};
