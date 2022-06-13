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
        return isWithinInterval(measurementPeriodStart, {
          start: new Date(1899, 12, 31),
          end: new Date(2100, 1, 1),
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
        return isWithinInterval(measurementPeriodEnd, {
          start: new Date(1899, 12, 31),
          end: new Date(2100, 1, 1),
        });
      }
    )
    .when("measurementPeriodStart", (measurementPeriodStart, schema) => {
      if (measurementPeriodStart !== null) {
        if (!isNaN(measurementPeriodStart.getTime())) {
          const dayAfter = new Date(measurementPeriodStart.getTime());
          return schema.min(
            dayAfter,
            "Measurement period end date should be greater than or equal to measurement period start date."
          );
        }
      }
      return schema;
    }),
});
