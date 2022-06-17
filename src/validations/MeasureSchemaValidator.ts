import * as Yup from "yup";
import { Model } from "@madie/madie-models";
import { isWithinInterval } from "date-fns";

export const MeasureSchemaValidator = Yup.object().shape({
  measureName: Yup.string()
    .max(500, "A Measure name cannot be more than 500 characters.")
    .required("A Measure name is required.")
    .matches(/[a-zA-Z]/, "A Measure name must contain at least one letter.")
    .matches(/^((?!_).)*$/, "Measure Name must not contain '_' (underscores)."),
  model: Yup.string()
    .oneOf(Object.values(Model))
    .required("A Measure model is required."),
  cqlLibraryName: Yup.string()
    .required("Measure library name is required.")
    .matches(
      /^((?!_).)*$/,
      "Measure library name must not contain '_' (underscores)."
    )
    .matches(
      /^[A-Z][a-zA-Z0-9]*$/,
      "Measure library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
    ),

  measurementPeriodStart: Yup.date()
    .required("Measurement period start date is required")
    .typeError("Invalid date format. (mm/dd/yyyy)")
    .nullable()
    .test(
      "measurementPeriodStart",
      "Start date should be between the years 1900 and 2099.",
      (measurementPeriodStart) => {
        return isWithinInterval(measurementPeriodStart, {
          start: new Date(1899, 12, 31),
          end: new Date(2100, 1, 1),
        });
      }
    ),

  measurementPeriodEnd: Yup.date()
    .required("Measurement period end date is required")
    .nullable()
    .typeError("Invalid date format. (mm/dd/yyyy)")
    .test(
      "measurementPeriodStart",
      "End date should be between the years 1900 and 2099.",
      (measurementPeriodEnd) => {
        return isWithinInterval(measurementPeriodEnd, {
          start: new Date(1899, 12, 31),
          end: new Date(2100, 1, 1),
        });
      }
    )
    .when("measurementPeriodStart", (measurementPeriodStart, schema) => {
      if (measurementPeriodStart !== null) {
        if (!isNaN(measurementPeriodStart.getTime())) {
          const dayAfter = new Date(
            measurementPeriodStart.getTime() + 86400000
          );
          return schema.min(
            dayAfter,
            "Measurement period end date should be greater than measurement period start date."
          );
        }
      }
      return schema;
    }),
});
