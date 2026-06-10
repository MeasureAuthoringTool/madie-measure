export function formatOwner(
  displayName: string | undefined,
  harpId: string | undefined
): string {
  if (!harpId) return "-";
  if (!displayName || displayName === "-" || displayName === harpId)
    return harpId;
  return `${displayName} (${harpId})`;
}
