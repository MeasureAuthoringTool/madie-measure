export const MeasureCQL = `library CMS108Reduced version '0.3.004'

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

define function "fun"("notPascalCase" Integer ):
  true`;

export const ELM_JSON = `
{
  "errorExceptions": [
    {
      "startLine": 57,
      "startChar": 150,
      "endLine": 57,
      "endChar": 158,
      "errorType": "ELM",
      "errorSeverity": "Error",
      "targetIncludeLibraryId": "CMS108Reduced",
      "targetIncludeLibraryVersionId": "0.3.004",
      "type": null,
      "message": "Member performed not found for type MedicationAdministration."
    },
    {
      "startLine": 57,
      "startChar": 114,
      "endLine": 57,
      "endChar": 159,
      "errorType": "ELM",
      "errorSeverity": "Error",
      "targetIncludeLibraryId": "CMS108Reduced",
      "targetIncludeLibraryVersionId": "0.3.004",
      "type": null,
      "message": "Could not determine signature for invocation of operator Global.Normalize Interval."
    },
    {
      "startLine": 57,
      "startChar": 43,
      "endLine": 57,
      "endChar": 160,
      "errorType": "ELM",
      "errorSeverity": "Error",
      "targetIncludeLibraryId": "CMS108Reduced",
      "targetIncludeLibraryVersionId": "0.3.004",
      "type": null,
      "message": "Could not determine signature for invocation of operator Coalesce."
    },
    {
      "startLine": 57,
      "startChar": 161,
      "endLine": 57,
      "endChar": 173,
      "errorType": "ELM",
      "errorSeverity": "Error",
      "targetIncludeLibraryId": "CMS108Reduced",
      "targetIncludeLibraryVersionId": "0.3.004",
      "type": null,
      "message": "Could not determine signature for invocation of operator System.Start."
    },
    {
      "startLine": 57,
      "startChar": 37,
      "endLine": 57,
      "endChar": 243,
      "errorType": "ELM",
      "errorSeverity": "Error",
      "targetIncludeLibraryId": "CMS108Reduced",
      "targetIncludeLibraryVersionId": "0.3.004",
      "type": null,
      "message": "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'."
    }
  ],
  "library": {
    "annotation": [
      {
        "libraryId": "CMS108Reduced",
        "libraryVersion": "0.3.004",
        "startLine": 57,
        "startChar": 150,
        "endLine": 57,
        "endChar": 158,
        "message": "Member performed not found for type MedicationAdministration.",
        "errorType": "semantic",
        "errorSeverity": "Error",
        "type": "CqlToElmError"
      },
      {
        "libraryId": "CMS108Reduced",
        "libraryVersion": "0.3.004",
        "startLine": 57,
        "startChar": 114,
        "endLine": 57,
        "endChar": 159,
        "message": "Could not determine signature for invocation of operator Global.Normalize Interval.",
        "errorType": "semantic",
        "errorSeverity": "Error",
        "type": "CqlToElmError"
      },
      {
        "libraryId": "CMS108Reduced",
        "libraryVersion": "0.3.004",
        "startLine": 57,
        "startChar": 43,
        "endLine": 57,
        "endChar": 160,
        "message": "Could not determine signature for invocation of operator Coalesce.",
        "errorType": "semantic",
        "errorSeverity": "Error",
        "type": "CqlToElmError"
      },
      {
        "libraryId": "CMS108Reduced",
        "libraryVersion": "0.3.004",
        "startLine": 57,
        "startChar": 161,
        "endLine": 57,
        "endChar": 173,
        "message": "Could not determine signature for invocation of operator System.Start.",
        "errorType": "semantic",
        "errorSeverity": "Error",
        "type": "CqlToElmError"
      },
      {
        "libraryId": "CMS108Reduced",
        "libraryVersion": "0.3.004",
        "startLine": 57,
        "startChar": 37,
        "endLine": 57,
        "endChar": 243,
        "message": "Expected an expression of type 'System.Boolean', but found an expression of type '<unknown>'.",
        "errorType": "semantic",
        "errorSeverity": "Error",
        "type": "CqlToElmError"
      }
    ],
    "identifier": {
      "id": "CMS108Reduced",
      "version": "0.3.004"
    },
    "schemaIdentifier": {
      "id": "urn:hl7-org:elm",
      "version": "r1"
    },
    "usings": {
      "def": [
        {
          "localIdentifier": "System",
          "uri": "urn:hl7-org:elm-types:r1"
        },
        {
          "localId": "1",
          "locator": "3:1-3:26",
          "localIdentifier": "FHIR",
          "uri": "http://hl7.org/fhir",
          "version": "4.0.1",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "1",
                "s": [
                  {
                    "value": [
                      "",
                      "using "
                    ]
                  },
                  {
                    "s": [
                      {
                        "value": [
                          "FHIR"
                        ]
                      }
                    ]
                  },
                  {
                    "value": [
                      " version ",
                      "'4.0.1'"
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    "includes": {
      "def": [
        {
          "localId": "2",
          "locator": "5:1-5:56",
          "localIdentifier": "FHIRHelpers",
          "path": "FHIRHelpers",
          "version": "4.0.001",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "2",
                "s": [
                  {
                    "value": [
                      "",
                      "include "
                    ]
                  },
                  {
                    "s": [
                      {
                        "value": [
                          "FHIRHelpers"
                        ]
                      }
                    ]
                  },
                  {
                    "value": [
                      " version ",
                      "'4.0.001'",
                      " called ",
                      "FHIRHelpers"
                    ]
                  }
                ]
              }
            }
          ]
        },
        {
          "localId": "3",
          "locator": "6:1-6:66",
          "localIdentifier": "SDE",
          "path": "SupplementalDataElementsFHIR4",
          "version": "2.0.000",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "3",
                "s": [
                  {
                    "value": [
                      "",
                      "include "
                    ]
                  },
                  {
                    "s": [
                      {
                        "value": [
                          "SupplementalDataElementsFHIR4"
                        ]
                      }
                    ]
                  },
                  {
                    "value": [
                      " version ",
                      "'2.0.000'",
                      " called ",
                      "SDE"
                    ]
                  }
                ]
              }
            }
          ]
        },
        {
          "localId": "4",
          "locator": "7:1-7:69",
          "localIdentifier": "Global",
          "path": "MATGlobalCommonFunctionsFHIR4",
          "version": "5.0.000",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "4",
                "s": [
                  {
                    "value": [
                      "",
                      "include "
                    ]
                  },
                  {
                    "s": [
                      {
                        "value": [
                          "MATGlobalCommonFunctionsFHIR4"
                        ]
                      }
                    ]
                  },
                  {
                    "value": [
                      " version ",
                      "'5.0.000'",
                      " called ",
                      "Global"
                    ]
                  }
                ]
              }
            }
          ]
        },
        {
          "localId": "5",
          "locator": "8:1-8:52",
          "localIdentifier": "TJC",
          "path": "TJCOverallFHIR4",
          "version": "5.0.000",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "5",
                "s": [
                  {
                    "value": [
                      "",
                      "include "
                    ]
                  },
                  {
                    "s": [
                      {
                        "value": [
                          "TJCOverallFHIR4"
                        ]
                      }
                    ]
                  },
                  {
                    "value": [
                      " version ",
                      "'5.0.000'",
                      " called ",
                      "TJC"
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    "parameters": {
      "def": [
        {
          "localId": "22",
          "locator": "24:1-24:48",
          "name": "Measurement Period",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "22",
                "s": [
                  {
                    "value": [
                      "",
                      "parameter ",
                      "\\"Measurement Period\\"",
                      " "
                    ]
                  },
                  {
                    "r": "21",
                    "s": [
                      {
                        "value": [
                          "Interval<"
                        ]
                      },
                      {
                        "r": "20",
                        "s": [
                          {
                            "value": [
                              "Integer"
                            ]
                          }
                        ]
                      },
                      {
                        "value": [
                          ">"
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          ],
          "resultTypeSpecifier": {
            "type": "IntervalTypeSpecifier",
            "pointType": {
              "name": "{urn:hl7-org:elm-types:r1}Integer",
              "type": "NamedTypeSpecifier"
            }
          },
          "parameterTypeSpecifier": {
            "localId": "21",
            "locator": "24:32-24:48",
            "type": "IntervalTypeSpecifier",
            "resultTypeSpecifier": {
              "type": "IntervalTypeSpecifier",
              "pointType": {
                "name": "{urn:hl7-org:elm-types:r1}Integer",
                "type": "NamedTypeSpecifier"
              }
            },
            "pointType": {
              "localId": "20",
              "locator": "24:41-24:47",
              "resultTypeName": "{urn:hl7-org:elm-types:r1}Integer",
              "name": "{urn:hl7-org:elm-types:r1}Integer",
              "type": "NamedTypeSpecifier"
            }
          }
        }
      ]
    },
    "codeSystems": {
      "def": [
        {
          "localId": "6",
          "locator": "10:1-10:38",
          "resultTypeName": "{urn:hl7-org:elm-types:r1}CodeSystem",
          "name": "LOINC",
          "id": "http://loinc.org",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "6",
                "s": [
                  {
                    "value": [
                      "",
                      "codesystem ",
                      "\\"LOINC\\"",
                      ": ",
                      "'http://loinc.org'"
                    ]
                  }
                ]
              }
            }
          ]
        },
        {
          "localId": "7",
          "locator": "11:1-11:47",
          "resultTypeName": "{urn:hl7-org:elm-types:r1}CodeSystem",
          "name": "SNOMEDCT",
          "id": "http://snomed.info/sct",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "7",
                "s": [
                  {
                    "value": [
                      "",
                      "codesystem ",
                      "\\"SNOMEDCT\\"",
                      ": ",
                      "'http://snomed.info/sct'"
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    "valueSets": {
      "def": [
        {
          "localId": "8",
          "locator": "13:1-13:99",
          "resultTypeName": "{urn:hl7-org:elm-types:r1}ValueSet",
          "name": "Device Application",
          "id": "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1110.48",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "8",
                "s": [
                  {
                    "value": [
                      "",
                      "valueset ",
                      "\\"Device Application\\"",
                      ": ",
                      "'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1110.48'"
                    ]
                  }
                ]
              }
            }
          ]
        },
        {
          "localId": "9",
          "locator": "14:1-14:135",
          "resultTypeName": "{urn:hl7-org:elm-types:r1}ValueSet",
          "name": "Injectable Factor Xa Inhibitor for VTE Prophylaxis",
          "id": "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.211",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "9",
                "s": [
                  {
                    "value": [
                      "",
                      "valueset ",
                      "\\"Injectable Factor Xa Inhibitor for VTE Prophylaxis\\"",
                      ": ",
                      "'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.211'"
                    ]
                  }
                ]
              }
            }
          ]
        },
        {
          "localId": "10",
          "locator": "15:1-15:133",
          "resultTypeName": "{urn:hl7-org:elm-types:r1}ValueSet",
          "name": "Intermittent pneumatic compression devices (IPC)",
          "id": "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.214",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "10",
                "s": [
                  {
                    "value": [
                      "",
                      "valueset ",
                      "\\"Intermittent pneumatic compression devices (IPC)\\"",
                      ": ",
                      "'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.214'"
                    ]
                  }
                ]
              }
            }
          ]
        },
        {
          "localId": "11",
          "locator": "16:1-16:132",
          "resultTypeName": "{urn:hl7-org:elm-types:r1}ValueSet",
          "name": "Low Dose Unfractionated Heparin for VTE Prophylaxis",
          "id": "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1045.39",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "11",
                "s": [
                  {
                    "value": [
                      "",
                      "valueset ",
                      "\\"Low Dose Unfractionated Heparin for VTE Prophylaxis\\"",
                      ": ",
                      "'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1045.39'"
                    ]
                  }
                ]
              }
            }
          ]
        },
        {
          "localId": "12",
          "locator": "17:1-17:133",
          "resultTypeName": "{urn:hl7-org:elm-types:r1}ValueSet",
          "name": "Low Molecular Weight Heparin for VTE Prophylaxis",
          "id": "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.219",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "12",
                "s": [
                  {
                    "value": [
                      "",
                      "valueset ",
                      "\\"Low Molecular Weight Heparin for VTE Prophylaxis\\"",
                      ": ",
                      "'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.219'"
                    ]
                  }
                ]
              }
            }
          ]
        },
        {
          "localId": "13",
          "locator": "18:1-18:93",
          "resultTypeName": "{urn:hl7-org:elm-types:r1}ValueSet",
          "name": "Warfarin",
          "id": "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.232",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "13",
                "s": [
                  {
                    "value": [
                      "",
                      "valueset ",
                      "\\"Warfarin\\"",
                      ": ",
                      "'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.117.1.7.1.232'"
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    "codes": {
      "def": [
        {
          "localId": "15",
          "locator": "20:1-20:153",
          "resultTypeName": "{urn:hl7-org:elm-types:r1}Code",
          "name": "Amdinocillin [Susceptibility] by Serum bactericidal titer",
          "id": "10-9",
          "display": "Amdinocillin [Susceptibility] by Serum bactericidal titer",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "15",
                "s": [
                  {
                    "value": [
                      "",
                      "code ",
                      "\\"Amdinocillin [Susceptibility] by Serum bactericidal titer\\"",
                      ": ",
                      "'10-9'",
                      " from "
                    ]
                  },
                  {
                    "r": "14",
                    "s": [
                      {
                        "value": [
                          "\\"LOINC\\""
                        ]
                      }
                    ]
                  },
                  {
                    "value": [
                      " display ",
                      "'Amdinocillin [Susceptibility] by Serum bactericidal titer'"
                    ]
                  }
                ]
              }
            }
          ],
          "codeSystem": {
            "localId": "14",
            "locator": "20:79-20:85",
            "resultTypeName": "{urn:hl7-org:elm-types:r1}CodeSystem",
            "name": "LOINC"
          }
        },
        {
          "localId": "17",
          "locator": "21:1-21:100",
          "resultTypeName": "{urn:hl7-org:elm-types:r1}Code",
          "name": "Body mass index (BMI) [Ratio]",
          "id": "39156-5",
          "display": "Body mass index (BMI) [Ratio]",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "17",
                "s": [
                  {
                    "value": [
                      "",
                      "code ",
                      "\\"Body mass index (BMI) [Ratio]\\"",
                      ": ",
                      "'39156-5'",
                      " from "
                    ]
                  },
                  {
                    "r": "16",
                    "s": [
                      {
                        "value": [
                          "\\"LOINC\\""
                        ]
                      }
                    ]
                  },
                  {
                    "value": [
                      " display ",
                      "'Body mass index (BMI) [Ratio]'"
                    ]
                  }
                ]
              }
            }
          ],
          "codeSystem": {
            "localId": "16",
            "locator": "21:54-21:60",
            "resultTypeName": "{urn:hl7-org:elm-types:r1}CodeSystem",
            "name": "LOINC"
          }
        },
        {
          "localId": "19",
          "locator": "22:1-22:151",
          "resultTypeName": "{urn:hl7-org:elm-types:r1}Code",
          "name": "Goldmann three-mirror contact lens (physical object)",
          "id": "420523002",
          "display": "Goldmann three-mirror contact lens (physical object)",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "19",
                "s": [
                  {
                    "value": [
                      "",
                      "code ",
                      "\\"Goldmann three-mirror contact lens (physical object)\\"",
                      ": ",
                      "'420523002'",
                      " from "
                    ]
                  },
                  {
                    "r": "18",
                    "s": [
                      {
                        "value": [
                          "\\"SNOMEDCT\\""
                        ]
                      }
                    ]
                  },
                  {
                    "value": [
                      " display ",
                      "'Goldmann three-mirror contact lens (physical object)'"
                    ]
                  }
                ]
              }
            }
          ],
          "codeSystem": {
            "localId": "18",
            "locator": "22:79-22:88",
            "resultTypeName": "{urn:hl7-org:elm-types:r1}CodeSystem",
            "name": "SNOMEDCT"
          }
        }
      ]
    },
    "contexts": {
      "def": [
        {
          "locator": "26:1-26:15",
          "name": "Patient"
        }
      ]
    },
    "statements": {
      "def": [
        {
          "locator": "26:1-26:15",
          "name": "Patient",
          "context": "Patient",
          "expression": {
            "type": "SingletonFrom",
            "operand": {
              "locator": "26:1-26:15",
              "dataType": "{http://hl7.org/fhir}Patient",
              "templateId": "http://hl7.org/fhir/StructureDefinition/Patient",
              "type": "Retrieve"
            }
          }
        },
        {
          "localId": "25",
          "locator": "28:1-29:21",
          "name": "SDE Ethnicity",
          "context": "Patient",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "25",
                "s": [
                  {
                    "value": [
                      "",
                      "define ",
                      "\\"SDE Ethnicity\\"",
                      ":\\n  "
                    ]
                  },
                  {
                    "r": "24",
                    "s": [
                      {
                        "r": "23",
                        "s": [
                          {
                            "value": [
                              "SDE"
                            ]
                          }
                        ]
                      },
                      {
                        "value": [
                          "."
                        ]
                      },
                      {
                        "r": "24",
                        "s": [
                          {
                            "value": [
                              "\\"SDE Ethnicity\\""
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          ],
          "resultTypeSpecifier": {
            "type": "ListTypeSpecifier",
            "elementType": {
              "name": "{http://hl7.org/fhir}Coding",
              "type": "NamedTypeSpecifier"
            }
          },
          "expression": {
            "localId": "24",
            "locator": "29:3-29:21",
            "name": "SDE Ethnicity",
            "libraryName": "SDE",
            "type": "ExpressionRef",
            "resultTypeSpecifier": {
              "type": "ListTypeSpecifier",
              "elementType": {
                "name": "{http://hl7.org/fhir}Coding",
                "type": "NamedTypeSpecifier"
              }
            }
          }
        },
        {
          "localId": "28",
          "locator": "31:1-32:17",
          "name": "SDE Payer",
          "context": "Patient",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "28",
                "s": [
                  {
                    "value": [
                      "",
                      "define ",
                      "\\"SDE Payer\\"",
                      ":\\n  "
                    ]
                  },
                  {
                    "r": "27",
                    "s": [
                      {
                        "r": "26",
                        "s": [
                          {
                            "value": [
                              "SDE"
                            ]
                          }
                        ]
                      },
                      {
                        "value": [
                          "."
                        ]
                      },
                      {
                        "r": "27",
                        "s": [
                          {
                            "value": [
                              "\\"SDE Payer\\""
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          ],
          "resultTypeSpecifier": {
            "type": "ListTypeSpecifier",
            "elementType": {
              "type": "TupleTypeSpecifier",
              "element": [
                {
                  "name": "code",
                  "elementType": {
                    "name": "{http://hl7.org/fhir}CodeableConcept",
                    "type": "NamedTypeSpecifier"
                  }
                },
                {
                  "name": "period",
                  "elementType": {
                    "name": "{http://hl7.org/fhir}Period",
                    "type": "NamedTypeSpecifier"
                  }
                }
              ]
            }
          },
          "expression": {
            "localId": "27",
            "locator": "32:3-32:17",
            "name": "SDE Payer",
            "libraryName": "SDE",
            "type": "ExpressionRef",
            "resultTypeSpecifier": {
              "type": "ListTypeSpecifier",
              "elementType": {
                "type": "TupleTypeSpecifier",
                "element": [
                  {
                    "name": "code",
                    "elementType": {
                      "name": "{http://hl7.org/fhir}CodeableConcept",
                      "type": "NamedTypeSpecifier"
                    }
                  },
                  {
                    "name": "period",
                    "elementType": {
                      "name": "{http://hl7.org/fhir}Period",
                      "type": "NamedTypeSpecifier"
                    }
                  }
                ]
              }
            }
          }
        },
        {
          "localId": "31",
          "locator": "34:1-35:16",
          "name": "SDE Race",
          "context": "Patient",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "31",
                "s": [
                  {
                    "value": [
                      "",
                      "define ",
                      "\\"SDE Race\\"",
                      ":\\n  "
                    ]
                  },
                  {
                    "r": "30",
                    "s": [
                      {
                        "r": "29",
                        "s": [
                          {
                            "value": [
                              "SDE"
                            ]
                          }
                        ]
                      },
                      {
                        "value": [
                          "."
                        ]
                      },
                      {
                        "r": "30",
                        "s": [
                          {
                            "value": [
                              "\\"SDE Race\\""
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          ],
          "resultTypeSpecifier": {
            "type": "ListTypeSpecifier",
            "elementType": {
              "name": "{http://hl7.org/fhir}Coding",
              "type": "NamedTypeSpecifier"
            }
          },
          "expression": {
            "localId": "30",
            "locator": "35:3-35:16",
            "name": "SDE Race",
            "libraryName": "SDE",
            "type": "ExpressionRef",
            "resultTypeSpecifier": {
              "type": "ListTypeSpecifier",
              "elementType": {
                "name": "{http://hl7.org/fhir}Coding",
                "type": "NamedTypeSpecifier"
              }
            }
          }
        },
        {
          "localId": "34",
          "locator": "37:1-38:15",
          "resultTypeName": "{urn:hl7-org:elm-types:r1}Code",
          "name": "SDE Sex",
          "context": "Patient",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "34",
                "s": [
                  {
                    "value": [
                      "",
                      "define ",
                      "\\"SDE Sex\\"",
                      ":\\n  "
                    ]
                  },
                  {
                    "r": "33",
                    "s": [
                      {
                        "r": "32",
                        "s": [
                          {
                            "value": [
                              "SDE"
                            ]
                          }
                        ]
                      },
                      {
                        "value": [
                          "."
                        ]
                      },
                      {
                        "r": "33",
                        "s": [
                          {
                            "value": [
                              "\\"SDE Sex\\""
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          ],
          "expression": {
            "localId": "33",
            "locator": "38:3-38:15",
            "resultTypeName": "{urn:hl7-org:elm-types:r1}Code",
            "name": "SDE Sex",
            "libraryName": "SDE",
            "type": "ExpressionRef"
          }
        },
        {
          "localId": "52",
          "locator": "43:1-46:170",
          "name": "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions",
          "context": "Patient",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "52",
                "s": [
                  {
                    "value": [
                      "",
                      "define ",
                      "\\"Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions\\"",
                      ":\\n  "
                    ]
                  },
                  {
                    "r": "51",
                    "s": [
                      {
                        "s": [
                          {
                            "r": "36",
                            "s": [
                              {
                                "r": "35",
                                "s": [
                                  {
                                    "s": [
                                      {
                                        "value": [
                                          "Global",
                                          ".",
                                          "\\"Inpatient Encounter\\""
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              },
                              {
                                "value": [
                                  " ",
                                  "InpatientEncounter"
                                ]
                              }
                            ]
                          }
                        ]
                      },
                      {
                        "value": [
                          "\\n                                        "
                        ]
                      },
                      {
                        "r": "50",
                        "s": [
                          {
                            "value": [
                              "with "
                            ]
                          },
                          {
                            "r": "38",
                            "s": [
                              {
                                "r": "37",
                                "s": [
                                  {
                                    "r": "37",
                                    "s": [
                                      {
                                        "value": [
                                          "[",
                                          "\\"Patient\\"",
                                          "]"
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              },
                              {
                                "value": [
                                  " ",
                                  "BirthDate"
                                ]
                              }
                            ]
                          },
                          {
                            "value": [
                              "\\n                                          such that "
                            ]
                          },
                          {
                            "r": "49",
                            "s": [
                              {
                                "r": "47",
                                "s": [
                                  {
                                    "r": "39",
                                    "s": [
                                      {
                                        "value": [
                                          "Global"
                                        ]
                                      }
                                    ]
                                  },
                                  {
                                    "value": [
                                      "."
                                    ]
                                  },
                                  {
                                    "r": "47",
                                    "s": [
                                      {
                                        "value": [
                                          "\\"CalendarAgeInYearsAt\\"",
                                          " ( "
                                        ]
                                      },
                                      {
                                        "r": "43",
                                        "s": [
                                          {
                                            "r": "40",
                                            "s": [
                                              {
                                                "value": [
                                                  "FHIRHelpers"
                                                ]
                                              }
                                            ]
                                          },
                                          {
                                            "value": [
                                              "."
                                            ]
                                          },
                                          {
                                            "r": "43",
                                            "s": [
                                              {
                                                "value": [
                                                  "ToDate",
                                                  " ( "
                                                ]
                                              },
                                              {
                                                "r": "42",
                                                "s": [
                                                  {
                                                    "r": "41",
                                                    "s": [
                                                      {
                                                        "value": [
                                                          "BirthDate"
                                                        ]
                                                      }
                                                    ]
                                                  },
                                                  {
                                                    "value": [
                                                      "."
                                                    ]
                                                  },
                                                  {
                                                    "r": "42",
                                                    "s": [
                                                      {
                                                        "value": [
                                                          "birthDate"
                                                        ]
                                                      }
                                                    ]
                                                  }
                                                ]
                                              },
                                              {
                                                "value": [
                                                  " )"
                                                ]
                                              }
                                            ]
                                          }
                                        ]
                                      },
                                      {
                                        "value": [
                                          ", "
                                        ]
                                      },
                                      {
                                        "r": "46",
                                        "s": [
                                          {
                                            "value": [
                                              "start of "
                                            ]
                                          },
                                          {
                                            "r": "45",
                                            "s": [
                                              {
                                                "r": "44",
                                                "s": [
                                                  {
                                                    "value": [
                                                      "InpatientEncounter"
                                                    ]
                                                  }
                                                ]
                                              },
                                              {
                                                "value": [
                                                  "."
                                                ]
                                              },
                                              {
                                                "r": "45",
                                                "s": [
                                                  {
                                                    "value": [
                                                      "period"
                                                    ]
                                                  }
                                                ]
                                              }
                                            ]
                                          }
                                        ]
                                      },
                                      {
                                        "value": [
                                          " )"
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              },
                              {
                                "r": "48",
                                "value": [
                                  " ",
                                  ">=",
                                  " ",
                                  "18"
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          ],
          "resultTypeSpecifier": {
            "type": "ListTypeSpecifier",
            "elementType": {
              "name": "{http://hl7.org/fhir}Encounter",
              "type": "NamedTypeSpecifier"
            }
          },
          "expression": {
            "localId": "51",
            "locator": "44:3-46:170",
            "type": "Query",
            "resultTypeSpecifier": {
              "type": "ListTypeSpecifier",
              "elementType": {
                "name": "{http://hl7.org/fhir}Encounter",
                "type": "NamedTypeSpecifier"
              }
            },
            "source": [
              {
                "localId": "36",
                "locator": "44:3-44:49",
                "alias": "InpatientEncounter",
                "resultTypeSpecifier": {
                  "type": "ListTypeSpecifier",
                  "elementType": {
                    "name": "{http://hl7.org/fhir}Encounter",
                    "type": "NamedTypeSpecifier"
                  }
                },
                "expression": {
                  "localId": "35",
                  "locator": "44:3-44:30",
                  "name": "Inpatient Encounter",
                  "libraryName": "Global",
                  "type": "ExpressionRef",
                  "resultTypeSpecifier": {
                    "type": "ListTypeSpecifier",
                    "elementType": {
                      "name": "{http://hl7.org/fhir}Encounter",
                      "type": "NamedTypeSpecifier"
                    }
                  }
                }
              }
            ],
            "relationship": [
              {
                "localId": "50",
                "locator": "45:41-46:170",
                "alias": "BirthDate",
                "type": "With",
                "resultTypeSpecifier": {
                  "type": "ListTypeSpecifier",
                  "elementType": {
                    "name": "{http://hl7.org/fhir}Patient",
                    "type": "NamedTypeSpecifier"
                  }
                },
                "expression": {
                  "localId": "37",
                  "locator": "45:46-45:56",
                  "dataType": "{http://hl7.org/fhir}Patient",
                  "templateId": "http://hl7.org/fhir/StructureDefinition/Patient",
                  "type": "Retrieve",
                  "resultTypeSpecifier": {
                    "type": "ListTypeSpecifier",
                    "elementType": {
                      "name": "{http://hl7.org/fhir}Patient",
                      "type": "NamedTypeSpecifier"
                    }
                  }
                },
                "suchThat": {
                  "localId": "49",
                  "locator": "46:53-46:170",
                  "resultTypeName": "{urn:hl7-org:elm-types:r1}Boolean",
                  "type": "GreaterOrEqual",
                  "operand": [
                    {
                      "localId": "47",
                      "locator": "46:53-46:164",
                      "resultTypeName": "{urn:hl7-org:elm-types:r1}Integer",
                      "name": "CalendarAgeInYearsAt",
                      "libraryName": "Global",
                      "type": "FunctionRef",
                      "operand": [
                        {
                          "type": "ToDateTime",
                          "operand": {
                            "localId": "43",
                            "locator": "46:85-46:126",
                            "resultTypeName": "{urn:hl7-org:elm-types:r1}Date",
                            "name": "ToDate",
                            "libraryName": "FHIRHelpers",
                            "type": "FunctionRef",
                            "operand": [
                              {
                                "localId": "42",
                                "locator": "46:106-46:124",
                                "resultTypeName": "{http://hl7.org/fhir}date",
                                "path": "birthDate",
                                "scope": "BirthDate",
                                "type": "Property"
                              }
                            ]
                          }
                        },
                        {
                          "localId": "46",
                          "locator": "46:129-46:162",
                          "resultTypeName": "{urn:hl7-org:elm-types:r1}DateTime",
                          "type": "Start",
                          "operand": {
                            "name": "ToInterval",
                            "libraryName": "FHIRHelpers",
                            "type": "FunctionRef",
                            "operand": [
                              {
                                "localId": "45",
                                "locator": "46:138-46:162",
                                "resultTypeName": "{http://hl7.org/fhir}Period",
                                "path": "period",
                                "scope": "InpatientEncounter",
                                "type": "Property"
                              }
                            ]
                          }
                        }
                      ]
                    },
                    {
                      "localId": "48",
                      "locator": "46:169-46:170",
                      "resultTypeName": "{urn:hl7-org:elm-types:r1}Integer",
                      "valueType": "{urn:hl7-org:elm-types:r1}Integer",
                      "value": "18",
                      "type": "Literal"
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          "localId": "54",
          "locator": "40:1-41:80",
          "name": "Initial Population",
          "context": "Patient",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "54",
                "s": [
                  {
                    "value": [
                      "",
                      "define ",
                      "\\"Initial Population\\"",
                      ":\\n  "
                    ]
                  },
                  {
                    "r": "53",
                    "s": [
                      {
                        "value": [
                          "\\"Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions\\""
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          ],
          "resultTypeSpecifier": {
            "type": "ListTypeSpecifier",
            "elementType": {
              "name": "{http://hl7.org/fhir}Encounter",
              "type": "NamedTypeSpecifier"
            }
          },
          "expression": {
            "localId": "53",
            "locator": "41:3-41:80",
            "name": "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions",
            "type": "ExpressionRef",
            "resultTypeSpecifier": {
              "type": "ListTypeSpecifier",
              "elementType": {
                "name": "{http://hl7.org/fhir}Encounter",
                "type": "NamedTypeSpecifier"
              }
            }
          }
        },
        {
          "localId": "56",
          "locator": "48:1-49:22",
          "name": "Denominator",
          "context": "Patient",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "56",
                "s": [
                  {
                    "value": [
                      "",
                      "define ",
                      "\\"Denominator\\"",
                      ":\\n  "
                    ]
                  },
                  {
                    "r": "55",
                    "s": [
                      {
                        "value": [
                          "\\"Initial Population\\""
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          ],
          "resultTypeSpecifier": {
            "type": "ListTypeSpecifier",
            "elementType": {
              "name": "{http://hl7.org/fhir}Encounter",
              "type": "NamedTypeSpecifier"
            }
          },
          "expression": {
            "localId": "55",
            "locator": "49:3-49:22",
            "name": "Initial Population",
            "type": "ExpressionRef",
            "resultTypeSpecifier": {
              "type": "ListTypeSpecifier",
              "elementType": {
                "name": "{http://hl7.org/fhir}Encounter",
                "type": "NamedTypeSpecifier"
              }
            }
          }
        },
        {
          "localId": "91",
          "locator": "60:1-72:35",
          "name": "VTE Prophylaxis by Medication Administered or Device Applied",
          "context": "Patient",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "91",
                "s": [
                  {
                    "value": [
                      "",
                      "define ",
                      "\\"VTE Prophylaxis by Medication Administered or Device Applied\\"",
                      ":\\n  "
                    ]
                  },
                  {
                    "r": "90",
                    "s": [
                      {
                        "r": "81",
                        "s": [
                          {
                            "r": "73",
                            "s": [
                              {
                                "r": "65",
                                "s": [
                                  {
                                    "value": [
                                      "( "
                                    ]
                                  },
                                  {
                                    "r": "65",
                                    "s": [
                                      {
                                        "s": [
                                          {
                                            "r": "60",
                                            "s": [
                                              {
                                                "r": "59",
                                                "s": [
                                                  {
                                                    "r": "59",
                                                    "s": [
                                                      {
                                                        "value": [
                                                          "[",
                                                          "\\"MedicationAdministration\\"",
                                                          ": "
                                                        ]
                                                      },
                                                      {
                                                        "s": [
                                                          {
                                                            "value": [
                                                              "medication"
                                                            ]
                                                          }
                                                        ]
                                                      },
                                                      {
                                                        "value": [
                                                          " ",
                                                          "in",
                                                          " "
                                                        ]
                                                      },
                                                      {
                                                        "s": [
                                                          {
                                                            "value": [
                                                              "\\"Low Dose Unfractionated Heparin for VTE Prophylaxis\\""
                                                            ]
                                                          }
                                                        ]
                                                      },
                                                      {
                                                        "value": [
                                                          "]"
                                                        ]
                                                      }
                                                    ]
                                                  }
                                                ]
                                              },
                                              {
                                                "value": [
                                                  " ",
                                                  "VTEMedication"
                                                ]
                                              }
                                            ]
                                          }
                                        ]
                                      },
                                      {
                                        "value": [
                                          "\\n                                    "
                                        ]
                                      },
                                      {
                                        "r": "64",
                                        "s": [
                                          {
                                            "value": [
                                              "where "
                                            ]
                                          },
                                          {
                                            "r": "64",
                                            "s": [
                                              {
                                                "r": "62",
                                                "s": [
                                                  {
                                                    "r": "61",
                                                    "s": [
                                                      {
                                                        "value": [
                                                          "VTEMedication"
                                                        ]
                                                      }
                                                    ]
                                                  },
                                                  {
                                                    "value": [
                                                      "."
                                                    ]
                                                  },
                                                  {
                                                    "r": "62",
                                                    "s": [
                                                      {
                                                        "value": [
                                                          "status"
                                                        ]
                                                      }
                                                    ]
                                                  }
                                                ]
                                              },
                                              {
                                                "value": [
                                                  " ",
                                                  "=",
                                                  " "
                                                ]
                                              },
                                              {
                                                "r": "63",
                                                "s": [
                                                  {
                                                    "value": [
                                                      "'completed'"
                                                    ]
                                                  }
                                                ]
                                              }
                                            ]
                                          }
                                        ]
                                      }
                                    ]
                                  },
                                  {
                                    "value": [
                                      "\\n                                )"
                                    ]
                                  }
                                ]
                              },
                              {
                                "value": [
                                  "\\n                                  union "
                                ]
                              },
                              {
                                "r": "72",
                                "s": [
                                  {
                                    "value": [
                                      "( "
                                    ]
                                  },
                                  {
                                    "r": "72",
                                    "s": [
                                      {
                                        "s": [
                                          {
                                            "r": "67",
                                            "s": [
                                              {
                                                "r": "66",
                                                "s": [
                                                  {
                                                    "r": "66",
                                                    "s": [
                                                      {
                                                        "value": [
                                                          "[",
                                                          "\\"MedicationAdministration\\"",
                                                          ": "
                                                        ]
                                                      },
                                                      {
                                                        "s": [
                                                          {
                                                            "value": [
                                                              "medication"
                                                            ]
                                                          }
                                                        ]
                                                      },
                                                      {
                                                        "value": [
                                                          " ",
                                                          "in",
                                                          " "
                                                        ]
                                                      },
                                                      {
                                                        "s": [
                                                          {
                                                            "value": [
                                                              "\\"Low Molecular Weight Heparin for VTE Prophylaxis\\""
                                                            ]
                                                          }
                                                        ]
                                                      },
                                                      {
                                                        "value": [
                                                          "]"
                                                        ]
                                                      }
                                                    ]
                                                  }
                                                ]
                                              },
                                              {
                                                "value": [
                                                  " ",
                                                  "LMWH"
                                                ]
                                              }
                                            ]
                                          }
                                        ]
                                      },
                                      {
                                        "value": [
                                          "\\n                                      "
                                        ]
                                      },
                                      {
                                        "r": "71",
                                        "s": [
                                          {
                                            "value": [
                                              "where "
                                            ]
                                          },
                                          {
                                            "r": "71",
                                            "s": [
                                              {
                                                "r": "69",
                                                "s": [
                                                  {
                                                    "r": "68",
                                                    "s": [
                                                      {
                                                        "value": [
                                                          "LMWH"
                                                        ]
                                                      }
                                                    ]
                                                  },
                                                  {
                                                    "value": [
                                                      "."
                                                    ]
                                                  },
                                                  {
                                                    "r": "69",
                                                    "s": [
                                                      {
                                                        "value": [
                                                          "status"
                                                        ]
                                                      }
                                                    ]
                                                  }
                                                ]
                                              },
                                              {
                                                "value": [
                                                  " ",
                                                  "=",
                                                  " "
                                                ]
                                              },
                                              {
                                                "r": "70",
                                                "s": [
                                                  {
                                                    "value": [
                                                      "'completed'"
                                                    ]
                                                  }
                                                ]
                                              }
                                            ]
                                          }
                                        ]
                                      }
                                    ]
                                  },
                                  {
                                    "value": [
                                      "\\n                                  )"
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            "value": [
                              "\\n                                  union "
                            ]
                          },
                          {
                            "r": "80",
                            "s": [
                              {
                                "value": [
                                  "( "
                                ]
                              },
                              {
                                "r": "80",
                                "s": [
                                  {
                                    "s": [
                                      {
                                        "r": "75",
                                        "s": [
                                          {
                                            "r": "74",
                                            "s": [
                                              {
                                                "r": "74",
                                                "s": [
                                                  {
                                                    "value": [
                                                      "[",
                                                      "\\"MedicationAdministration\\"",
                                                      ": "
                                                    ]
                                                  },
                                                  {
                                                    "s": [
                                                      {
                                                        "value": [
                                                          "medication"
                                                        ]
                                                      }
                                                    ]
                                                  },
                                                  {
                                                    "value": [
                                                      " ",
                                                      "in",
                                                      " "
                                                    ]
                                                  },
                                                  {
                                                    "s": [
                                                      {
                                                        "value": [
                                                          "\\"Injectable Factor Xa Inhibitor for VTE Prophylaxis\\""
                                                        ]
                                                      }
                                                    ]
                                                  },
                                                  {
                                                    "value": [
                                                      "]"
                                                    ]
                                                  }
                                                ]
                                              }
                                            ]
                                          },
                                          {
                                            "value": [
                                              " ",
                                              "FactorXa"
                                            ]
                                          }
                                        ]
                                      }
                                    ]
                                  },
                                  {
                                    "value": [
                                      "\\n                                      "
                                    ]
                                  },
                                  {
                                    "r": "79",
                                    "s": [
                                      {
                                        "value": [
                                          "where "
                                        ]
                                      },
                                      {
                                        "r": "79",
                                        "s": [
                                          {
                                            "r": "77",
                                            "s": [
                                              {
                                                "r": "76",
                                                "s": [
                                                  {
                                                    "value": [
                                                      "FactorXa"
                                                    ]
                                                  }
                                                ]
                                              },
                                              {
                                                "value": [
                                                  "."
                                                ]
                                              },
                                              {
                                                "r": "77",
                                                "s": [
                                                  {
                                                    "value": [
                                                      "status"
                                                    ]
                                                  }
                                                ]
                                              }
                                            ]
                                          },
                                          {
                                            "value": [
                                              " ",
                                              "=",
                                              " "
                                            ]
                                          },
                                          {
                                            "r": "78",
                                            "s": [
                                              {
                                                "value": [
                                                  "'completed'"
                                                ]
                                              }
                                            ]
                                          }
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              },
                              {
                                "value": [
                                  "\\n                                  )"
                                ]
                              }
                            ]
                          }
                        ]
                      },
                      {
                        "value": [
                          "\\n                                  union "
                        ]
                      },
                      {
                        "r": "88",
                        "s": [
                          {
                            "value": [
                              "( "
                            ]
                          },
                          {
                            "r": "88",
                            "s": [
                              {
                                "s": [
                                  {
                                    "r": "83",
                                    "s": [
                                      {
                                        "r": "82",
                                        "s": [
                                          {
                                            "r": "82",
                                            "s": [
                                              {
                                                "value": [
                                                  "[",
                                                  "\\"MedicationAdministration\\"",
                                                  ": "
                                                ]
                                              },
                                              {
                                                "s": [
                                                  {
                                                    "value": [
                                                      "medication"
                                                    ]
                                                  }
                                                ]
                                              },
                                              {
                                                "value": [
                                                  " ",
                                                  "in",
                                                  " "
                                                ]
                                              },
                                              {
                                                "s": [
                                                  {
                                                    "value": [
                                                      "\\"Warfarin\\""
                                                    ]
                                                  }
                                                ]
                                              },
                                              {
                                                "value": [
                                                  "]"
                                                ]
                                              }
                                            ]
                                          }
                                        ]
                                      },
                                      {
                                        "value": [
                                          " ",
                                          "Warfarin"
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              },
                              {
                                "value": [
                                  "\\n                                      "
                                ]
                              },
                              {
                                "r": "87",
                                "s": [
                                  {
                                    "value": [
                                      "where "
                                    ]
                                  },
                                  {
                                    "r": "87",
                                    "s": [
                                      {
                                        "r": "85",
                                        "s": [
                                          {
                                            "r": "84",
                                            "s": [
                                              {
                                                "value": [
                                                  "Warfarin"
                                                ]
                                              }
                                            ]
                                          },
                                          {
                                            "value": [
                                              "."
                                            ]
                                          },
                                          {
                                            "r": "85",
                                            "s": [
                                              {
                                                "value": [
                                                  "status"
                                                ]
                                              }
                                            ]
                                          }
                                        ]
                                      },
                                      {
                                        "value": [
                                          " ",
                                          "=",
                                          " "
                                        ]
                                      },
                                      {
                                        "r": "86",
                                        "s": [
                                          {
                                            "value": [
                                              "'completed'"
                                            ]
                                          }
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            "value": [
                              "\\n                                  )"
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          ],
          "resultTypeSpecifier": {
            "type": "ListTypeSpecifier",
            "elementType": {
              "name": "{http://hl7.org/fhir}MedicationAdministration",
              "type": "NamedTypeSpecifier"
            }
          },
          "expression": {
            "localId": "90",
            "locator": "61:3-72:35",
            "type": "Union",
            "resultTypeSpecifier": {
              "type": "ListTypeSpecifier",
              "elementType": {
                "name": "{http://hl7.org/fhir}MedicationAdministration",
                "type": "NamedTypeSpecifier"
              }
            },
            "operand": [
              {
                "localId": "73",
                "locator": "61:3-66:35",
                "type": "Union",
                "resultTypeSpecifier": {
                  "type": "ListTypeSpecifier",
                  "elementType": {
                    "name": "{http://hl7.org/fhir}MedicationAdministration",
                    "type": "NamedTypeSpecifier"
                  }
                },
                "operand": [
                  {
                    "localId": "65",
                    "locator": "61:3-63:33",
                    "type": "Query",
                    "resultTypeSpecifier": {
                      "type": "ListTypeSpecifier",
                      "elementType": {
                        "name": "{http://hl7.org/fhir}MedicationAdministration",
                        "type": "NamedTypeSpecifier"
                      }
                    },
                    "source": [
                      {
                        "localId": "60",
                        "locator": "61:5-61:115",
                        "alias": "VTEMedication",
                        "resultTypeSpecifier": {
                          "type": "ListTypeSpecifier",
                          "elementType": {
                            "name": "{http://hl7.org/fhir}MedicationAdministration",
                            "type": "NamedTypeSpecifier"
                          }
                        },
                        "expression": {
                          "localId": "59",
                          "locator": "61:5-61:101",
                          "dataType": "{http://hl7.org/fhir}MedicationAdministration",
                          "templateId": "http://hl7.org/fhir/StructureDefinition/MedicationAdministration",
                          "codeProperty": "medication",
                          "codeComparator": "in",
                          "type": "Retrieve",
                          "resultTypeSpecifier": {
                            "type": "ListTypeSpecifier",
                            "elementType": {
                              "name": "{http://hl7.org/fhir}MedicationAdministration",
                              "type": "NamedTypeSpecifier"
                            }
                          },
                          "codes": {
                            "locator": "61:48-61:100",
                            "resultTypeName": "{urn:hl7-org:elm-types:r1}ValueSet",
                            "name": "Low Dose Unfractionated Heparin for VTE Prophylaxis",
                            "preserve": true,
                            "type": "ValueSetRef"
                          }
                        }
                      }
                    ],
                    "relationship": [],
                    "where": {
                      "localId": "64",
                      "locator": "62:37-62:76",
                      "resultTypeName": "{urn:hl7-org:elm-types:r1}Boolean",
                      "type": "Equal",
                      "operand": [
                        {
                          "name": "ToString",
                          "libraryName": "FHIRHelpers",
                          "type": "FunctionRef",
                          "operand": [
                            {
                              "localId": "62",
                              "locator": "62:43-62:62",
                              "resultTypeName": "{http://hl7.org/fhir}MedicationAdministrationStatus",
                              "path": "status",
                              "scope": "VTEMedication",
                              "type": "Property"
                            }
                          ]
                        },
                        {
                          "localId": "63",
                          "locator": "62:66-62:76",
                          "resultTypeName": "{urn:hl7-org:elm-types:r1}String",
                          "valueType": "{urn:hl7-org:elm-types:r1}String",
                          "value": "completed",
                          "type": "Literal"
                        }
                      ]
                    }
                  },
                  {
                    "localId": "72",
                    "locator": "64:41-66:35",
                    "type": "Query",
                    "resultTypeSpecifier": {
                      "type": "ListTypeSpecifier",
                      "elementType": {
                        "name": "{http://hl7.org/fhir}MedicationAdministration",
                        "type": "NamedTypeSpecifier"
                      }
                    },
                    "source": [
                      {
                        "localId": "67",
                        "locator": "64:43-64:141",
                        "alias": "LMWH",
                        "resultTypeSpecifier": {
                          "type": "ListTypeSpecifier",
                          "elementType": {
                            "name": "{http://hl7.org/fhir}MedicationAdministration",
                            "type": "NamedTypeSpecifier"
                          }
                        },
                        "expression": {
                          "localId": "66",
                          "locator": "64:43-64:136",
                          "dataType": "{http://hl7.org/fhir}MedicationAdministration",
                          "templateId": "http://hl7.org/fhir/StructureDefinition/MedicationAdministration",
                          "codeProperty": "medication",
                          "codeComparator": "in",
                          "type": "Retrieve",
                          "resultTypeSpecifier": {
                            "type": "ListTypeSpecifier",
                            "elementType": {
                              "name": "{http://hl7.org/fhir}MedicationAdministration",
                              "type": "NamedTypeSpecifier"
                            }
                          },
                          "codes": {
                            "locator": "64:86-64:135",
                            "resultTypeName": "{urn:hl7-org:elm-types:r1}ValueSet",
                            "name": "Low Molecular Weight Heparin for VTE Prophylaxis",
                            "preserve": true,
                            "type": "ValueSetRef"
                          }
                        }
                      }
                    ],
                    "relationship": [],
                    "where": {
                      "localId": "71",
                      "locator": "65:39-65:69",
                      "resultTypeName": "{urn:hl7-org:elm-types:r1}Boolean",
                      "type": "Equal",
                      "operand": [
                        {
                          "name": "ToString",
                          "libraryName": "FHIRHelpers",
                          "type": "FunctionRef",
                          "operand": [
                            {
                              "localId": "69",
                              "locator": "65:45-65:55",
                              "resultTypeName": "{http://hl7.org/fhir}MedicationAdministrationStatus",
                              "path": "status",
                              "scope": "LMWH",
                              "type": "Property"
                            }
                          ]
                        },
                        {
                          "localId": "70",
                          "locator": "65:59-65:69",
                          "resultTypeName": "{urn:hl7-org:elm-types:r1}String",
                          "valueType": "{urn:hl7-org:elm-types:r1}String",
                          "value": "completed",
                          "type": "Literal"
                        }
                      ]
                    }
                  }
                ]
              },
              {
                "localId": "89",
                "type": "Union",
                "operand": [
                  {
                    "localId": "80",
                    "locator": "67:41-69:35",
                    "type": "Query",
                    "resultTypeSpecifier": {
                      "type": "ListTypeSpecifier",
                      "elementType": {
                        "name": "{http://hl7.org/fhir}MedicationAdministration",
                        "type": "NamedTypeSpecifier"
                      }
                    },
                    "source": [
                      {
                        "localId": "75",
                        "locator": "67:43-67:147",
                        "alias": "FactorXa",
                        "resultTypeSpecifier": {
                          "type": "ListTypeSpecifier",
                          "elementType": {
                            "name": "{http://hl7.org/fhir}MedicationAdministration",
                            "type": "NamedTypeSpecifier"
                          }
                        },
                        "expression": {
                          "localId": "74",
                          "locator": "67:43-67:138",
                          "dataType": "{http://hl7.org/fhir}MedicationAdministration",
                          "templateId": "http://hl7.org/fhir/StructureDefinition/MedicationAdministration",
                          "codeProperty": "medication",
                          "codeComparator": "in",
                          "type": "Retrieve",
                          "resultTypeSpecifier": {
                            "type": "ListTypeSpecifier",
                            "elementType": {
                              "name": "{http://hl7.org/fhir}MedicationAdministration",
                              "type": "NamedTypeSpecifier"
                            }
                          },
                          "codes": {
                            "locator": "67:86-67:137",
                            "resultTypeName": "{urn:hl7-org:elm-types:r1}ValueSet",
                            "name": "Injectable Factor Xa Inhibitor for VTE Prophylaxis",
                            "preserve": true,
                            "type": "ValueSetRef"
                          }
                        }
                      }
                    ],
                    "relationship": [],
                    "where": {
                      "localId": "79",
                      "locator": "68:39-68:73",
                      "resultTypeName": "{urn:hl7-org:elm-types:r1}Boolean",
                      "type": "Equal",
                      "operand": [
                        {
                          "name": "ToString",
                          "libraryName": "FHIRHelpers",
                          "type": "FunctionRef",
                          "operand": [
                            {
                              "localId": "77",
                              "locator": "68:45-68:59",
                              "resultTypeName": "{http://hl7.org/fhir}MedicationAdministrationStatus",
                              "path": "status",
                              "scope": "FactorXa",
                              "type": "Property"
                            }
                          ]
                        },
                        {
                          "localId": "78",
                          "locator": "68:63-68:73",
                          "resultTypeName": "{urn:hl7-org:elm-types:r1}String",
                          "valueType": "{urn:hl7-org:elm-types:r1}String",
                          "value": "completed",
                          "type": "Literal"
                        }
                      ]
                    }
                  },
                  {
                    "localId": "88",
                    "locator": "70:41-72:35",
                    "type": "Query",
                    "resultTypeSpecifier": {
                      "type": "ListTypeSpecifier",
                      "elementType": {
                        "name": "{http://hl7.org/fhir}MedicationAdministration",
                        "type": "NamedTypeSpecifier"
                      }
                    },
                    "source": [
                      {
                        "localId": "83",
                        "locator": "70:43-70:105",
                        "alias": "Warfarin",
                        "resultTypeSpecifier": {
                          "type": "ListTypeSpecifier",
                          "elementType": {
                            "name": "{http://hl7.org/fhir}MedicationAdministration",
                            "type": "NamedTypeSpecifier"
                          }
                        },
                        "expression": {
                          "localId": "82",
                          "locator": "70:43-70:96",
                          "dataType": "{http://hl7.org/fhir}MedicationAdministration",
                          "templateId": "http://hl7.org/fhir/StructureDefinition/MedicationAdministration",
                          "codeProperty": "medication",
                          "codeComparator": "in",
                          "type": "Retrieve",
                          "resultTypeSpecifier": {
                            "type": "ListTypeSpecifier",
                            "elementType": {
                              "name": "{http://hl7.org/fhir}MedicationAdministration",
                              "type": "NamedTypeSpecifier"
                            }
                          },
                          "codes": {
                            "locator": "70:86-70:95",
                            "resultTypeName": "{urn:hl7-org:elm-types:r1}ValueSet",
                            "name": "Warfarin",
                            "preserve": true,
                            "type": "ValueSetRef"
                          }
                        }
                      }
                    ],
                    "relationship": [],
                    "where": {
                      "localId": "87",
                      "locator": "71:39-71:73",
                      "resultTypeName": "{urn:hl7-org:elm-types:r1}Boolean",
                      "type": "Equal",
                      "operand": [
                        {
                          "name": "ToString",
                          "libraryName": "FHIRHelpers",
                          "type": "FunctionRef",
                          "operand": [
                            {
                              "localId": "85",
                              "locator": "71:45-71:59",
                              "resultTypeName": "{http://hl7.org/fhir}MedicationAdministrationStatus",
                              "path": "status",
                              "scope": "Warfarin",
                              "type": "Property"
                            }
                          ]
                        },
                        {
                          "localId": "86",
                          "locator": "71:63-71:73",
                          "resultTypeName": "{urn:hl7-org:elm-types:r1}String",
                          "valueType": "{urn:hl7-org:elm-types:r1}String",
                          "value": "completed",
                          "type": "Literal"
                        }
                      ]
                    }
                  }
                ]
              }
            ]
          }
        },
        {
          "localId": "113",
          "locator": "54:1-58:62",
          "name": "Encounter With VTE Prophylaxis Received on Day of or Day After Admission or Procedure",
          "context": "Patient",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "113",
                "s": [
                  {
                    "value": [
                      "",
                      "define ",
                      "\\"Encounter With VTE Prophylaxis Received on Day of or Day After Admission or Procedure\\"",
                      ":\\n  "
                    ]
                  },
                  {
                    "r": "112",
                    "s": [
                      {
                        "s": [
                          {
                            "value": [
                              "from "
                            ]
                          },
                          {
                            "r": "58",
                            "s": [
                              {
                                "r": "57",
                                "s": [
                                  {
                                    "s": [
                                      {
                                        "value": [
                                          "\\"Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions\\""
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              },
                              {
                                "value": [
                                  " ",
                                  "QualifyingEncounter"
                                ]
                              }
                            ]
                          },
                          {
                            "value": [
                              ",\\n                                      "
                            ]
                          },
                          {
                            "r": "93",
                            "s": [
                              {
                                "r": "92",
                                "s": [
                                  {
                                    "s": [
                                      {
                                        "value": [
                                          "\\"VTE Prophylaxis by Medication Administered or Device Applied\\""
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              },
                              {
                                "value": [
                                  " ",
                                  "VTEProphylaxis"
                                ]
                              }
                            ]
                          }
                        ]
                      },
                      {
                        "value": [
                          "\\n                                    "
                        ]
                      },
                      {
                        "r": "109",
                        "s": [
                          {
                            "value": [
                              "where "
                            ]
                          },
                          {
                            "r": "108",
                            "s": [
                              {
                                "r": "102",
                                "s": [
                                  {
                                    "value": [
                                      "Coalesce",
                                      "("
                                    ]
                                  },
                                  {
                                    "r": "97",
                                    "s": [
                                      {
                                        "r": "94",
                                        "s": [
                                          {
                                            "value": [
                                              "Global"
                                            ]
                                          }
                                        ]
                                      },
                                      {
                                        "value": [
                                          "."
                                        ]
                                      },
                                      {
                                        "r": "97",
                                        "s": [
                                          {
                                            "value": [
                                              "\\"Normalize Interval\\"",
                                              "("
                                            ]
                                          },
                                          {
                                            "r": "96",
                                            "s": [
                                              {
                                                "r": "95",
                                                "s": [
                                                  {
                                                    "value": [
                                                      "VTEProphylaxis"
                                                    ]
                                                  }
                                                ]
                                              },
                                              {
                                                "value": [
                                                  "."
                                                ]
                                              },
                                              {
                                                "r": "96",
                                                "s": [
                                                  {
                                                    "value": [
                                                      "effective"
                                                    ]
                                                  }
                                                ]
                                              }
                                            ]
                                          },
                                          {
                                            "value": [
                                              ")"
                                            ]
                                          }
                                        ]
                                      }
                                    ]
                                  },
                                  {
                                    "value": [
                                      ", "
                                    ]
                                  },
                                  {
                                    "r": "101",
                                    "s": [
                                      {
                                        "r": "98",
                                        "s": [
                                          {
                                            "value": [
                                              "Global"
                                            ]
                                          }
                                        ]
                                      },
                                      {
                                        "value": [
                                          "."
                                        ]
                                      },
                                      {
                                        "r": "101",
                                        "s": [
                                          {
                                            "value": [
                                              "\\"Normalize Interval\\"",
                                              "("
                                            ]
                                          },
                                          {
                                            "r": "100",
                                            "s": [
                                              {
                                                "r": "99",
                                                "s": [
                                                  {
                                                    "value": [
                                                      "VTEProphylaxis"
                                                    ]
                                                  }
                                                ]
                                              },
                                              {
                                                "value": [
                                                  "."
                                                ]
                                              },
                                              {
                                                "r": "100",
                                                "s": [
                                                  {
                                                    "value": [
                                                      "performed"
                                                    ]
                                                  }
                                                ]
                                              }
                                            ]
                                          },
                                          {
                                            "value": [
                                              ")"
                                            ]
                                          }
                                        ]
                                      }
                                    ]
                                  },
                                  {
                                    "value": [
                                      ")"
                                    ]
                                  }
                                ]
                              },
                              {
                                "r": "108",
                                "value": [
                                  "starts during",
                                  " "
                                ]
                              },
                              {
                                "r": "107",
                                "s": [
                                  {
                                    "r": "103",
                                    "s": [
                                      {
                                        "value": [
                                          "TJC"
                                        ]
                                      }
                                    ]
                                  },
                                  {
                                    "value": [
                                      "."
                                    ]
                                  },
                                  {
                                    "r": "107",
                                    "s": [
                                      {
                                        "value": [
                                          "\\"CalendarDayOfOrDayAfter\\"",
                                          " ( "
                                        ]
                                      },
                                      {
                                        "r": "106",
                                        "s": [
                                          {
                                            "value": [
                                              "start of "
                                            ]
                                          },
                                          {
                                            "r": "105",
                                            "s": [
                                              {
                                                "r": "104",
                                                "s": [
                                                  {
                                                    "value": [
                                                      "QualifyingEncounter"
                                                    ]
                                                  }
                                                ]
                                              },
                                              {
                                                "value": [
                                                  "."
                                                ]
                                              },
                                              {
                                                "r": "105",
                                                "s": [
                                                  {
                                                    "value": [
                                                      "period"
                                                    ]
                                                  }
                                                ]
                                              }
                                            ]
                                          }
                                        ]
                                      },
                                      {
                                        "value": [
                                          " )"
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      },
                      {
                        "value": [
                          "\\n                                    "
                        ]
                      },
                      {
                        "r": "111",
                        "s": [
                          {
                            "value": [
                              "return "
                            ]
                          },
                          {
                            "r": "110",
                            "s": [
                              {
                                "value": [
                                  "QualifyingEncounter"
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          ],
          "resultTypeSpecifier": {
            "type": "ListTypeSpecifier",
            "elementType": {
              "name": "{http://hl7.org/fhir}Encounter",
              "type": "NamedTypeSpecifier"
            }
          },
          "expression": {
            "localId": "112",
            "locator": "55:3-58:62",
            "type": "Query",
            "resultTypeSpecifier": {
              "type": "ListTypeSpecifier",
              "elementType": {
                "name": "{http://hl7.org/fhir}Encounter",
                "type": "NamedTypeSpecifier"
              }
            },
            "source": [
              {
                "localId": "58",
                "locator": "55:8-55:105",
                "alias": "QualifyingEncounter",
                "resultTypeSpecifier": {
                  "type": "ListTypeSpecifier",
                  "elementType": {
                    "name": "{http://hl7.org/fhir}Encounter",
                    "type": "NamedTypeSpecifier"
                  }
                },
                "expression": {
                  "localId": "57",
                  "locator": "55:8-55:85",
                  "name": "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions",
                  "type": "ExpressionRef",
                  "resultTypeSpecifier": {
                    "type": "ListTypeSpecifier",
                    "elementType": {
                      "name": "{http://hl7.org/fhir}Encounter",
                      "type": "NamedTypeSpecifier"
                    }
                  }
                }
              },
              {
                "localId": "93",
                "locator": "56:39-56:115",
                "alias": "VTEProphylaxis",
                "resultTypeSpecifier": {
                  "type": "ListTypeSpecifier",
                  "elementType": {
                    "name": "{http://hl7.org/fhir}MedicationAdministration",
                    "type": "NamedTypeSpecifier"
                  }
                },
                "expression": {
                  "localId": "92",
                  "locator": "56:39-56:100",
                  "name": "VTE Prophylaxis by Medication Administered or Device Applied",
                  "type": "ExpressionRef",
                  "resultTypeSpecifier": {
                    "type": "ListTypeSpecifier",
                    "elementType": {
                      "name": "{http://hl7.org/fhir}MedicationAdministration",
                      "type": "NamedTypeSpecifier"
                    }
                  }
                }
              }
            ],
            "relationship": [],
            "where": {
              "localId": "109",
              "locator": "57:37-57:243",
              "type": "Null"
            },
            "return": {
              "localId": "111",
              "locator": "58:37-58:62",
              "resultTypeSpecifier": {
                "type": "ListTypeSpecifier",
                "elementType": {
                  "name": "{http://hl7.org/fhir}Encounter",
                  "type": "NamedTypeSpecifier"
                }
              },
              "expression": {
                "localId": "110",
                "locator": "58:44-58:62",
                "resultTypeName": "{http://hl7.org/fhir}Encounter",
                "name": "QualifyingEncounter",
                "type": "AliasRef"
              }
            }
          }
        },
        {
          "localId": "115",
          "locator": "51:1-52:89",
          "name": "Numerator",
          "context": "Patient",
          "accessLevel": "Public",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "115",
                "s": [
                  {
                    "value": [
                      "",
                      "define ",
                      "\\"Numerator\\"",
                      ":\\n  "
                    ]
                  },
                  {
                    "r": "114",
                    "s": [
                      {
                        "value": [
                          "\\"Encounter With VTE Prophylaxis Received on Day of or Day After Admission or Procedure\\""
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          ],
          "resultTypeSpecifier": {
            "type": "ListTypeSpecifier",
            "elementType": {
              "name": "{http://hl7.org/fhir}Encounter",
              "type": "NamedTypeSpecifier"
            }
          },
          "expression": {
            "localId": "114",
            "locator": "52:3-52:89",
            "name": "Encounter With VTE Prophylaxis Received on Day of or Day After Admission or Procedure",
            "type": "ExpressionRef",
            "resultTypeSpecifier": {
              "type": "ListTypeSpecifier",
              "elementType": {
                "name": "{http://hl7.org/fhir}Encounter",
                "type": "NamedTypeSpecifier"
              }
            }
          }
        },
        {
          "localId": "118",
          "locator": "74:1-75:6",
          "resultTypeName": "{urn:hl7-org:elm-types:r1}Boolean",
          "name": "fun",
          "context": "Patient",
          "accessLevel": "Public",
          "type": "FunctionDef",
          "annotation": [
            {
              "type": "Annotation",
              "s": {
                "r": "118",
                "s": [
                  {
                    "value": [
                      "",
                      "define function ",
                      "\\"fun\\"",
                      "(",
                      "\\"notPascalCase\\"",
                      " "
                    ]
                  },
                  {
                    "r": "116",
                    "s": [
                      {
                        "value": [
                          "Integer"
                        ]
                      }
                    ]
                  },
                  {
                    "value": [
                      " ):\\n  "
                    ]
                  },
                  {
                    "r": "117",
                    "s": [
                      {
                        "r": "117",
                        "value": [
                          "true"
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          ],
          "expression": {
            "localId": "117",
            "locator": "75:3-75:6",
            "resultTypeName": "{urn:hl7-org:elm-types:r1}Boolean",
            "valueType": "{urn:hl7-org:elm-types:r1}Boolean",
            "value": "true",
            "type": "Literal"
          },
          "operand": [
            {
              "name": "notPascalCase",
              "operandTypeSpecifier": {
                "localId": "116",
                "locator": "74:39-74:45",
                "resultTypeName": "{urn:hl7-org:elm-types:r1}Encounter",
                "name": "{urn:hl7-org:elm-types:r1}Encounter",
                "type": "NamedTypeSpecifier"
              }
            }
          ]
        }
      ]
    }
  },
  "externalErrors": []
}
`;
