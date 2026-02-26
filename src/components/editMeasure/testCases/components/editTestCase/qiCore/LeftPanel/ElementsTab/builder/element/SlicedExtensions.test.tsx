import * as React from "react";
import userEvent from "@testing-library/user-event";
import { structuredDefinitionUSCoreEthnicity } from "../../../../../../../__mocks__/structuredDefinitions/StructureDefinition-us-core-ethnicity";
import { render, screen, waitFor, within } from "@testing-library/react";
import TypeEditor from "./TypeEditor";
import axios from "../../../../../../../../../../api/axios-instance";
import { FormikProvider } from "formik";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../../../../../api/ServiceContext";
import { RequiredFieldsProvider } from "./RequiredFieldsContext";
import mockRequiredFields from "./mockRequiredFields";
import mockFormInfo from "./mockFormInfo";
import { ExecutionContextProvider } from "../../../../../../routes/qiCore/ExecutionContext";
jest.mock("../../../../../../../../../../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("@madie/madie-util", () => ({
  useIsAdminTransferEnabled: () => false,
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
}));

const mockServiceConfig = {
  fhirService: {
    baseUrl: "string",
  },
} as ServiceConfig;

jest.mock("../../../../../../../../../../api/useServiceConfig", () => {
  return jest.fn(() => mockServiceConfig);
});

const getNestedProperty = (obj, path) => {
  return path.split(".").reduce((current, key) => current && current[key], obj);
};

const patientResource = {
  Patient: {
    extension: [
      {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
        extension: [
          {
            url: "ombCategory",
            valueCoding: {
              system: "urn:oid:2.16.840.1.113883.6.238",
              code: "1002-5",
              display: "American Indian or Alaska Native",
              userSelected: true,
            },
          },
          {
            url: "text",
            valueString: "American Indian or Alaska Native",
          },
        ],
      },
      {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
        extension: [
          {
            url: "ombCategory",
            valueCoding: {
              system: "urn:oid:2.16.840.1.113883.6.238",
              code: "2135-2",
              display: "Hispanic or Latino",
              userSelected: true,
            },
          },
          {
            url: "text",
            valueString: "Hispanic or Latino",
          },
        ],
      },
    ],
  },
};

//@ts-ignore
const mockFormik: FormikContextType<any> = {
  values: {
    ...patientResource,
  },
  getFieldProps: (label) => {
    const name = getNestedProperty(patientResource, label);
    return {
      value: name,
      name,
      onChange: jest.fn(),
      onBlur: jest.fn(),
    };
  },
  handleChange: () => {},
  setFieldValue: jest.fn(),
};

describe("TypeEditor for profiled extensions/slices ", () => {
  // Skipping this test since we are filtering out extensions now in ElementSelector
  it.skip("should render form for Patient.extension:ethnicity", async () => {
    const handleChange = jest.fn();
    const label = "Patient.extension:ethnicity";
    const resource = {
      id: "dc41859f8107",
      resourceType: "Patient",
      meta: {
        profile: [
          "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
        ],
      },
    };
    const qiCoreEthnicityStructureDefinition = {
      id: "Patient.extension:ethnicity",
      min: 0,
      max: 1,
      path: "Patient.extension",
      short: "(QI-Core)(USCDI) US Core ethnicity Extension",
      sliceName: "ethnicity",
      type: [
        {
          code: "Extension",
          profile: [
            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
          ],
        },
      ],
    };
    mockedAxios.get
      // get structured definition for ethnicity
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: {
            definition: structuredDefinitionUSCoreEthnicity,
          },
        })
      )
      // expansion for omb ethnicity
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: {
            expansion: {
              contains: [
                {
                  code: "2135-2",
                  system: "urn:oid:2.16.840.1.113883.6.238",
                  display: "Hispanic or Latino",
                },
              ],
            },
          },
        })
      )
      // expansion for detailed ethnicity
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: undefined, // detailed ethnicity expansion not found in local hapi
        })
      )
      // get value set definition
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: {
            compose: {
              include: [
                {
                  valueSet: "2.16.840.1.114222.4.11.877",
                },
              ],
            },
          },
        })
      );
    // mock detailed ethnicity expansion from VSAC
    mockedAxios.put.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: [
          {
            expansion: {
              contains: [
                {
                  code: "2137-8",
                  system: "urn:oid:2.16.840.1.113883.6.238",
                  display: "Spaniard",
                },
              ],
            },
          },
        ],
      })
    );

    render(
      <ApiContextProvider value={mockServiceConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [null, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [null, jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <FormikProvider value={mockFormik}>
            <RequiredFieldsProvider
              requiredFields={mockRequiredFields}
              formInfo={mockFormInfo}
            >
              <TypeEditor
                type="Extension"
                resource={resource}
                required={false}
                value={undefined}
                onChange={handleChange}
                structureDefinition={qiCoreEthnicityStructureDefinition}
                parentStructureDefinition={null}
                label={"Patient.extension[0].extension[0]"}
                canEdit={true}
              />
            </RequiredFieldsProvider>
          </FormikProvider>
        </ExecutionContextProvider>
      </ApiContextProvider>
    );
    await waitFor(() => {
      expect(
        screen.getByTestId("string-field-Patient.extension[1].id")
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("extension:ombCategory")).toBeInTheDocument();
    expect(screen.getByTestId("extension:detailed")).toBeInTheDocument();
    expect(screen.getByTestId("extension:text")).toBeInTheDocument();
  });
});
