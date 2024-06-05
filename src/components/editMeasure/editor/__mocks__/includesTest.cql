library MAT6197UCUMAnnotations version '0.0.000'

using QDM version '5.6'

include MATGlobalCommonFunctionsQDM version '1.0.000' called Global

parameter "Measurement Period" Interval<DateTime>

context Patient

define "Denominator":
  "Initial Population"

define "Initial Population":
  "Inpatient Encounters"

define "Numerator":
  "Initial Population"


define "Inpatient Encounters":
  true