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

jest.mock("../../../../../../../../../../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("@madie/madie-util", () => ({
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
    "extention:ethnicity": undefined,
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
  it("should render form for Patient.extension:ethnicity", async () => {
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
        <FormikProvider value={mockFormik}>
          <TypeEditor
            type="Extension"
            resource={resource}
            required={false}
            value={undefined}
            onChange={handleChange}
            structureDefinition={qiCoreEthnicityStructureDefinition}
            parentStructureDefinition={null}
            label={label}
            canEdit={true}
          />
        </FormikProvider>
      </ApiContextProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("string-field-input-id")).toBeInTheDocument();
    });
    expect(screen.getByTestId("extension:ombCategory")).toBeInTheDocument();
    expect(screen.getByTestId("extension:detailed")).toBeInTheDocument();
    expect(screen.getByTestId("extension:text")).toBeInTheDocument();
    const ethnicityCodeSelectors = screen.getAllByRole("combobox");
    // select omb ethnicity option
    userEvent.click(ethnicityCodeSelectors[1]);
    const ombOptions = screen.getByRole("listbox");
    const ombOption = within(ombOptions).getByRole("option");
    expect(ombOption.getAttribute("data-value")).toBe("2135-2");

    // select detailed ethnicity option
    userEvent.click(ethnicityCodeSelectors[3]);
    const detailedOptions = screen.getByRole("listbox");
    const detailedOption = within(detailedOptions).getByRole("option");
    expect(detailedOption.getAttribute("data-value")).toBe("2137-8");
  });
});
