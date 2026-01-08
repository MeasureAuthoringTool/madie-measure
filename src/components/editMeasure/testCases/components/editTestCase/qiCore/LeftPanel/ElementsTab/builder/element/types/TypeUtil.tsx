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
    //e.g. ClaimResponse.addItem[0].itemSequence[0]
    const match = result.match(/\.([a-zA-Z]+)\[(\d+)\]$/);
    if (match) {
      // Split camel case and capitalize each word
      const words = match[1]
        .replace(/([A-Z])/g, " $1")
        .trim()
        .split(" ");
      result = words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      // Add incremented index
      result += " " + (parseInt(match[2], 10) + 1); // Item Sequence 1
    }
  }
  return result;
};
