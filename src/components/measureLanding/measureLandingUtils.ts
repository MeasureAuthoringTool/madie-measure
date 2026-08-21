export function getTabStorageKey(tab: number): string {
  if (tab === 0) {
    return "ownedMeasuresPageOptions";
  }
  if (tab === 1) {
    return "sharedMeasuresPageOptions";
  }
  if (tab === 3) {
    return "allReviewsPageOptions";
  }
  return "allMeasuresPageOptions";
}
