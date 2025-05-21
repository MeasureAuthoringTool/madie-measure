// given a table row we want to get all the information we care about
export function getAttributes(row) {
  return Object.entries(row.resource || {})
    .filter(
      ([key, value]) =>
        key !== "resourceType" && key !== "id" && value != null && value !== ""
    )
    .map(([key]) => key);
}

// given data, find the total max attributes.
export function getMaxAttributes(data) {
  return Math.max(
    ...data.map(
      (entry) =>
        Object.entries(entry.resource || {}).filter(
          ([key, value]) =>
            key !== "resourceType" &&
            key !== "id" &&
            value != null &&
            value !== ""
        ).length
    )
  );
}
