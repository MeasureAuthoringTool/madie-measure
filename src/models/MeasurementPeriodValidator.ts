import moment from "moment";
import * as Yup from "yup";

export const MeasurementPeriodValidator = Yup.object().shape({
  measurementPeriodStart: Yup.date()
    .typeError("Invalid date format. (mm/dd/yyyy)")
    .nullable()
    .required("Required")
    .test(
      "measurementPeriodStart",
      "Measurement periods should be between the years 1990 and 2099.",
      (measurementPeriodStart) => {
        return moment(measurementPeriodStart).isBetween(
          "1899-12-31",
          "2100-01-01"
        );
      }
    ),

  measurementPeriodEnd: Yup.date()
    .required("Required")
    .nullable()
    .typeError("Invalid date format. (mm/dd/yyyy)")
    .test(
      "measurementPeriodStart",
      "Measurement periods should be between the years 1990 and 2099.",
      (measurementPeriodStart) => {
        return moment(measurementPeriodStart).isBetween(
          "1899-12-31",
          "2100-01-01"
        );
      }
    )

    //method 1
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

  //Method 2 works but doesn't check for equal date condition
  //   .min(
  //     Yup.ref("measurementPeriodStart"),
  //     "End date has to be more than start date"
  //  )

  //Method 3 need to work:
  // .test("measurementPeriodEnd","Measurement periods should be between the years 1990 and 2099.",(measurementPeriodStart,measurementPeriodEnd)=>{
  //   return moment(measurementPeriodStart).isBefore(measurementPeriodEnd)
  // })

  //Method 4 need to work:

  // .when('startTime', (measurementPeriodEnd, schema: Yup.DateSchema) => {
  //   return schema.test(
  //     'start-time-past',
  //     'End Time should be ahead of Start Time',
  //     (measurementPeriodStart,schema) => {
  //      //console.log(schema.min(measurementPeriodStart))
  //       return schema.isAfter(measurementPeriodEnd, measurementPeriodStart);
  //   });
  // })
});
