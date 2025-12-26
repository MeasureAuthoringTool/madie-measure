import DOMPurify from "dompurify";
import { PopulationExpectedValue, PopulationType } from "@madie/madie-models";

export const sanitizeUserInput = (input) => {
  let clean = input;

  if (input != null && input.length > 0) {
    clean = DOMPurify.sanitize(input);

    clean = clean
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  }
  return clean;
};

export const truncateInput = (input, length) => {
  if (input != null && input.trim() !== "" && input.length > length) {
    return input.substring(0, length);
  }
  return input;
};

export const isTestCasePopulationObservation = (
  population: PopulationExpectedValue
) => {
  return (
    population.name === PopulationType.MEASURE_OBSERVATION ||
    population.name === PopulationType.MEASURE_POPULATION_OBSERVATION ||
    population.name === PopulationType.NUMERATOR_OBSERVATION ||
    population.name === PopulationType.DENOMINATOR_OBSERVATION
  );
};

const getBoolean = (value: string | boolean | null | undefined): boolean => {
  if (typeof value === "boolean") return value;
  if (!value) return false;
  return value.toString().trim().toLowerCase() === "true";
};

export const isDebugMode = () => {
  return (
    getBoolean(localStorage.getItem("madieDebug")) ||
    getBoolean((window as any).madieDebug)
  );
};

export class MadieError extends Error {
  constructor(message: string) {
    super(message);
  }
}
