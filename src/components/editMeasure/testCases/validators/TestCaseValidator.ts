import * as Yup from "yup";
import { PopulationType } from "@madie/madie-models";

const validateExpectedValue = function (
  value,
  populationBasis,
  populationName
) {
  const observations = [
    PopulationType.MEASURE_POPULATION_OBSERVATION,
    PopulationType.NUMERATOR_OBSERVATION,
    PopulationType.DENOMINATOR_OBSERVATION,
  ];

  if (value === undefined || value === null) {
    return true;
  }

  if (populationBasis === "boolean") {
    return typeof value === "boolean"
      ? true
      : this.createError({
          message: "Expected value type must match population basis type",
        });
  }

  const allowDecimals = observations.includes(populationName);

  if (!isNaN(+value) && +value >= 0) {
    if (
      !allowDecimals &&
      (!Number.isInteger(+value) || String(value).includes("."))
    ) {
      return this.createError({
        message:
          "Decimals values cannot be entered in the population expected values",
      });
    }

    return true;
  }

  return this.createError({
    message:
      "Only positive numeric values can be entered in the expected values",
  });
};

const CompositeExpectedSchema = Yup.mixed().test(
  "compositeExpected",
  "Invalid value",
  function (value) {
    return validateExpectedValue.call(this, value, "integer", "COMPOSITE");
  }
);
const ScoreSchema = Yup.object({
  expected: CompositeExpectedSchema,
  actual: Yup.number()
    .min(0, "Value must be greater than or equal to 0")
    .nullable(),
});

const PositiveNumberSchema = Yup.mixed().test(
  "positiveNumber",
  "Only positive numeric values can be entered in the expected values",
  function (value) {
    if (value === undefined || value === null || value === "") {
      return true;
    }

    if (!isNaN(+value) && +value >= 0) {
      return true;
    }

    return this.createError({
      message:
        "Only positive numeric values can be entered in the expected values",
    });
  }
);

const WholePositiveNumberSchema = Yup.mixed().test(
  "wholePositiveNumber",
  "Only positive numeric values can be entered in the expected values",
  function (value) {
    if (value === undefined || value === null || value === "") {
      return true;
    }

    if (isNaN(+value) || +value < 0) {
      return this.createError({
        message:
          "Only positive numeric values can be entered in the expected values",
      });
    }

    if (!Number.isInteger(+value) || String(value).includes(".")) {
      return this.createError({
        message:
          "Decimals values cannot be entered in the population expected values",
      });
    }

    return true;
  }
);

const CompositeScoreExpectedValueSchema = Yup.object({
  denominatorScore: Yup.object({
    expected: WholePositiveNumberSchema,
  }),
  numeratorScore: Yup.object({
    expected: PositiveNumberSchema,
  }),
  compositeScore: Yup.object({
    expected: PositiveNumberSchema,
  }),
});
export const TestCaseValidator = Yup.object().shape({
  title: Yup.string()
    .required("Test Case Title is required.")
    .matches(/[a-zA-Z]/, "Test Case Title is required.")
    .max(250, "Test Case Title cannot be more than 250 characters."),
  description: Yup.string()
    .max(250, "Test Case Description cannot be more than 250 characters.")
    .nullable(),
  series: Yup.string()
    .max(250, "Test Case Group cannot be more than 250 characters.")
    .nullable(),
  groupPopulations: Yup.array()
    .of(
      Yup.object()
        .shape({
          populationBasis: Yup.string().nullable(),
          populationValues: Yup.mixed().when(
            ["populationBasis"],
            (populationBasis) => {
              return Yup.array()
                .of(
                  Yup.object()
                    .shape({
                      name: Yup.string().nullable(),
                      expected: Yup.mixed().test(
                        "testExpectedTypes",
                        "Expected value type must match population basis type",
                        // must use old school "function" instead of lambda to
                        // get access to "this" that is used to create error
                        function (value, population) {
                          return validateExpectedValue.call(
                            this,
                            value,
                            populationBasis,
                            population.parent.name
                          );
                        }
                      ),
                    })
                    .nullable()
                )
                .nullable();
            }
          ),
          compositeScoreValues: CompositeScoreExpectedValueSchema.nullable(),
        })
        .nullable()
    )
    .nullable(),
});
