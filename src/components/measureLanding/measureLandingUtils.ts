export function getTabStorageKey(tab: number): string {
  if (tab === 0) {
    return "ownedMeasuresPageOptions";
  }
  if (tab === 1) {
    return "sharedMeasuresPageOptions";
  }
  return "allMeasuresPageOptions";
}
