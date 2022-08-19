export const MeasureCQL = `library EXM108reduced version '0.3.004'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.001' called FHIRHelpers
include SupplementalDataElementsFHIR4 version '2.0.000' called SDE
include MATGlobalCommonFunctionsFHIR4 version '5.0.000' called Global
include TJCOverallFHIR4 version '5.0.000' called TJC

codesystem "LOINC": 'http://loinc.org' 
codesystem "SNOMEDCT": 'http://snomed.info/sct' 

valueset "Device Application": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1110.48' 
valueset "Injectable Factor Xa Inhibitor for VTE Prophylaxis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.211' 
valueset "Intermittent pneumatic compression devices (IPC)": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.214' 
valueset "Low Dose Unfractionated Heparin for VTE Prophylaxis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1045.39' 
valueset "Low Molecular Weight Heparin for VTE Prophylaxis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.219' 
valueset "Warfarin": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.232' 

code "Amdinocillin [Susceptibility] by Serum bactericidal titer": '10-9' from "LOINC" display 'Amdinocillin [Susceptibility] by Serum bactericidal titer'
code "Body mass index (BMI) [Ratio]": '39156-5' from "LOINC" display 'Body mass index (BMI) [Ratio]'
code "Goldmann three-mirror contact lens (physical object)": '420523002' from "SNOMEDCT" display 'Goldmann three-mirror contact lens (physical object)'

parameter "Measurement Period" Interval<Integer>

context Patient

define "SDE Ethnicity":
  SDE."SDE Ethnicity"

define "SDE Payer":
  SDE."SDE Payer"

define "SDE Race":
  SDE."SDE Race"

define "SDE Sex":
  SDE."SDE Sex"

define "Initial Population":
  "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions"

define "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions":
  Global."Inpatient Encounter" InpatientEncounter
                                        with ["Patient"] BirthDate
                                          such that Global."CalendarAgeInYearsAt" ( FHIRHelpers.ToDate ( BirthDate.birthDate ), start of InpatientEncounter.period ) >= 18

define "Denominator":
  "Initial Population"

define "Numerator":
  "Encounter With VTE Prophylaxis Received on Day of or Day After Admission or Procedure"

define "Encounter With VTE Prophylaxis Received on Day of or Day After Admission or Procedure":
  from "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions" QualifyingEncounter,
                                      "VTE Prophylaxis by Medication Administered or Device Applied" VTEProphylaxis
                                    where Coalesce(Global."Normalize Interval"(VTEProphylaxis.effective), Global."Normalize Interval"(VTEProphylaxis.performed))starts during TJC."CalendarDayOfOrDayAfter" ( start of QualifyingEncounter.period )
                                    return QualifyingEncounter

define "VTE Prophylaxis by Medication Administered or Device Applied":
  ( ["MedicationAdministration": medication in "Low Dose Unfractionated Heparin for VTE Prophylaxis"] VTEMedication
                                    where VTEMedication.status = 'completed'
                                )
                                  union ( ["MedicationAdministration": medication in "Low Molecular Weight Heparin for VTE Prophylaxis"] LMWH
                                      where LMWH.status = 'completed'
                                  )
                                  union ( ["MedicationAdministration": medication in "Injectable Factor Xa Inhibitor for VTE Prophylaxis"] FactorXa
                                      where FactorXa.status = 'completed'
                                  )
                                  union ( ["MedicationAdministration": medication in "Warfarin"] Warfarin
                                      where Warfarin.status = 'completed'
                                  )
                                  union ( ["Procedure": "Device Application"] DeviceApplied
                                      where DeviceApplied.status = 'complete'
                                        and DeviceApplied.usedCode in "Intermittent pneumatic compression devices (IPC)")

define function "fun"("notPascalCase" Integer ):
  true`;

