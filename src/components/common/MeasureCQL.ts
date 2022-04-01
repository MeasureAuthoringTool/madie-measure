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
