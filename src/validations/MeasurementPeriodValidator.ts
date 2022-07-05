import { isWithinInterval } from "date-fns";
import * as Yup from "yup";

export const MeasurementPeriodValidator = Yup.object().shape({
  measurementPeriodStart: Yup.date()
    .required("Required")
    .typeError("Invalid date format. (mm/dd/yyyy)")
    .nullable()
    .test(
      "measurementPeriodStart",
      "Start date should be between the years 1900 and 2099.",
      (measurementPeriodStart) => {
        return isWithinInterval(measurementPeriodStart?.getFullYear(), {
          start: 1900,
          end: 2099,
        });
      }
    ),

  measurementPeriodEnd: Yup.date()
    .required("Required")
    .nullable()
    .typeError("Invalid date format. (mm/dd/yyyy)")
    .test(
      "measurementPeriodStart",
      "End date should be between the years 1900 and 2099.",
      (measurementPeriodEnd) => {
        return isWithinInterval(measurementPeriodEnd?.getFullYear(), {
          start: 1900,
          end: 2099,
        });
      }
    )
    .when("measurementPeriodStart", (measurementPeriodStart, schema) => {
      if (measurementPeriodStart !== null) {
        if (!isNaN(measurementPeriodStart.getTime())) {
          return schema.min(
            new Date(measurementPeriodStart.getTime()),
            "Measurement period end date should be greater than or equal to measurement period start date."
          );
        }
      }
      return schema;
    }),
});
