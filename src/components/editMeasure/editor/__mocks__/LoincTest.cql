library MAT6197UCUMAnnotations version '0.0.000'

using QDM version '5.6'

include MATGlobalCommonFunctionsQDM version '1.0.000' called Global

codesystem "LOINC": 'urn:oid:2.16.840.1.113883.6.1' 

code "Birth date": '21112-8' from "LOINC" display 'Birth date'

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