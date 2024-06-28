library MAT6197UCUMAnnotations version '0.0.000'

using QDM version '5.6'

include MATGlobalCommonFunctionsQDM version '1.0.000' called Global

codesystem "CPT": 'urn:oid:2.16.840.1.113883.6.12'
codesystem "RXNORM": 'urn:oid:2.16.840.1.113883.6.88'

valueset "Antithrombotic Therapy for Ischemic Stroke": 'urn:oid:2.16.840.1.113762.1.4.1110.62'
valueset "Ethnicity": 'urn:oid:2.16.840.1.114222.4.11.837'
valueset "ONC Administrative Sex": 'urn:oid:2.16.840.1.113762.1.4.1'
valueset "Payer": 'urn:oid:2.16.840.1.114222.4.11.3591'
valueset "Race": 'urn:oid:2.16.840.1.114222.4.11.836'

code "Mifeprex Pill": '1178689' from "RXNORM" display 'Mifeprex Pill'

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