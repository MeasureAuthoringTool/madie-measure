library MAT6197UCUMAnnotations version '0.0.000'

using QDM version '5.6'

include MATGlobalCommonFunctionsQDM version '1.0.000' called Global

valueset "Antithrombotic Therapy for Ischemic Stroke": 'urn:oid:2.16.840.1.113762.1.4.1110.62'
valueset "ONC Administrative Sex": 'urn:oid:2.16.840.1.113762.1.4.1'
valueset "Payer": 'urn:oid:2.16.840.1.114222.4.11.3591'
valueset "Race": 'urn:oid:2.16.840.1.114222.4.11.836'

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