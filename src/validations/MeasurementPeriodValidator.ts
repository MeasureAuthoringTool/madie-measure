import * as Yup from "yup";
import { isWithinInterval } from "date-fns";

export const MeasurementPeriodValidator = Yup.object().shape({
  measurementPeriodStart: Yup.date()
    .required("Measurement period start date is required")
    .nullable()
    .typeError("Invalid date format. (mm/dd/yyyy)")
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
        if (!isNaN(measurementPeriodStart?.getTime())) {
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
