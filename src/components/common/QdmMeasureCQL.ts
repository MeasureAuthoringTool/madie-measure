export const QdmMeasureCQL = `library BMAT1950a version '0.0.000'

using QDM version '5.6'

include MATGlobalCommonFunctionsQDM version '8.0.000' called Global

codesystem "RXNORM": 'urn:oid:2.16.840.1.113883.6.88'

valueset "Anthracycline Injectable": 'urn:oid:2.16.840.1.113883.3.1444.5.244'
valueset "Antiemetic Agent": 'urn:oid:2.16.840.1.113883.3.1444.5.245'
valueset "Cancer": 'urn:oid:2.16.840.1.113883.3.526.3.1010'
valueset "Cyclophosphamide Injectable": 'urn:oid:2.16.840.1.113883.3.1444.3.225'
valueset "Ethnicity": 'urn:oid:2.16.840.1.114222.4.11.837'
valueset "High Emetic Risk Intravenous Antineoplastic Agent": 'urn:oid:2.16.840.1.113883.3.1444.5.242'
valueset "Low Emetic Risk Intravenous Antineoplastic Agent": 'urn:oid:2.16.840.1.113883.3.1444.5.228'
valueset "Minimal Emetic Risk Intravenous Antineoplastic Agent": 'urn:oid:2.16.840.1.113883.3.1444.5.229'
valueset "Moderate Emetic Risk Intravenous Antineoplastic Agent": 'urn:oid:2.16.840.1.113883.3.1444.5.243'
valueset "Neurokinin 1 Receptor Antagonist": 'urn:oid:2.16.840.1.113762.1.4.1116.602'
valueset "Office Visit": 'urn:oid:2.16.840.1.113883.3.464.1003.101.12.1001'
valueset "Olanzapine": 'urn:oid:2.16.840.1.113883.3.1444.5.213'
valueset "ONC Administrative Sex": 'urn:oid:2.16.840.1.113762.1.4.1'
valueset "Payer": 'urn:oid:2.16.840.1.114222.4.11.3591'
valueset "Race": 'urn:oid:2.16.840.1.114222.4.11.836'



code "5 ML cytarabine 20 MG/ML Injection": '1731355' from "RXNORM" display '5 ML cytarabine 20 MG/ML Injection'
code "cyclophosphamide 1000 MG Injection": '1734919' from "RXNORM" display 'cyclophosphamide 1000 MG Injection'
code "cyclophosphamide 500 MG Injection": '1734917' from "RXNORM" display 'cyclophosphamide 500 MG Injection'
code "cytarabine 20 MG/ML Injectable Solution": '240416' from "RXNORM" display 'cytarabine 20 MG/ML Injectable Solution'

parameter "Measurement Period" Interval<DateTime>

context Patient

define "Anthracycline with Cyclophosphamide":
  ["Medication, Administered": "Anthracycline Injectable"] Anthracycline
    with ( ["Medication, Administered": "cyclophosphamide 1000 MG Injection"]
      union ["Medication, Administered": "cyclophosphamide 500 MG Injection"] ) Cyclophosphamide
      such that Global."NormalizeInterval" ( Anthracycline.relevantDatetime, Anthracycline.relevantPeriod ) starts same day as start of Global."NormalizeInterval" ( Cyclophosphamide.relevantDatetime, Cyclophosphamide.relevantPeriod )

define "Cancer Diagnosis":
  ["Diagnosis": "Cancer"] Cancer
    where Cancer.prevalencePeriod overlaps "Measurement Period"

define "Has At Least One Visit During Measurement Period":
  exists ( ["Encounter, Performed": "Office Visit"] OfficeVisit
      where OfficeVisit.relevantPeriod during "Measurement Period"
  )

define "Initial Population":
  "Patient Age 18 Years and Older At the Start of Measurement Period"
    and "Has At Least One Visit During Measurement Period"
    and exists "Cancer Diagnosis"

define "Low Emetic Risk Intravenous Antineoplastic Therapy":
  ["Medication, Administered": "Low Emetic Risk Intravenous Antineoplastic Agent"]
    union ["Medication, Administered": "5 ML cytarabine 20 MG/ML Injection"]
    union ( ["Medication, Administered": "cytarabine 20 MG/ML Injectable Solution"] Cytarabine
        where Cytarabine.dosage < 50 'mL'
    )

define "Minimal Risk Intravenous Antineoplastic Therapy":
  ["Medication, Administered": "Minimal Emetic Risk Intravenous Antineoplastic Agent"]

define "Patient Age 18 Years and Older At the Start of Measurement Period":
  AgeInYearsAt(date from start of "Measurement Period")>= 18

define "SDE Ethnicity":
  ["Patient Characteristic Ethnicity": "Ethnicity"]

define "SDE Payer":
  ["Patient Characteristic Payer": "Payer"]

define "SDE Race":
  ["Patient Characteristic Race": "Race"]

define "SDE Sex":
  ["Patient Characteristic Sex": "ONC Administrative Sex"]

define "Denominator 1":
  "First Receipt of Low Emetic Risk Intravenous Antineoplastic Agent During Cycle 1 Day 1 of First Therapy"

define "Denominator 2":
  "First Receipt of Minimal Emetic Risk Intravenous Antineoplastic Agent During Cycle 1 Day 1 of First Therapy"

define "Numerator 1":
  exists "Inappropriate Antiemetic Treatment for Low Emetic Risk Intravenous Antineoplastic Therapy"

define "Numerator 2":
  exists "Inappropriate Antiemetic Treatment for Minimal Emetic Risk Intravenous Antineoplastic Therapy"

define "Inappropriate Antiemetic Treatment for Minimal Emetic Risk Intravenous Antineoplastic Therapy":
  "Antiemetic Therapy Administered Same Day as Cycle 1 Day 1 Minimal Emetic Risk"
    union "Antiemetic Therapy Active within 90 Days Prior to Cycle 1 Day 1 Minimal Emetic Risk"
    union "Antiemetic Therapy Ordered Same Day or within 89 Days Prior to Cycle 1 Day 1 Minimal Emetic Risk"

define "Cycle 1 Day 1 Low Emetic Risk Intravenous Antineoplastic Therapy During Measurement Period":
  First("Low Emetic Risk Intravenous Antineoplastic Therapy" LowEmeticRisk
      where Global."NormalizeInterval"(LowEmeticRisk.relevantDatetime, LowEmeticRisk.relevantPeriod)starts during "Measurement Period"
      sort by start of Global."NormalizeInterval"(relevantDatetime, relevantPeriod)asc
  )

define "Cycle 1 Day 1 Minimal Emetic Risk Intravenous Antineoplastic Therapy During Measurement Period":
  First("Minimal Risk Intravenous Antineoplastic Therapy" MinimalEmeticRisk
      where Global."NormalizeInterval"(MinimalEmeticRisk.relevantDatetime, MinimalEmeticRisk.relevantPeriod)starts during "Measurement Period"
      sort by start of Global."NormalizeInterval"(relevantDatetime, relevantPeriod)asc
  )

define "Antiemetic Therapy Active within 90 Days Prior to Cycle 1 Day 1 Minimal Emetic Risk":
  ["Medication, Active": "Antiemetic Agent"] AntiemeticAgentActive
    with "Cycle 1 Day 1 Minimal Emetic Risk Intravenous Antineoplastic Therapy During Measurement Period" Cycle1Day1MinimalEmetic
      such that AntiemeticAgentActive.relevantPeriod starts 90 days or less before day of start of Global."NormalizeInterval" ( Cycle1Day1MinimalEmetic.relevantDatetime, Cycle1Day1MinimalEmetic.relevantPeriod )
        and AntiemeticAgentActive.relevantPeriod ends on or after start of Global."NormalizeInterval" ( Cycle1Day1MinimalEmetic.relevantDatetime, Cycle1Day1MinimalEmetic.relevantPeriod )

define "Antiemetic Therapy Administered Same Day as Cycle 1 Day 1 Minimal Emetic Risk":
  ["Medication, Administered": "Antiemetic Agent"] AntiemeticAdministered
    with "Cycle 1 Day 1 Minimal Emetic Risk Intravenous Antineoplastic Therapy During Measurement Period" Cycle1Day1MinimalEmetic
      such that Global."NormalizeInterval" ( AntiemeticAdministered.relevantDatetime, AntiemeticAdministered.relevantPeriod ) starts same day as start of Global."NormalizeInterval" ( Cycle1Day1MinimalEmetic.relevantDatetime, Cycle1Day1MinimalEmetic.relevantPeriod )

define "Antiemetic Therapy Ordered Same Day or within 89 Days Prior to Cycle 1 Day 1 Minimal Emetic Risk":
  ["Medication, Order": "Antiemetic Agent"] AntiemeticAgentOrder
    with "Cycle 1 Day 1 Minimal Emetic Risk Intravenous Antineoplastic Therapy During Measurement Period" Cycle1Day1MinimalEmetic
      such that AntiemeticAgentOrder.authorDatetime during Interval[start of Global."NormalizeInterval" ( Cycle1Day1MinimalEmetic.relevantDatetime, Cycle1Day1MinimalEmetic.relevantPeriod ) - 89 days, start of Global."NormalizeInterval" ( Cycle1Day1MinimalEmetic.relevantDatetime, Cycle1Day1MinimalEmetic.relevantPeriod )]

define "First Receipt of Low Emetic Risk Intravenous Antineoplastic Agent During Cycle 1 Day 1 of First Therapy":
  ( "Cycle 1 Day 1 Low Emetic Risk Intravenous Antineoplastic Therapy During Measurement Period" FirstChemoLow
      without ( "High Emetic Risk Intravenous Antineoplastic Therapy"
        union "Moderate Emetic Risk Intravenous Antineoplastic Therapy"
        union "Low Emetic Risk Intravenous Antineoplastic Therapy"
        union "Minimal Risk Intravenous Antineoplastic Therapy" ) PriorChemo
        such that Global."NormalizeInterval" ( PriorChemo.relevantDatetime, PriorChemo.relevantPeriod ) starts before start of Global."NormalizeInterval" ( FirstChemoLow.relevantDatetime, FirstChemoLow.relevantPeriod )
      without ( "High Emetic Risk Intravenous Antineoplastic Therapy"
        union "Moderate Emetic Risk Intravenous Antineoplastic Therapy" ) HighModerateEmeticRisk
        such that Global."NormalizeInterval" ( HighModerateEmeticRisk.relevantDatetime, HighModerateEmeticRisk.relevantPeriod ) starts same day as start of Global."NormalizeInterval" ( FirstChemoLow.relevantDatetime, FirstChemoLow.relevantPeriod )
  ) is not null
    or ( "Cycle 1 Day 1 Low Emetic Risk Intravenous Antineoplastic Therapy During Measurement Period" FirstChemoLow
        with "Minimal Risk Intravenous Antineoplastic Therapy" MinimalEmetic
          such that Global."NormalizeInterval" ( FirstChemoLow.relevantDatetime, FirstChemoLow.relevantPeriod ) starts same day as start of Global."NormalizeInterval" ( MinimalEmetic.relevantDatetime, MinimalEmetic.relevantPeriod )
        without ( "High Emetic Risk Intravenous Antineoplastic Therapy"
          union "Moderate Emetic Risk Intravenous Antineoplastic Therapy"
          union "Low Emetic Risk Intravenous Antineoplastic Therapy"
          union "Minimal Risk Intravenous Antineoplastic Therapy" ) PriorChemo
          such that Global."NormalizeInterval" ( PriorChemo.relevantDatetime, PriorChemo.relevantPeriod ) starts before start of Global."NormalizeInterval" ( FirstChemoLow.relevantDatetime, FirstChemoLow.relevantPeriod )
        without ( "High Emetic Risk Intravenous Antineoplastic Therapy"
          union "Moderate Emetic Risk Intravenous Antineoplastic Therapy" ) HighMod
          such that Global."NormalizeInterval" ( HighMod.relevantDatetime, HighMod.relevantPeriod ) starts same day as start of Global."NormalizeInterval" ( FirstChemoLow.relevantDatetime, FirstChemoLow.relevantPeriod )
    ) is not null

define "First Receipt of Minimal Emetic Risk Intravenous Antineoplastic Agent During Cycle 1 Day 1 of First Therapy":
  ( "Cycle 1 Day 1 Minimal Emetic Risk Intravenous Antineoplastic Therapy During Measurement Period" FirstChemoMin
      without ( "High Emetic Risk Intravenous Antineoplastic Therapy"
        union "Moderate Emetic Risk Intravenous Antineoplastic Therapy"
        union "Low Emetic Risk Intravenous Antineoplastic Therapy"
        union "Minimal Risk Intravenous Antineoplastic Therapy" ) PriorChemo
        such that Global."NormalizeInterval" ( PriorChemo.relevantDatetime, PriorChemo.relevantPeriod ) starts before start of Global."NormalizeInterval" ( FirstChemoMin.relevantDatetime, FirstChemoMin.relevantPeriod )
      without ( "High Emetic Risk Intravenous Antineoplastic Therapy"
        union "Moderate Emetic Risk Intravenous Antineoplastic Therapy"
        union "Low Emetic Risk Intravenous Antineoplastic Therapy" ) HighModLow
        such that Global."NormalizeInterval" ( HighModLow.relevantDatetime, HighModLow.relevantPeriod ) starts same day as start of Global."NormalizeInterval" ( FirstChemoMin.relevantDatetime, FirstChemoMin.relevantPeriod )
  ) is not null

define "Neurokinin 1 Receptor Antagonist or Olanzapine Administered Same Day as Cycle 1 Day 1 Low Emetic Risk":
  ( ["Medication, Administered": "Neurokinin 1 Receptor Antagonist"]
    union ["Medication, Administered": "Olanzapine"] ) AntiemeticAgentAdminLow
    with "Cycle 1 Day 1 Low Emetic Risk Intravenous Antineoplastic Therapy During Measurement Period" Cycle1Day1LowEmetic
      such that Global."NormalizeInterval" ( AntiemeticAgentAdminLow.relevantDatetime, AntiemeticAgentAdminLow.relevantPeriod ) starts same day as start of Global."NormalizeInterval" ( Cycle1Day1LowEmetic.relevantDatetime, Cycle1Day1LowEmetic.relevantPeriod )

define "Neurokinin 1 Receptor Antagonist or Olanzapine Ordered Same Day or within 89 Days Prior to Cycle 1 Day 1 Low Emetic Risk":
  ( ["Medication, Order": "Neurokinin 1 Receptor Antagonist"]
    union ["Medication, Order": "Olanzapine"] ) AntiemeticAgentOrderLow
    with "Cycle 1 Day 1 Low Emetic Risk Intravenous Antineoplastic Therapy During Measurement Period" Cycle1Day1LowEmetic
      such that AntiemeticAgentOrderLow.authorDatetime during Interval[start of Global."NormalizeInterval" ( Cycle1Day1LowEmetic.relevantDatetime, Cycle1Day1LowEmetic.relevantPeriod ) - 89 days, start of Global."NormalizeInterval" ( Cycle1Day1LowEmetic.relevantDatetime, Cycle1Day1LowEmetic.relevantPeriod )]

define "Neurokinin 1 Receptor Antagonist or Olanzapine Active within 90 Days Prior to Cycle 1 Day 1 Low Emetic Risk":
  ( ["Medication, Active": "Neurokinin 1 Receptor Antagonist"]
    union ["Medication, Active": "Olanzapine"] ) AntiemeticAgentActiveLow
    with "Cycle 1 Day 1 Low Emetic Risk Intravenous Antineoplastic Therapy During Measurement Period" Cycle1Day1LowEmetic
      such that AntiemeticAgentActiveLow.relevantPeriod starts 90 days or less before day of start of Global."NormalizeInterval" ( Cycle1Day1LowEmetic.relevantDatetime, Cycle1Day1LowEmetic.relevantPeriod )
        and AntiemeticAgentActiveLow.relevantPeriod ends on or after start of Global."NormalizeInterval" ( Cycle1Day1LowEmetic.relevantDatetime, Cycle1Day1LowEmetic.relevantPeriod )

define "Inappropriate Antiemetic Treatment for Low Emetic Risk Intravenous Antineoplastic Therapy":
  "Neurokinin 1 Receptor Antagonist or Olanzapine Administered Same Day as Cycle 1 Day 1 Low Emetic Risk"
    union "Neurokinin 1 Receptor Antagonist or Olanzapine Active within 90 Days Prior to Cycle 1 Day 1 Low Emetic Risk"
    union "Neurokinin 1 Receptor Antagonist or Olanzapine Ordered Same Day or within 89 Days Prior to Cycle 1 Day 1 Low Emetic Risk"

define "High Emetic Risk Intravenous Antineoplastic Therapy":
  ["Medication, Administered": "High Emetic Risk Intravenous Antineoplastic Agent"]
    union "Anthracycline with Cyclophosphamide"
    union ( ["Medication, Administered": "Cyclophosphamide Injectable"] Cyclophosphamide
        where Cyclophosphamide.dosage >= 1500 'mg/m2'
    )

define "Moderate Emetic Risk Intravenous Antineoplastic Therapy":
  ["Medication, Administered": "Moderate Emetic Risk Intravenous Antineoplastic Agent"]
    union ( ["Medication, Administered": "cytarabine 20 MG/ML Injectable Solution"] CytarabineModerate
        where CytarabineModerate.dosage >= 50 'mL'
    )
    union ( ["Medication, Administered": "Cyclophosphamide Injectable"] Cyclophosphamide
        where Cyclophosphamide.dosage < 1500 'mg/m2'
    )
`;
