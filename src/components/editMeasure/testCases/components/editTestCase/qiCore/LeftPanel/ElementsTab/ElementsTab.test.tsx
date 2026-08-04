import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QiCoreResourceProvider } from "../../../../../util/QiCorePatientProvider";
import ElementsTab from "./ElementsTab";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../../../api/ServiceContext";
import {
  Measure,
  MeasureScoring,
  Model,
  PopulationType,
  TestCase,
} from "@madie/madie-models";
import axios from "../../../../../../../../api/axios-instance";
import { ExecutionContextProvider } from "../../../../routes/qiCore/ExecutionContext";
import userEvent from "@testing-library/user-event";

const patientBundle = {
  resourceType: "Bundle",
  id: "IP-Pass-CVPatient",
  type: "collection",
  entry: [
    {
      fullUrl:
        "https://madie.cms.gov/Patient/1409f76a-f837-45fd-8850-6927674fefc4",
      resource: {
        resourceType: "Patient",
        id: "1409f76a-f837-45fd-8850-6927674fefc4",
        extension: [
          {
            extension: [
              {
                url: "ombCategory",
                valueCoding: {
                  system: "urn:oid:2.16.840.1.113883.6.238",
                  code: "2106-3",
                  display: "White",
                },
              },
              {
                url: "detailed",
                valueCoding: {
                  system: "urn:oid:2.16.840.1.113883.6.238",
                  code: "1586-7",
                  display: "Shoshone",
                },
              },
              {
                url: "detailed",
                valueCoding: {
                  system: "urn:oid:2.16.840.1.113883.6.238",
                  code: "2036-2",
                  display: "Filipino",
                },
              },
              {
                url: "text",
                valueString: "Mixed",
              },
              {
                url: "ombCategory",
                valueCoding: {
                  code: "2028-9",
                  system: "urn:oid:2.16.840.1.113883.6.238",
                  display: "Asian",
                },
              },
            ],
            url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
          },
          {
            extension: [
              {
                url: "ombCategory",
                valueCoding: {
                  system: "urn:oid:2.16.840.1.113883.6.238",
                  code: "2135-2",
                  display: "Hispanic or Latino",
                },
              },
              {
                url: "detailed",
                valueCoding: {
                  system: "urn:oid:2.16.840.1.113883.6.238",
                  code: "2184-0",
                  display: "Dominican",
                },
              },
              {
                url: "text",
                valueString: "Hispanic or Latino",
              },
            ],
            url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
          },
          {
            url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-genderIdentity",
            valueCodeableConcept: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/v3-NullFlavor",
                  code: "ASKU",
                  display: "asked but unknown",
                },
              ],
              text: "asked but unknown",
            },
          },
        ],
        name: [
          {
            use: "usual",
            family: "IPPass",
            given: ["IPPass"],
          },
        ],
        gender: "male",
        birthDate: "1954-02-10",
      },
    },
  ],
};
const setEditorVal = jest.fn();
const MEASURE_CREATEDBY = "testuser";
const defaultMeasure = {
  id: "m1234",
  model: Model.QICORE,
  measureScoring: MeasureScoring.COHORT,
  createdBy: MEASURE_CREATEDBY,
  groups: [
    {
      groupId: "Group1_ID",
      scoring: "Cohort",
      populations: [
        {
          id: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Pop1",
        },
      ],
      stratifications: [
        {
          id: "strat-id-1",
          description: "strat1 description",
          cqlDefinition: "cql definition",
          associations: [PopulationType.INITIAL_POPULATION],
        },
      ],
    },
  ],
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
} as unknown as Measure;

