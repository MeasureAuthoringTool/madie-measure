export default function versionErrorHelper(errorMessage: string): string {
  let humanReadbleOutput =
    "An unexpected error has occurred. Please contact the help desk.";
  // "User [{}] attempted to version measure with id [{}] Measure is not in a draft state",
  if (errorMessage.includes("draft state")) {
    humanReadbleOutput =
      "Please ensure the measure is first in draft state before versioning this measure.";
  }
  // "User [{}] attempted to version measure with id [{}] Measure has CQL errors",
  if (errorMessage.includes("CQL errors")) {
    humanReadbleOutput =
      "Please include valid CQL in the CQL editor to version before versioning this measure.";
  }
  // "User [{}] attempted to version measure with id [{}] Measure has no CQL",
  if (errorMessage.includes("no CQL")) {
    humanReadbleOutput =
      "Please include valid CQL in the CQL editor to version before versioning this measure.";
  }
  // "User [{}] attempted to version measure with id [{}] Measure has invalid test cases."
  if (errorMessage.includes("invalid test case")) {
    humanReadbleOutput =
      "Please include valid test cases to version before versioning this measure.";
  }
  console.log("create lint issue")
  return humanReadbleOutput;
}
