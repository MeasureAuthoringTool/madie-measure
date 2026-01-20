export const getMultipleCardinalityLabel = (originalLabel: string): string => {
  let result = originalLabel;
  if (!originalLabel) {
    return "";
  } else if (
    originalLabel.includes("Repeat.When[") ||
    originalLabel.includes("Repeat.Day of Week[") ||
    originalLabel.includes("Repeat.Time of Day[")
  ) {
    // TimingComponent has CodesComponent that uses label: Repeat.When[${index}] and Repeat.Day of Week[${index}]
    // TimingComponent has TimeComponent that uses label: Repeat.Time of Day[${index}]
    return originalLabel;
  } else {
    // Check if path ends with array index like "ClaimResponse.item[0]"
    // or has nested arrays like "ClaimResponse.addItem[1].itemSequence[0]"
    const arrayIndexMatch = result.match(/\.([a-zA-Z]+)\[(\d+)\]$/);
    if (arrayIndexMatch) {
      // Split camel case and capitalize each word
      const words = arrayIndexMatch[1]
        .replace(/([A-Z])/g, " $1")
        .trim()
        .split(" ");
      result = words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      // Add incremented index (Item Sequence 1)
      result += " " + (parseInt(arrayIndexMatch[2], 10) + 1);
      return result;
    }

    // Check if path has array index followed by property like "Patient.photo[0].data"
    // or "ClaimResponse.item[0].adjudication[0].category"
    const arrayWithPropertyMatch = result.match(/\[\d+\]\.([^\.]+)$/);
    if (arrayWithPropertyMatch) {
      // Extract just the property name after the array index
      const propertyName = arrayWithPropertyMatch[1];
      // Split camel case and capitalize each word
      const words = propertyName
        .replace(/([A-Z])/g, " $1")
        .trim()
        .split(" ");
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }

    // For paths without array indices, extract the last segment
    const lastSegment = result.split(".").pop() || result;

    // Check if the segment is all uppercase (likely an acronym like OID, URI, URL)
    // but not a single letter
    if (
      lastSegment.length > 1 &&
      lastSegment === lastSegment.toUpperCase() &&
      /^[A-Z]+$/.test(lastSegment)
    ) {
      // Keep acronyms as-is
      return lastSegment;
    }

    // Split camel case and capitalize each word
    const words = lastSegment
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(" ");
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
};