const serviceConfig: ServiceConfig = {
  qdmElmTranslationService: { baseUrl: "qdm-cql-to-elm.com" },
  fhirElmTranslationService: { baseUrl: "fhir-cql-to-elm.com" },
  excelExportService: {
    baseUrl: "excelexport.com",
  },
  measureService: {
    baseUrl: "measure.url",
  },
  fhirService: {
    baseUrl: "fhirservice.url",
  },
  terminologyService: {
    baseUrl: "something.com",
  },
};
let mockApplyDefaults = false;
jest.mock("@madie/madie-util", () => {
  return {
    useDocumentTitle: jest.fn(),
    useFeatureFlags: () => {
      return {
        applyDefaults: mockApplyDefaults,
      };
    },
    measureStore: {
      updateMeasure: jest.fn((measure) => measure),
      state: null,
      initialState: null,
      subscribe: (set) => {
        set({} as Measure);
        return { unsubscribe: () => null };
      },
      unsubscribe: () => null,
    },
    useOktaTokens: jest.fn(() => ({
      getAccessToken: () => "test.jwt",
    })),
    checkUserCanEdit: jest.fn(() => {
      return true;
    }),
    routeHandlerStore: {
      subscribe: () => {
        return { unsubscribe: () => null };
      },
      updateRouteHandlerState: () => null,
      state: { canTravel: false, pendingPath: "" },
      initialState: { canTravel: false, pendingPath: "" },
    },
  };
});

jest.mock("../../../../../../../../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockFormikObj = {
  touched: {},
  errors: {},
  values: {},
  isSubmitting: false,
  setFieldValue: undefined,
  dirty: false,
  resetForm: jest.fn(),
};

jest.mock("formik", () => ({
  useFormikContext: () => {
    return mockFormikObj;
  },
  getIn: (context: Record<string, unknown>, fieldName: string) => {
    return context[fieldName];
  },
}));
describe("ElementsTab", () => {
  beforeEach(() => {
    mockedAxios.get.mockImplementation((args) => {
      if (args === "fhirservice.url/fhir/models/qicore/resources") {
        return Promise.resolve({
          data: [
            {
              id: "qicore-adverseevent",
              type: "AdverseEvent",
              title: "QICore AdverseEvent",
              category: "Clinical.Summary",
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-adverseevent",
            },
            {
              id: "qicore-medicationstatement",
              type: "MedicationStatement",
              title: "QICore MedicationStatement",
              category: "Clinical.Medications",
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-medicationstatement",
            },
            {
              id: "qicore-claim",
              type: "Claim",
              title: "QICore Claim",
              category: "Financial.Billing",
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-claim",
            },
            {
              id: "qicore-procedure",
              type: "Procedure",
              title: "QICore Procedure",
              category: "Clinical.Summary",
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-procedure",
            },
          ],
        });
      }
      if (
        args ===
        "fhirservice.url/fhir/models/qicore/resources/builder-metadata"
      ) {
        return Promise.resolve({
          data: {
            resourcePaths: ["/fhir/us/qicore", "/fhir/us/core"],
            primaryPatientProfile: {
              id: "qicore-patient",
              type: "Patient",
              title: "QICore Patient",
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
            },
          },
        });
      }
      return Promise.resolve({ data: null });
    });

    mockedAxios.put.mockImplementation((args) => {
      if (args === "fhir-cql-to-elm.com/fhir/cql/relevant-elements") {
        return Promise.resolve({
          data: [
            {
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-adverseevent",
              type: "AdverseEvent",
            },
          ],
        });
      }
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  const setMeasure = jest.fn();

  const renderElementTab = (
    measure: Measure = defaultMeasure,
    activeTab: string = "available"
  ) => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [measure, setMeasure],
            bundleState: null,
            valueSetsState: null,
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <QiCoreResourceProvider>
            <ElementsTab
              canEdit={true}
              setEditorVal={setEditorVal}
              editorVal={JSON.stringify(patientBundle)}
              testCase={{ json: JSON.stringify(patientBundle) } as TestCase}
              activeTab={activeTab}
            />
          </QiCoreResourceProvider>
        </ExecutionContextProvider>
      </ApiContextProvider>
    );
  };

  it("displays Available tab content for a QICore case", async () => {
    renderElementTab(defaultMeasure, "available");
    expect(await screen.findByText("QICore AdverseEvent")).toBeInTheDocument();
  });

  it("displays Added tab content for a QICore case", async () => {
    renderElementTab(defaultMeasure, "added");
    expect(await screen.findByText("Profile")).toBeInTheDocument();
  });
});