export const ELM_JSON = `
{
  "errorExceptions" : [ {
    "startLine" : 5,
    "startChar" : 1,
    "endLine" : 5,
    "endChar" : 56,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "404 : \\"{\\"timestamp\\":\\"2022-08-15T21:42:29.298+00:00\\",\\"status\\":404,\\"error\\":\\"Not Found\\",\\"path\\":\\"/api/fhir/libraries/cql\\"}\\""
  }, {
    "startLine" : 6,
    "startChar" : 1,
    "endLine" : 6,
    "endChar" : 66,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "404 : \\"{\\"timestamp\\":\\"2022-08-15T21:42:29.371+00:00\\",\\"status\\":404,\\"error\\":\\"Not Found\\",\\"path\\":\\"/api/fhir/libraries/cql\\"}\\""
  }, {
    "startLine" : 7,
    "startChar" : 1,
    "endLine" : 7,
    "endChar" : 69,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "404 : \\"{\\"timestamp\\":\\"2022-08-15T21:42:29.451+00:00\\",\\"status\\":404,\\"error\\":\\"Not Found\\",\\"path\\":\\"/api/fhir/libraries/cql\\"}\\""
  }, {
    "startLine" : 8,
    "startChar" : 1,
    "endLine" : 8,
    "endChar" : 52,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "404 : \\"{\\"timestamp\\":\\"2022-08-15T21:42:29.538+00:00\\",\\"status\\":404,\\"error\\":\\"Not Found\\",\\"path\\":\\"/api/fhir/libraries/cql\\"}\\""
  }, {
    "startLine" : 29,
    "startChar" : 3,
    "endLine" : 29,
    "endChar" : 5,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve identifier SDE in the current library."
  }, {
    "startLine" : 29,
    "startChar" : 7,
    "endLine" : 29,
    "endChar" : 21,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Member SDE Ethnicity not found for type null."
  }, {
    "startLine" : 32,
    "startChar" : 3,
    "endLine" : 32,
    "endChar" : 5,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve identifier SDE in the current library."
  }, {
    "startLine" : 32,
    "startChar" : 7,
    "endLine" : 32,
    "endChar" : 17,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Member SDE Payer not found for type null."
  }, {
    "startLine" : 35,
    "startChar" : 3,
    "endLine" : 35,
    "endChar" : 5,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve identifier SDE in the current library."
  }, {
    "startLine" : 35,
    "startChar" : 7,
    "endLine" : 35,
    "endChar" : 16,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Member SDE Race not found for type null."
  }, {
    "startLine" : 38,
    "startChar" : 3,
    "endLine" : 38,
    "endChar" : 5,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve identifier SDE in the current library."
  }, {
    "startLine" : 38,
    "startChar" : 7,
    "endLine" : 38,
    "endChar" : 15,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Member SDE Sex not found for type null."
  }, {
    "startLine" : 44,
    "startChar" : 3,
    "endLine" : 44,
    "endChar" : 30,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve identifier Global in the current library."
  }, {
    "startLine" : 46,
    "startChar" : 53,
    "endLine" : 46,
    "endChar" : 58,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve identifier Global in the current library."
  }, {
    "startLine" : 46,
    "startChar" : 85,
    "endLine" : 46,
    "endChar" : 95,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve identifier FHIRHelpers in the current library."
  }, {
    "startLine" : 46,
    "startChar" : 97,
    "endLine" : 46,
    "endChar" : 126,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not determine signature for invocation of operator ToDate."
  }, {
    "startLine" : 46,
    "startChar" : 157,
    "endLine" : 46,
    "endChar" : 162,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Member period not found for type null."
  }, {
    "startLine" : 46,
    "startChar" : 129,
    "endLine" : 46,
    "endChar" : 162,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not determine signature for invocation of operator System.Start."
  }, {
    "startLine" : 46,
    "startChar" : 60,
    "endLine" : 46,
    "endChar" : 164,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not determine signature for invocation of operator CalendarAgeInYearsAt."
  }, {
    "startLine" : 46,
    "startChar" : 53,
    "endLine" : 46,
    "endChar" : 170,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not determine signature for invocation of operator System.GreaterOrEqual."
  }, {
    "startLine" : 45,
    "startChar" : 41,
    "endLine" : 46,
    "endChar" : 170,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'."
  }, {
    "startLine" : 44,
    "startChar" : 3,
    "endLine" : 46,
    "endChar" : 170,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "class org.hl7.elm.r1.Null cannot be cast to class org.hl7.elm.r1.RelationshipClause (org.hl7.elm.r1.Null and org.hl7.elm.r1.RelationshipClause are in unnamed module of loader 'app')"
  }, {
    "startLine" : 41,
    "startChar" : 3,
    "endLine" : 41,
    "endChar" : 80,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not validate reference to expression Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions because its definition contains errors."
  }, {
    "startLine" : 49,
    "startChar" : 3,
    "endLine" : 49,
    "endChar" : 22,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not validate reference to expression Initial Population because its definition contains errors."
  }, {
    "startLine" : 55,
    "startChar" : 8,
    "endLine" : 55,
    "endChar" : 85,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not validate reference to expression Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions because its definition contains errors."
  }, {
    "startLine" : 61,
    "startChar" : 5,
    "endLine" : 61,
    "endChar" : 101,
    "errorType" : null,
    "errorSeverity" : "Warning",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve membership operator for terminology target of the retrieve."
  }, {
    "startLine" : 62,
    "startChar" : 43,
    "endLine" : 62,
    "endChar" : 76,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve library name FHIRHelpers."
  }, {
    "startLine" : 62,
    "startChar" : 37,
    "endLine" : 62,
    "endChar" : 76,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'."
  }, {
    "startLine" : 64,
    "startChar" : 43,
    "endLine" : 64,
    "endChar" : 136,
    "errorType" : null,
    "errorSeverity" : "Warning",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve membership operator for terminology target of the retrieve."
  }, {
    "startLine" : 65,
    "startChar" : 45,
    "endLine" : 65,
    "endChar" : 69,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve library name FHIRHelpers."
  }, {
    "startLine" : 65,
    "startChar" : 39,
    "endLine" : 65,
    "endChar" : 69,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'."
  }, {
    "startLine" : 67,
    "startChar" : 43,
    "endLine" : 67,
    "endChar" : 138,
    "errorType" : null,
    "errorSeverity" : "Warning",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve membership operator for terminology target of the retrieve."
  }, {
    "startLine" : 68,
    "startChar" : 45,
    "endLine" : 68,
    "endChar" : 73,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve library name FHIRHelpers."
  }, {
    "startLine" : 68,
    "startChar" : 39,
    "endLine" : 68,
    "endChar" : 73,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'."
  }, {
    "startLine" : 70,
    "startChar" : 43,
    "endLine" : 70,
    "endChar" : 96,
    "errorType" : null,
    "errorSeverity" : "Warning",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve membership operator for terminology target of the retrieve."
  }, {
    "startLine" : 71,
    "startChar" : 45,
    "endLine" : 71,
    "endChar" : 73,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve library name FHIRHelpers."
  }, {
    "startLine" : 71,
    "startChar" : 39,
    "endLine" : 71,
    "endChar" : 73,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'."
  }, {
    "startLine" : 73,
    "startChar" : 43,
    "endLine" : 73,
    "endChar" : 77,
    "errorType" : null,
    "errorSeverity" : "Warning",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve membership operator for terminology target of the retrieve."
  }, {
    "startLine" : 74,
    "startChar" : 45,
    "endLine" : 74,
    "endChar" : 77,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve library name FHIRHelpers."
  }, {
    "startLine" : 75,
    "startChar" : 45,
    "endLine" : 75,
    "endChar" : 120,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve library name FHIRHelpers."
  }, {
    "startLine" : 74,
    "startChar" : 45,
    "endLine" : 75,
    "endChar" : 120,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not determine signature for invocation of operator System.And."
  }, {
    "startLine" : 74,
    "startChar" : 39,
    "endLine" : 75,
    "endChar" : 120,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'."
  }, {
    "startLine" : 57,
    "startChar" : 52,
    "endLine" : 57,
    "endChar" : 57,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve identifier Global in the current library."
  }, {
    "startLine" : 57,
    "startChar" : 59,
    "endLine" : 57,
    "endChar" : 104,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not determine signature for invocation of operator Normalize Interval."
  }, {
    "startLine" : 57,
    "startChar" : 107,
    "endLine" : 57,
    "endChar" : 112,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve identifier Global in the current library."
  }, {
    "startLine" : 57,
    "startChar" : 114,
    "endLine" : 57,
    "endChar" : 159,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not determine signature for invocation of operator Normalize Interval."
  }, {
    "startLine" : 57,
    "startChar" : 43,
    "endLine" : 57,
    "endChar" : 160,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not determine signature for invocation of operator Coalesce."
  }, {
    "startLine" : 57,
    "startChar" : 175,
    "endLine" : 57,
    "endChar" : 177,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not resolve identifier TJC in the current library."
  }, {
    "startLine" : 57,
    "startChar" : 236,
    "endLine" : 57,
    "endChar" : 241,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Member period not found for type null."
  }, {
    "startLine" : 57,
    "startChar" : 207,
    "endLine" : 57,
    "endChar" : 241,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not determine signature for invocation of operator System.Start."
  }, {
    "startLine" : 57,
    "startChar" : 179,
    "endLine" : 57,
    "endChar" : 243,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not determine signature for invocation of operator CalendarDayOfOrDayAfter."
  }, {
    "startLine" : 57,
    "startChar" : 161,
    "endLine" : 57,
    "endChar" : 173,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not determine signature for invocation of operator System.Start."
  }, {
    "startLine" : 57,
    "startChar" : 37,
    "endLine" : 57,
    "endChar" : 243,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'."
  }, {
    "startLine" : 58,
    "startChar" : 37,
    "endLine" : 58,
    "endChar" : 62,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "elementType"
  }, {
    "startLine" : 55,
    "startChar" : 3,
    "endLine" : 58,
    "endChar" : 62,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "class org.hl7.elm.r1.Null cannot be cast to class org.hl7.elm.r1.ReturnClause (org.hl7.elm.r1.Null and org.hl7.elm.r1.ReturnClause are in unnamed module of loader 'app')"
  }, {
    "startLine" : 52,
    "startChar" : 3,
    "endLine" : 52,
    "endChar" : 89,
    "errorType" : null,
    "errorSeverity" : "Error",
    "targetIncludeLibraryId" : "EXM108reduced",
    "targetIncludeLibraryVersionId" : "0.3.004",
    "type" : null,
    "message" : "Could not validate reference to expression Encounter With VTE Prophylaxis Received on Day of or Day After Admission or Procedure because its definition contains errors."
  } ],
  "library" : {
    "annotation" : [ {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 5,
      "startChar" : 1,
      "endLine" : 5,
      "endChar" : 56,
      "message" : "404 : \\"{\\"timestamp\\":\\"2022-08-15T21:42:29.298+00:00\\",\\"status\\":404,\\"error\\":\\"Not Found\\",\\"path\\":\\"/api/fhir/libraries/cql\\"}\\"",
      "errorType" : "include",
      "errorSeverity" : "Error",
      "targetIncludeLibraryId" : "FHIRHelpers",
      "targetIncludeLibraryVersionId" : "4.0.001",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 6,
      "startChar" : 1,
      "endLine" : 6,
      "endChar" : 66,
      "message" : "404 : \\"{\\"timestamp\\":\\"2022-08-15T21:42:29.371+00:00\\",\\"status\\":404,\\"error\\":\\"Not Found\\",\\"path\\":\\"/api/fhir/libraries/cql\\"}\\"",
      "errorType" : "include",
      "errorSeverity" : "Error",
      "targetIncludeLibraryId" : "SupplementalDataElementsFHIR4",
      "targetIncludeLibraryVersionId" : "2.0.000",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 7,
      "startChar" : 1,
      "endLine" : 7,
      "endChar" : 69,
      "message" : "404 : \\"{\\"timestamp\\":\\"2022-08-15T21:42:29.451+00:00\\",\\"status\\":404,\\"error\\":\\"Not Found\\",\\"path\\":\\"/api/fhir/libraries/cql\\"}\\"",
      "errorType" : "include",
      "errorSeverity" : "Error",
      "targetIncludeLibraryId" : "MATGlobalCommonFunctionsFHIR4",
      "targetIncludeLibraryVersionId" : "5.0.000",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 8,
      "startChar" : 1,
      "endLine" : 8,
      "endChar" : 52,
      "message" : "404 : \\"{\\"timestamp\\":\\"2022-08-15T21:42:29.538+00:00\\",\\"status\\":404,\\"error\\":\\"Not Found\\",\\"path\\":\\"/api/fhir/libraries/cql\\"}\\"",
      "errorType" : "include",
      "errorSeverity" : "Error",
      "targetIncludeLibraryId" : "TJCOverallFHIR4",
      "targetIncludeLibraryVersionId" : "5.0.000",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 29,
      "startChar" : 3,
      "endLine" : 29,
      "endChar" : 5,
      "message" : "Could not resolve identifier SDE in the current library.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 29,
      "startChar" : 7,
      "endLine" : 29,
      "endChar" : 21,
      "message" : "Member SDE Ethnicity not found for type null.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 32,
      "startChar" : 3,
      "endLine" : 32,
      "endChar" : 5,
      "message" : "Could not resolve identifier SDE in the current library.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 32,
      "startChar" : 7,
      "endLine" : 32,
      "endChar" : 17,
      "message" : "Member SDE Payer not found for type null.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 35,
      "startChar" : 3,
      "endLine" : 35,
      "endChar" : 5,
      "message" : "Could not resolve identifier SDE in the current library.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 35,
      "startChar" : 7,
      "endLine" : 35,
      "endChar" : 16,
      "message" : "Member SDE Race not found for type null.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 38,
      "startChar" : 3,
      "endLine" : 38,
      "endChar" : 5,
      "message" : "Could not resolve identifier SDE in the current library.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 38,
      "startChar" : 7,
      "endLine" : 38,
      "endChar" : 15,
      "message" : "Member SDE Sex not found for type null.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 44,
      "startChar" : 3,
      "endLine" : 44,
      "endChar" : 30,
      "message" : "Could not resolve identifier Global in the current library.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 46,
      "startChar" : 53,
      "endLine" : 46,
      "endChar" : 58,
      "message" : "Could not resolve identifier Global in the current library.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 46,
      "startChar" : 85,
      "endLine" : 46,
      "endChar" : 95,
      "message" : "Could not resolve identifier FHIRHelpers in the current library.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 46,
      "startChar" : 97,
      "endLine" : 46,
      "endChar" : 126,
      "message" : "Could not determine signature for invocation of operator ToDate.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 46,
      "startChar" : 157,
      "endLine" : 46,
      "endChar" : 162,
      "message" : "Member period not found for type null.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 46,
      "startChar" : 129,
      "endLine" : 46,
      "endChar" : 162,
      "message" : "Could not determine signature for invocation of operator System.Start.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 46,
      "startChar" : 60,
      "endLine" : 46,
      "endChar" : 164,
      "message" : "Could not determine signature for invocation of operator CalendarAgeInYearsAt.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 46,
      "startChar" : 53,
      "endLine" : 46,
      "endChar" : 170,
      "message" : "Could not determine signature for invocation of operator System.GreaterOrEqual.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 45,
      "startChar" : 41,
      "endLine" : 46,
      "endChar" : 170,
      "message" : "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 44,
      "startChar" : 3,
      "endLine" : 46,
      "endChar" : 170,
      "message" : "class org.hl7.elm.r1.Null cannot be cast to class org.hl7.elm.r1.RelationshipClause (org.hl7.elm.r1.Null and org.hl7.elm.r1.RelationshipClause are in unnamed module of loader 'app')",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 41,
      "startChar" : 3,
      "endLine" : 41,
      "endChar" : 80,
      "message" : "Could not validate reference to expression Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions because its definition contains errors.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 49,
      "startChar" : 3,
      "endLine" : 49,
      "endChar" : 22,
      "message" : "Could not validate reference to expression Initial Population because its definition contains errors.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 55,
      "startChar" : 8,
      "endLine" : 55,
      "endChar" : 85,
      "message" : "Could not validate reference to expression Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions because its definition contains errors.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 62,
      "startChar" : 43,
      "endLine" : 62,
      "endChar" : 76,
      "message" : "Could not resolve library name FHIRHelpers.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 62,
      "startChar" : 37,
      "endLine" : 62,
      "endChar" : 76,
      "message" : "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 65,
      "startChar" : 45,
      "endLine" : 65,
      "endChar" : 69,
      "message" : "Could not resolve library name FHIRHelpers.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 65,
      "startChar" : 39,
      "endLine" : 65,
      "endChar" : 69,
      "message" : "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 68,
      "startChar" : 45,
      "endLine" : 68,
      "endChar" : 73,
      "message" : "Could not resolve library name FHIRHelpers.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 68,
      "startChar" : 39,
      "endLine" : 68,
      "endChar" : 73,
      "message" : "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 71,
      "startChar" : 45,
      "endLine" : 71,
      "endChar" : 73,
      "message" : "Could not resolve library name FHIRHelpers.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 71,
      "startChar" : 39,
      "endLine" : 71,
      "endChar" : 73,
      "message" : "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 74,
      "startChar" : 45,
      "endLine" : 74,
      "endChar" : 77,
      "message" : "Could not resolve library name FHIRHelpers.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 75,
      "startChar" : 45,
      "endLine" : 75,
      "endChar" : 120,
      "message" : "Could not resolve library name FHIRHelpers.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 74,
      "startChar" : 45,
      "endLine" : 75,
      "endChar" : 120,
      "message" : "Could not determine signature for invocation of operator System.And.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 74,
      "startChar" : 39,
      "endLine" : 75,
      "endChar" : 120,
      "message" : "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 57,
      "startChar" : 52,
      "endLine" : 57,
      "endChar" : 57,
      "message" : "Could not resolve identifier Global in the current library.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 57,
      "startChar" : 59,
      "endLine" : 57,
      "endChar" : 104,
      "message" : "Could not determine signature for invocation of operator Normalize Interval.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 57,
      "startChar" : 107,
      "endLine" : 57,
      "endChar" : 112,
      "message" : "Could not resolve identifier Global in the current library.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 57,
      "startChar" : 114,
      "endLine" : 57,
      "endChar" : 159,
      "message" : "Could not determine signature for invocation of operator Normalize Interval.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 57,
      "startChar" : 43,
      "endLine" : 57,
      "endChar" : 160,
      "message" : "Could not determine signature for invocation of operator Coalesce.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 57,
      "startChar" : 175,
      "endLine" : 57,
      "endChar" : 177,
      "message" : "Could not resolve identifier TJC in the current library.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 57,
      "startChar" : 236,
      "endLine" : 57,
      "endChar" : 241,
      "message" : "Member period not found for type null.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 57,
      "startChar" : 207,
      "endLine" : 57,
      "endChar" : 241,
      "message" : "Could not determine signature for invocation of operator System.Start.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 57,
      "startChar" : 179,
      "endLine" : 57,
      "endChar" : 243,
      "message" : "Could not determine signature for invocation of operator CalendarDayOfOrDayAfter.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 57,
      "startChar" : 161,
      "endLine" : 57,
      "endChar" : 173,
      "message" : "Could not determine signature for invocation of operator System.Start.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 57,
      "startChar" : 37,
      "endLine" : 57,
      "endChar" : 243,
      "message" : "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 58,
      "startChar" : 37,
      "endLine" : 58,
      "endChar" : 62,
      "message" : "elementType",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 55,
      "startChar" : 3,
      "endLine" : 58,
      "endChar" : 62,
      "message" : "class org.hl7.elm.r1.Null cannot be cast to class org.hl7.elm.r1.ReturnClause (org.hl7.elm.r1.Null and org.hl7.elm.r1.ReturnClause are in unnamed module of loader 'app')",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    }, {
      "libraryId" : "EXM108reduced",
      "libraryVersion" : "0.3.004",
      "startLine" : 52,
      "startChar" : 3,
      "endLine" : 52,
      "endChar" : 89,
      "message" : "Could not validate reference to expression Encounter With VTE Prophylaxis Received on Day of or Day After Admission or Procedure because its definition contains errors.",
      "errorType" : "semantic",
      "errorSeverity" : "Error",
      "type" : "CqlToElmError"
    } ],
    "identifier" : {
      "id" : "EXM108reduced",
      "version" : "0.3.004"
    },
    "schemaIdentifier" : {
      "id" : "urn:hl7-org:elm",
      "version" : "r1"
    },
    "usings" : {
      "def" : [ {
        "localIdentifier" : "System",
        "uri" : "urn:hl7-org:elm-types:r1"
      }, {
        "localId" : "1",
        "locator" : "3:1-3:26",
        "localIdentifier" : "FHIR",
        "uri" : "http://hl7.org/fhir",
        "version" : "4.0.1",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "1",
            "s" : [ {
              "value" : [ "", "using " ]
            }, {
              "s" : [ {
                "value" : [ "FHIR" ]
              } ]
            }, {
              "value" : [ " version ", "'4.0.1'" ]
            } ]
          }
        } ]
      } ]
    },
    "parameters" : {
      "def" : [ {
        "localId" : "18",
        "locator" : "24:1-24:48",
        "name" : "Measurement Period",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "18",
            "s" : [ {
              "value" : [ "", "parameter ", "\\"Measurement Period\\"", " " ]
            }, {
              "r" : "17",
              "s" : [ {
                "value" : [ "Interval<" ]
              }, {
                "r" : "16",
                "s" : [ {
                  "value" : [ "Integer" ]
                } ]
              }, {
                "value" : [ ">" ]
              } ]
            } ]
          }
        } ],
        "parameterTypeSpecifier" : {
          "localId" : "17",
          "locator" : "24:32-24:48",
          "type" : "IntervalTypeSpecifier",
          "pointType" : {
            "localId" : "16",
            "locator" : "24:41-24:47",
            "name" : "{urn:hl7-org:elm-types:r1}Integer",
            "type" : "NamedTypeSpecifier"
          }
        }
      } ]
    },
    "codeSystems" : {
      "def" : [ {
        "localId" : "2",
        "locator" : "10:1-10:38",
        "name" : "LOINC",
        "id" : "http://loinc.org",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "2",
            "s" : [ {
              "value" : [ "", "codesystem ", "\\"LOINC\\"", ": ", "'http://loinc.org'" ]
            } ]
          }
        } ]
      }, {
        "localId" : "3",
        "locator" : "11:1-11:47",
        "name" : "SNOMEDCT",
        "id" : "http://snomed.info/sct",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "3",
            "s" : [ {
              "value" : [ "", "codesystem ", "\\"SNOMEDCT\\"", ": ", "'http://snomed.info/sct'" ]
            } ]
          }
        } ]
      } ]
    },
    "valueSets" : {
      "def" : [ {
        "localId" : "4",
        "locator" : "13:1-13:99",
        "name" : "Device Application",
        "id" : "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1110.48",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "4",
            "s" : [ {
              "value" : [ "", "valueset ", "\\"Device Application\\"", ": ", "'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1110.48'" ]
            } ]
          }
        } ]
      }, {
        "localId" : "5",
        "locator" : "14:1-14:135",
        "name" : "Injectable Factor Xa Inhibitor for VTE Prophylaxis",
        "id" : "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.211",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "5",
            "s" : [ {
              "value" : [ "", "valueset ", "\\"Injectable Factor Xa Inhibitor for VTE Prophylaxis\\"", ": ", "'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.211'" ]
            } ]
          }
        } ]
      }, {
        "localId" : "6",
        "locator" : "15:1-15:133",
        "name" : "Intermittent pneumatic compression devices (IPC)",
        "id" : "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.214",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "6",
            "s" : [ {
              "value" : [ "", "valueset ", "\\"Intermittent pneumatic compression devices (IPC)\\"", ": ", "'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.214'" ]
            } ]
          }
        } ]
      }, {
        "localId" : "7",
        "locator" : "16:1-16:132",
        "name" : "Low Dose Unfractionated Heparin for VTE Prophylaxis",
        "id" : "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1045.39",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "7",
            "s" : [ {
              "value" : [ "", "valueset ", "\\"Low Dose Unfractionated Heparin for VTE Prophylaxis\\"", ": ", "'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1045.39'" ]
            } ]
          }
        } ]
      }, {
        "localId" : "8",
        "locator" : "17:1-17:133",
        "name" : "Low Molecular Weight Heparin for VTE Prophylaxis",
        "id" : "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.219",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "8",
            "s" : [ {
              "value" : [ "", "valueset ", "\\"Low Molecular Weight Heparin for VTE Prophylaxis\\"", ": ", "'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.219'" ]
            } ]
          }
        } ]
      }, {
        "localId" : "9",
        "locator" : "18:1-18:93",
        "name" : "Warfarin",
        "id" : "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.232",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "9",
            "s" : [ {
              "value" : [ "", "valueset ", "\\"Warfarin\\"", ": ", "'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.232'" ]
            } ]
          }
        } ]
      } ]
    },
    "codes" : {
      "def" : [ {
        "localId" : "11",
        "locator" : "20:1-20:153",
        "name" : "Amdinocillin [Susceptibility] by Serum bactericidal titer",
        "id" : "10-9",
        "display" : "Amdinocillin [Susceptibility] by Serum bactericidal titer",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "11",
            "s" : [ {
              "value" : [ "", "code ", "\\"Amdinocillin [Susceptibility] by Serum bactericidal titer\\"", ": ", "'10-9'", " from " ]
            }, {
              "r" : "10",
              "s" : [ {
                "value" : [ "\\"LOINC\\"" ]
              } ]
            }, {
              "value" : [ " display ", "'Amdinocillin [Susceptibility] by Serum bactericidal titer'" ]
            } ]
          }
        } ],
        "codeSystem" : {
          "localId" : "10",
          "locator" : "20:79-20:85",
          "name" : "LOINC"
        }
      }, {
        "localId" : "13",
        "locator" : "21:1-21:100",
        "name" : "Body mass index (BMI) [Ratio]",
        "id" : "39156-5",
        "display" : "Body mass index (BMI) [Ratio]",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "13",
            "s" : [ {
              "value" : [ "", "code ", "\\"Body mass index (BMI) [Ratio]\\"", ": ", "'39156-5'", " from " ]
            }, {
              "r" : "12",
              "s" : [ {
                "value" : [ "\\"LOINC\\"" ]
              } ]
            }, {
              "value" : [ " display ", "'Body mass index (BMI) [Ratio]'" ]
            } ]
          }
        } ],
        "codeSystem" : {
          "localId" : "12",
          "locator" : "21:54-21:60",
          "name" : "LOINC"
        }
      }, {
        "localId" : "15",
        "locator" : "22:1-22:151",
        "name" : "Goldmann three-mirror contact lens (physical object)",
        "id" : "420523002",
        "display" : "Goldmann three-mirror contact lens (physical object)",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "15",
            "s" : [ {
              "value" : [ "", "code ", "\\"Goldmann three-mirror contact lens (physical object)\\"", ": ", "'420523002'", " from " ]
            }, {
              "r" : "14",
              "s" : [ {
                "value" : [ "\\"SNOMEDCT\\"" ]
              } ]
            }, {
              "value" : [ " display ", "'Goldmann three-mirror contact lens (physical object)'" ]
            } ]
          }
        } ],
        "codeSystem" : {
          "localId" : "14",
          "locator" : "22:79-22:88",
          "name" : "SNOMEDCT"
        }
      } ]
    },
    "contexts" : {
      "def" : [ {
        "locator" : "26:1-26:15",
        "name" : "Patient"
      } ]
    },
    "statements" : {
      "def" : [ {
        "locator" : "26:1-26:15",
        "name" : "Patient",
        "context" : "Patient",
        "expression" : {
          "type" : "SingletonFrom",
          "operand" : {
            "locator" : "26:1-26:15",
            "dataType" : "{http://hl7.org/fhir}Patient",
            "templateId" : "http://hl7.org/fhir/StructureDefinition/Patient",
            "type" : "Retrieve"
          }
        }
      }, {
        "localId" : "21",
        "locator" : "28:1-29:21",
        "name" : "SDE Ethnicity",
        "context" : "Patient",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "21",
            "s" : [ {
              "value" : [ "", "define ", "\\"SDE Ethnicity\\"", ":\\n  " ]
            }, {
              "r" : "20",
              "s" : [ {
                "r" : "19",
                "s" : [ {
                  "value" : [ "SDE" ]
                } ]
              }, {
                "value" : [ "." ]
              }, {
                "r" : "20",
                "s" : [ {
                  "value" : [ "\\"SDE Ethnicity\\"" ]
                } ]
              } ]
            } ]
          }
        } ],
        "expression" : {
          "localId" : "20",
          "locator" : "29:3-29:21",
          "type" : "Null"
        }
      }, {
        "localId" : "24",
        "locator" : "31:1-32:17",
        "name" : "SDE Payer",
        "context" : "Patient",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "24",
            "s" : [ {
              "value" : [ "", "define ", "\\"SDE Payer\\"", ":\\n  " ]
            }, {
              "r" : "23",
              "s" : [ {
                "r" : "22",
                "s" : [ {
                  "value" : [ "SDE" ]
                } ]
              }, {
                "value" : [ "." ]
              }, {
                "r" : "23",
                "s" : [ {
                  "value" : [ "\\"SDE Payer\\"" ]
                } ]
              } ]
            } ]
          }
        } ],
        "expression" : {
          "localId" : "23",
          "locator" : "32:3-32:17",
          "type" : "Null"
        }
      }, {
        "localId" : "27",
        "locator" : "34:1-35:16",
        "name" : "SDE Race",
        "context" : "Patient",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "27",
            "s" : [ {
              "value" : [ "", "define ", "\\"SDE Race\\"", ":\\n  " ]
            }, {
              "r" : "26",
              "s" : [ {
                "r" : "25",
                "s" : [ {
                  "value" : [ "SDE" ]
                } ]
              }, {
                "value" : [ "." ]
              }, {
                "r" : "26",
                "s" : [ {
                  "value" : [ "\\"SDE Race\\"" ]
                } ]
              } ]
            } ]
          }
        } ],
        "expression" : {
          "localId" : "26",
          "locator" : "35:3-35:16",
          "type" : "Null"
        }
      }, {
        "localId" : "30",
        "locator" : "37:1-38:15",
        "name" : "SDE Sex",
        "context" : "Patient",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "30",
            "s" : [ {
              "value" : [ "", "define ", "\\"SDE Sex\\"", ":\\n  " ]
            }, {
              "r" : "29",
              "s" : [ {
                "r" : "28",
                "s" : [ {
                  "value" : [ "SDE" ]
                } ]
              }, {
                "value" : [ "." ]
              }, {
                "r" : "29",
                "s" : [ {
                  "value" : [ "\\"SDE Sex\\"" ]
                } ]
              } ]
            } ]
          }
        } ],
        "expression" : {
          "localId" : "29",
          "locator" : "38:3-38:15",
          "type" : "Null"
        }
      }, {
        "localId" : "48",
        "locator" : "43:1-46:170",
        "name" : "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions",
        "context" : "Patient",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "48",
            "s" : [ {
              "value" : [ "", "define ", "\\"Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions\\"", ":\\n  " ]
            }, {
              "r" : "47",
              "s" : [ {
                "s" : [ {
                  "r" : "32",
                  "s" : [ {
                    "r" : "31",
                    "s" : [ {
                      "s" : [ {
                        "value" : [ "Global", ".", "\\"Inpatient Encounter\\"" ]
                      } ]
                    } ]
                  }, {
                    "value" : [ " ", "InpatientEncounter" ]
                  } ]
                } ]
              }, {
                "value" : [ "\\n                                        " ]
              }, {
                "r" : "46",
                "s" : [ {
                  "value" : [ "with " ]
                }, {
                  "r" : "34",
                  "s" : [ {
                    "r" : "33",
                    "s" : [ {
                      "r" : "33",
                      "s" : [ {
                        "value" : [ "[", "\\"Patient\\"", "]" ]
                      } ]
                    } ]
                  }, {
                    "value" : [ " ", "BirthDate" ]
                  } ]
                }, {
                  "value" : [ "\\n                                          such that " ]
                }, {
                  "r" : "45",
                  "s" : [ {
                    "r" : "43",
                    "s" : [ {
                      "r" : "35",
                      "s" : [ {
                        "value" : [ "Global" ]
                      } ]
                    }, {
                      "value" : [ "." ]
                    }, {
                      "r" : "43",
                      "s" : [ {
                        "value" : [ "\\"CalendarAgeInYearsAt\\"", " ( " ]
                      }, {
                        "r" : "39",
                        "s" : [ {
                          "r" : "36",
                          "s" : [ {
                            "value" : [ "FHIRHelpers" ]
                          } ]
                        }, {
                          "value" : [ "." ]
                        }, {
                          "r" : "39",
                          "s" : [ {
                            "value" : [ "ToDate", " ( " ]
                          }, {
                            "r" : "38",
                            "s" : [ {
                              "r" : "37",
                              "s" : [ {
                                "value" : [ "BirthDate" ]
                              } ]
                            }, {
                              "value" : [ "." ]
                            }, {
                              "r" : "38",
                              "s" : [ {
                                "value" : [ "birthDate" ]
                              } ]
                            } ]
                          }, {
                            "value" : [ " )" ]
                          } ]
                        } ]
                      }, {
                        "value" : [ ", " ]
                      }, {
                        "r" : "42",
                        "s" : [ {
                          "value" : [ "start of " ]
                        }, {
                          "r" : "41",
                          "s" : [ {
                            "r" : "40",
                            "s" : [ {
                              "value" : [ "InpatientEncounter" ]
                            } ]
                          }, {
                            "value" : [ "." ]
                          }, {
                            "r" : "41",
                            "s" : [ {
                              "value" : [ "period" ]
                            } ]
                          } ]
                        } ]
                      }, {
                        "value" : [ " )" ]
                      } ]
                    } ]
                  }, {
                    "r" : "44",
                    "value" : [ " ", ">=", " ", "18" ]
                  } ]
                } ]
              } ]
            } ]
          }
        } ],
        "expression" : {
          "localId" : "47",
          "locator" : "44:3-46:170",
          "type" : "Null"
        }
      }, {
        "localId" : "50",
        "locator" : "40:1-41:80",
        "name" : "Initial Population",
        "context" : "Patient",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "50",
            "s" : [ {
              "value" : [ "", "define ", "\\"Initial Population\\"", ":\\n  " ]
            }, {
              "r" : "49",
              "s" : [ {
                "value" : [ "\\"Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions\\"" ]
              } ]
            } ]
          }
        } ],
        "expression" : {
          "localId" : "49",
          "locator" : "41:3-41:80",
          "type" : "Null"
        }
      }, {
        "localId" : "52",
        "locator" : "48:1-49:22",
        "name" : "Denominator",
        "context" : "Patient",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "52",
            "s" : [ {
              "value" : [ "", "define ", "\\"Denominator\\"", ":\\n  " ]
            }, {
              "r" : "51",
              "s" : [ {
                "value" : [ "\\"Initial Population\\"" ]
              } ]
            } ]
          }
        } ],
        "expression" : {
          "localId" : "51",
          "locator" : "49:3-49:22",
          "type" : "Null"
        }
      }, {
        "localId" : "105",
        "locator" : "60:1-75:121",
        "name" : "VTE Prophylaxis by Medication Administered or Device Applied",
        "context" : "Patient",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "105",
            "s" : [ {
              "value" : [ "", "define ", "\\"VTE Prophylaxis by Medication Administered or Device Applied\\"", ":\\n  " ]
            }, {
              "r" : "104",
              "s" : [ {
                "r" : "90",
                "s" : [ {
                  "r" : "80",
                  "s" : [ {
                    "r" : "71",
                    "s" : [ {
                      "r" : "62",
                      "s" : [ {
                        "value" : [ "( " ]
                      }, {
                        "r" : "62",
                        "s" : [ {
                          "s" : [ {
                            "r" : "56",
                            "s" : [ {
                              "r" : "55",
                              "s" : [ {
                                "r" : "55",
                                "s" : [ {
                                  "value" : [ "[", "\\"MedicationAdministration\\"", ": " ]
                                }, {
                                  "s" : [ {
                                    "value" : [ "medication" ]
                                  } ]
                                }, {
                                  "value" : [ " ", "in", " " ]
                                }, {
                                  "s" : [ {
                                    "value" : [ "\\"Low Dose Unfractionated Heparin for VTE Prophylaxis\\"" ]
                                  } ]
                                }, {
                                  "value" : [ "]" ]
                                } ]
                              } ]
                            }, {
                              "value" : [ " ", "VTEMedication" ]
                            } ]
                          } ]
                        }, {
                          "value" : [ "\\n                                    " ]
                        }, {
                          "r" : "61",
                          "s" : [ {
                            "value" : [ "where " ]
                          }, {
                            "r" : "60",
                            "s" : [ {
                              "r" : "58",
                              "s" : [ {
                                "r" : "57",
                                "s" : [ {
                                  "value" : [ "VTEMedication" ]
                                } ]
                              }, {
                                "value" : [ "." ]
                              }, {
                                "r" : "58",
                                "s" : [ {
                                  "value" : [ "status" ]
                                } ]
                              } ]
                            }, {
                              "value" : [ " ", "=", " " ]
                            }, {
                              "r" : "59",
                              "s" : [ {
                                "value" : [ "'completed'" ]
                              } ]
                            } ]
                          } ]
                        } ]
                      }, {
                        "value" : [ "\\n                                )" ]
                      } ]
                    }, {
                      "value" : [ "\\n                                  union " ]
                    }, {
                      "r" : "70",
                      "s" : [ {
                        "value" : [ "( " ]
                      }, {
                        "r" : "70",
                        "s" : [ {
                          "s" : [ {
                            "r" : "64",
                            "s" : [ {
                              "r" : "63",
                              "s" : [ {
                                "r" : "63",
                                "s" : [ {
                                  "value" : [ "[", "\\"MedicationAdministration\\"", ": " ]
                                }, {
                                  "s" : [ {
                                    "value" : [ "medication" ]
                                  } ]
                                }, {
                                  "value" : [ " ", "in", " " ]
                                }, {
                                  "s" : [ {
                                    "value" : [ "\\"Low Molecular Weight Heparin for VTE Prophylaxis\\"" ]
                                  } ]
                                }, {
                                  "value" : [ "]" ]
                                } ]
                              } ]
                            }, {
                              "value" : [ " ", "LMWH" ]
                            } ]
                          } ]
                        }, {
                          "value" : [ "\\n                                      " ]
                        }, {
                          "r" : "69",
                          "s" : [ {
                            "value" : [ "where " ]
                          }, {
                            "r" : "68",
                            "s" : [ {
                              "r" : "66",
                              "s" : [ {
                                "r" : "65",
                                "s" : [ {
                                  "value" : [ "LMWH" ]
                                } ]
                              }, {
                                "value" : [ "." ]
                              }, {
                                "r" : "66",
                                "s" : [ {
                                  "value" : [ "status" ]
                                } ]
                              } ]
                            }, {
                              "value" : [ " ", "=", " " ]
                            }, {
                              "r" : "67",
                              "s" : [ {
                                "value" : [ "'completed'" ]
                              } ]
                            } ]
                          } ]
                        } ]
                      }, {
                        "value" : [ "\\n                                  )" ]
                      } ]
                    } ]
                  }, {
                    "value" : [ "\\n                                  union " ]
                  }, {
                    "r" : "79",
                    "s" : [ {
                      "value" : [ "( " ]
                    }, {
                      "r" : "79",
                      "s" : [ {
                        "s" : [ {
                          "r" : "73",
                          "s" : [ {
                            "r" : "72",
                            "s" : [ {
                              "r" : "72",
                              "s" : [ {
                                "value" : [ "[", "\\"MedicationAdministration\\"", ": " ]
                              }, {
                                "s" : [ {
                                  "value" : [ "medication" ]
                                } ]
                              }, {
                                "value" : [ " ", "in", " " ]
                              }, {
                                "s" : [ {
                                  "value" : [ "\\"Injectable Factor Xa Inhibitor for VTE Prophylaxis\\"" ]
                                } ]
                              }, {
                                "value" : [ "]" ]
                              } ]
                            } ]
                          }, {
                            "value" : [ " ", "FactorXa" ]
                          } ]
                        } ]
                      }, {
                        "value" : [ "\\n                                      " ]
                      }, {
                        "r" : "78",
                        "s" : [ {
                          "value" : [ "where " ]
                        }, {
                          "r" : "77",
                          "s" : [ {
                            "r" : "75",
                            "s" : [ {
                              "r" : "74",
                              "s" : [ {
                                "value" : [ "FactorXa" ]
                              } ]
                            }, {
                              "value" : [ "." ]
                            }, {
                              "r" : "75",
                              "s" : [ {
                                "value" : [ "status" ]
                              } ]
                            } ]
                          }, {
                            "value" : [ " ", "=", " " ]
                          }, {
                            "r" : "76",
                            "s" : [ {
                              "value" : [ "'completed'" ]
                            } ]
                          } ]
                        } ]
                      } ]
                    }, {
                      "value" : [ "\\n                                  )" ]
                    } ]
                  } ]
                }, {
                  "value" : [ "\\n                                  union " ]
                }, {
                  "r" : "88",
                  "s" : [ {
                    "value" : [ "( " ]
                  }, {
                    "r" : "88",
                    "s" : [ {
                      "s" : [ {
                        "r" : "82",
                        "s" : [ {
                          "r" : "81",
                          "s" : [ {
                            "r" : "81",
                            "s" : [ {
                              "value" : [ "[", "\\"MedicationAdministration\\"", ": " ]
                            }, {
                              "s" : [ {
                                "value" : [ "medication" ]
                              } ]
                            }, {
                              "value" : [ " ", "in", " " ]
                            }, {
                              "s" : [ {
                                "value" : [ "\\"Warfarin\\"" ]
                              } ]
                            }, {
                              "value" : [ "]" ]
                            } ]
                          } ]
                        }, {
                          "value" : [ " ", "Warfarin" ]
                        } ]
                      } ]
                    }, {
                      "value" : [ "\\n                                      " ]
                    }, {
                      "r" : "87",
                      "s" : [ {
                        "value" : [ "where " ]
                      }, {
                        "r" : "86",
                        "s" : [ {
                          "r" : "84",
                          "s" : [ {
                            "r" : "83",
                            "s" : [ {
                              "value" : [ "Warfarin" ]
                            } ]
                          }, {
                            "value" : [ "." ]
                          }, {
                            "r" : "84",
                            "s" : [ {
                              "value" : [ "status" ]
                            } ]
                          } ]
                        }, {
                          "value" : [ " ", "=", " " ]
                        }, {
                          "r" : "85",
                          "s" : [ {
                            "value" : [ "'completed'" ]
                          } ]
                        } ]
                      } ]
                    } ]
                  }, {
                    "value" : [ "\\n                                  )" ]
                  } ]
                } ]
              }, {
                "value" : [ "\\n                                  union " ]
              }, {
                "r" : "103",
                "s" : [ {
                  "value" : [ "( " ]
                }, {
                  "r" : "103",
                  "s" : [ {
                    "s" : [ {
                      "r" : "92",
                      "s" : [ {
                        "r" : "91",
                        "s" : [ {
                          "r" : "91",
                          "s" : [ {
                            "value" : [ "[", "\\"Procedure\\"", ": " ]
                          }, {
                            "s" : [ {
                              "value" : [ "\\"Device Application\\"" ]
                            } ]
                          }, {
                            "value" : [ "]" ]
                          } ]
                        } ]
                      }, {
                        "value" : [ " ", "DeviceApplied" ]
                      } ]
                    } ]
                  }, {
                    "value" : [ "\\n                                      " ]
                  }, {
                    "r" : "102",
                    "s" : [ {
                      "value" : [ "where " ]
                    }, {
                      "r" : "101",
                      "s" : [ {
                        "r" : "96",
                        "s" : [ {
                          "r" : "94",
                          "s" : [ {
                            "r" : "93",
                            "s" : [ {
                              "value" : [ "DeviceApplied" ]
                            } ]
                          }, {
                            "value" : [ "." ]
                          }, {
                            "r" : "94",
                            "s" : [ {
                              "value" : [ "status" ]
                            } ]
                          } ]
                        }, {
                          "value" : [ " ", "=", " " ]
                        }, {
                          "r" : "95",
                          "s" : [ {
                            "value" : [ "'complete'" ]
                          } ]
                        } ]
                      }, {
                        "value" : [ "\\n                                        and " ]
                      }, {
                        "r" : "100",
                        "s" : [ {
                          "r" : "98",
                          "s" : [ {
                            "r" : "97",
                            "s" : [ {
                              "value" : [ "DeviceApplied" ]
                            } ]
                          }, {
                            "value" : [ "." ]
                          }, {
                            "r" : "98",
                            "s" : [ {
                              "value" : [ "usedCode" ]
                            } ]
                          } ]
                        }, {
                          "value" : [ " in " ]
                        }, {
                          "r" : "99",
                          "s" : [ {
                            "value" : [ "\\"Intermittent pneumatic compression devices (IPC)\\"" ]
                          } ]
                        } ]
                      } ]
                    } ]
                  } ]
                }, {
                  "value" : [ ")" ]
                } ]
              } ]
            } ]
          }
        } ],
        "expression" : {
          "localId" : "104",
          "locator" : "61:3-75:121",
          "type" : "Union",
          "operand" : [ {
            "type" : "As",
            "operand" : {
              "localId" : "90",
              "locator" : "61:3-72:35",
              "type" : "Union",
              "operand" : [ {
                "localId" : "71",
                "locator" : "61:3-66:35",
                "type" : "Union",
                "operand" : [ {
                  "localId" : "62",
                  "locator" : "61:3-63:33",
                  "type" : "Query",
                  "source" : [ {
                    "localId" : "56",
                    "locator" : "61:5-61:115",
                    "alias" : "VTEMedication",
                    "expression" : {
                      "localId" : "55",
                      "locator" : "61:5-61:101",
                      "dataType" : "{http://hl7.org/fhir}MedicationAdministration",
                      "templateId" : "http://hl7.org/fhir/StructureDefinition/MedicationAdministration",
                      "codeProperty" : "medication",
                      "codeComparator" : "in",
                      "type" : "Retrieve",
                      "codes" : {
                        "locator" : "61:48-61:100",
                        "name" : "Low Dose Unfractionated Heparin for VTE Prophylaxis",
                        "preserve" : true,
                        "type" : "ValueSetRef"
                      }
                    }
                  } ],
                  "relationship" : [ ],
                  "where" : {
                    "localId" : "61",
                    "locator" : "62:37-62:76",
                    "type" : "Null"
                  }
                }, {
                  "localId" : "70",
                  "locator" : "64:41-66:35",
                  "type" : "Query",
                  "source" : [ {
                    "localId" : "64",
                    "locator" : "64:43-64:141",
                    "alias" : "LMWH",
                    "expression" : {
                      "localId" : "63",
                      "locator" : "64:43-64:136",
                      "dataType" : "{http://hl7.org/fhir}MedicationAdministration",
                      "templateId" : "http://hl7.org/fhir/StructureDefinition/MedicationAdministration",
                      "codeProperty" : "medication",
                      "codeComparator" : "in",
                      "type" : "Retrieve",
                      "codes" : {
                        "locator" : "64:86-64:135",
                        "name" : "Low Molecular Weight Heparin for VTE Prophylaxis",
                        "preserve" : true,
                        "type" : "ValueSetRef"
                      }
                    }
                  } ],
                  "relationship" : [ ],
                  "where" : {
                    "localId" : "69",
                    "locator" : "65:39-65:69",
                    "type" : "Null"
                  }
                } ]
              }, {
                "localId" : "89",
                "type" : "Union",
                "operand" : [ {
                  "localId" : "79",
                  "locator" : "67:41-69:35",
                  "type" : "Query",
                  "source" : [ {
                    "localId" : "73",
                    "locator" : "67:43-67:147",
                    "alias" : "FactorXa",
                    "expression" : {
                      "localId" : "72",
                      "locator" : "67:43-67:138",
                      "dataType" : "{http://hl7.org/fhir}MedicationAdministration",
                      "templateId" : "http://hl7.org/fhir/StructureDefinition/MedicationAdministration",
                      "codeProperty" : "medication",
                      "codeComparator" : "in",
                      "type" : "Retrieve",
                      "codes" : {
                        "locator" : "67:86-67:137",
                        "name" : "Injectable Factor Xa Inhibitor for VTE Prophylaxis",
                        "preserve" : true,
                        "type" : "ValueSetRef"
                      }
                    }
                  } ],
                  "relationship" : [ ],
                  "where" : {
                    "localId" : "78",
                    "locator" : "68:39-68:73",
                    "type" : "Null"
                  }
                }, {
                  "localId" : "88",
                  "locator" : "70:41-72:35",
                  "type" : "Query",
                  "source" : [ {
                    "localId" : "82",
                    "locator" : "70:43-70:105",
                    "alias" : "Warfarin",
                    "expression" : {
                      "localId" : "81",
                      "locator" : "70:43-70:96",
                      "dataType" : "{http://hl7.org/fhir}MedicationAdministration",
                      "templateId" : "http://hl7.org/fhir/StructureDefinition/MedicationAdministration",
                      "codeProperty" : "medication",
                      "codeComparator" : "in",
                      "type" : "Retrieve",
                      "codes" : {
                        "locator" : "70:86-70:95",
                        "name" : "Warfarin",
                        "preserve" : true,
                        "type" : "ValueSetRef"
                      }
                    }
                  } ],
                  "relationship" : [ ],
                  "where" : {
                    "localId" : "87",
                    "locator" : "71:39-71:73",
                    "type" : "Null"
                  }
                } ]
              } ]
            },
            "asTypeSpecifier" : {
              "type" : "ListTypeSpecifier",
              "elementType" : {
                "type" : "ChoiceTypeSpecifier",
                "choice" : [ {
                  "name" : "{http://hl7.org/fhir}Procedure",
                  "type" : "NamedTypeSpecifier"
                }, {
                  "name" : "{http://hl7.org/fhir}MedicationAdministration",
                  "type" : "NamedTypeSpecifier"
                } ]
              }
            }
          }, {
            "type" : "As",
            "operand" : {
              "localId" : "103",
              "locator" : "73:41-75:121",
              "type" : "Query",
              "source" : [ {
                "localId" : "92",
                "locator" : "73:43-73:91",
                "alias" : "DeviceApplied",
                "expression" : {
                  "localId" : "91",
                  "locator" : "73:43-73:77",
                  "dataType" : "{http://hl7.org/fhir}Procedure",
                  "templateId" : "http://hl7.org/fhir/StructureDefinition/Procedure",
                  "codeProperty" : "code",
                  "codeComparator" : "in",
                  "type" : "Retrieve",
                  "codes" : {
                    "locator" : "73:57-73:76",
                    "name" : "Device Application",
                    "preserve" : true,
                    "type" : "ValueSetRef"
                  }
                }
              } ],
              "relationship" : [ ],
              "where" : {
                "localId" : "102",
                "locator" : "74:39-75:120",
                "type" : "Null"
              }
            },
            "asTypeSpecifier" : {
              "type" : "ListTypeSpecifier",
              "elementType" : {
                "type" : "ChoiceTypeSpecifier",
                "choice" : [ {
                  "name" : "{http://hl7.org/fhir}Procedure",
                  "type" : "NamedTypeSpecifier"
                }, {
                  "name" : "{http://hl7.org/fhir}MedicationAdministration",
                  "type" : "NamedTypeSpecifier"
                } ]
              }
            }
          } ]
        }
      }, {
        "localId" : "127",
        "locator" : "54:1-58:62",
        "name" : "Encounter With VTE Prophylaxis Received on Day of or Day After Admission or Procedure",
        "context" : "Patient",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "127",
            "s" : [ {
              "value" : [ "", "define ", "\\"Encounter With VTE Prophylaxis Received on Day of or Day After Admission or Procedure\\"", ":\\n  " ]
            }, {
              "r" : "126",
              "s" : [ {
                "s" : [ {
                  "value" : [ "from " ]
                }, {
                  "r" : "54",
                  "s" : [ {
                    "r" : "53",
                    "s" : [ {
                      "s" : [ {
                        "value" : [ "\\"Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions\\"" ]
                      } ]
                    } ]
                  }, {
                    "value" : [ " ", "QualifyingEncounter" ]
                  } ]
                }, {
                  "value" : [ ",\\n                                      " ]
                }, {
                  "r" : "107",
                  "s" : [ {
                    "r" : "106",
                    "s" : [ {
                      "s" : [ {
                        "value" : [ "\\"VTE Prophylaxis by Medication Administered or Device Applied\\"" ]
                      } ]
                    } ]
                  }, {
                    "value" : [ " ", "VTEProphylaxis" ]
                  } ]
                } ]
              }, {
                "value" : [ "\\n                                    " ]
              }, {
                "r" : "123",
                "s" : [ {
                  "value" : [ "where " ]
                }, {
                  "r" : "122",
                  "s" : [ {
                    "r" : "116",
                    "s" : [ {
                      "value" : [ "Coalesce", "(" ]
                    }, {
                      "r" : "111",
                      "s" : [ {
                        "r" : "108",
                        "s" : [ {
                          "value" : [ "Global" ]
                        } ]
                      }, {
                        "value" : [ "." ]
                      }, {
                        "r" : "111",
                        "s" : [ {
                          "value" : [ "\\"Normalize Interval\\"", "(" ]
                        }, {
                          "r" : "110",
                          "s" : [ {
                            "r" : "109",
                            "s" : [ {
                              "value" : [ "VTEProphylaxis" ]
                            } ]
                          }, {
                            "value" : [ "." ]
                          }, {
                            "r" : "110",
                            "s" : [ {
                              "value" : [ "effective" ]
                            } ]
                          } ]
                        }, {
                          "value" : [ ")" ]
                        } ]
                      } ]
                    }, {
                      "value" : [ ", " ]
                    }, {
                      "r" : "115",
                      "s" : [ {
                        "r" : "112",
                        "s" : [ {
                          "value" : [ "Global" ]
                        } ]
                      }, {
                        "value" : [ "." ]
                      }, {
                        "r" : "115",
                        "s" : [ {
                          "value" : [ "\\"Normalize Interval\\"", "(" ]
                        }, {
                          "r" : "114",
                          "s" : [ {
                            "r" : "113",
                            "s" : [ {
                              "value" : [ "VTEProphylaxis" ]
                            } ]
                          }, {
                            "value" : [ "." ]
                          }, {
                            "r" : "114",
                            "s" : [ {
                              "value" : [ "performed" ]
                            } ]
                          } ]
                        }, {
                          "value" : [ ")" ]
                        } ]
                      } ]
                    }, {
                      "value" : [ ")" ]
                    } ]
                  }, {
                    "r" : "122",
                    "value" : [ "starts during", " " ]
                  }, {
                    "r" : "121",
                    "s" : [ {
                      "r" : "117",
                      "s" : [ {
                        "value" : [ "TJC" ]
                      } ]
                    }, {
                      "value" : [ "." ]
                    }, {
                      "r" : "121",
                      "s" : [ {
                        "value" : [ "\\"CalendarDayOfOrDayAfter\\"", " ( " ]
                      }, {
                        "r" : "120",
                        "s" : [ {
                          "value" : [ "start of " ]
                        }, {
                          "r" : "119",
                          "s" : [ {
                            "r" : "118",
                            "s" : [ {
                              "value" : [ "QualifyingEncounter" ]
                            } ]
                          }, {
                            "value" : [ "." ]
                          }, {
                            "r" : "119",
                            "s" : [ {
                              "value" : [ "period" ]
                            } ]
                          } ]
                        } ]
                      }, {
                        "value" : [ " )" ]
                      } ]
                    } ]
                  } ]
                } ]
              }, {
                "value" : [ "\\n                                    " ]
              }, {
                "r" : "125",
                "s" : [ {
                  "value" : [ "return " ]
                }, {
                  "r" : "124",
                  "s" : [ {
                    "value" : [ "QualifyingEncounter" ]
                  } ]
                } ]
              } ]
            } ]
          }
        } ],
        "expression" : {
          "localId" : "126",
          "locator" : "55:3-58:62",
          "type" : "Null"
        }
      }, {
        "localId" : "129",
        "locator" : "51:1-52:89",
        "name" : "Numerator",
        "context" : "Patient",
        "accessLevel" : "Public",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "129",
            "s" : [ {
              "value" : [ "", "define ", "\\"Numerator\\"", ":\\n  " ]
            }, {
              "r" : "128",
              "s" : [ {
                "value" : [ "\\"Encounter With VTE Prophylaxis Received on Day of or Day After Admission or Procedure\\"" ]
              } ]
            } ]
          }
        } ],
        "expression" : {
          "localId" : "128",
          "locator" : "52:3-52:89",
          "type" : "Null"
        }
      }, {
        "localId" : "132",
        "locator" : "77:1-78:6",
        "name" : "fun",
        "context" : "Patient",
        "accessLevel" : "Public",
        "type" : "FunctionDef",
        "annotation" : [ {
          "type" : "Annotation",
          "s" : {
            "r" : "132",
            "s" : [ {
              "value" : [ "", "define function ", "\\"fun\\"", "(", "\\"notPascalCase\\"", " " ]
            }, {
              "r" : "130",
              "s" : [ {
                "value" : [ "Integer" ]
              } ]
            }, {
              "value" : [ " ):\\n  " ]
            }, {
              "r" : "131",
              "s" : [ {
                "r" : "131",
                "value" : [ "true" ]
              } ]
            } ]
          }
        } ],
        "expression" : {
          "localId" : "131",
          "locator" : "78:3-78:6",
          "valueType" : "{urn:hl7-org:elm-types:r1}Boolean",
          "value" : "true",
          "type" : "Literal"
        },
        "operand" : [ {
          "name" : "notPascalCase",
          "operandTypeSpecifier" : {
            "localId" : "130",
            "locator" : "77:39-77:45",
            "name" : "{urn:hl7-org:elm-types:r1}Integer",
            "type" : "NamedTypeSpecifier"
          }
        } ]
      } ]
    }
  },
  "externalErrors" : [ ]
}
`;
