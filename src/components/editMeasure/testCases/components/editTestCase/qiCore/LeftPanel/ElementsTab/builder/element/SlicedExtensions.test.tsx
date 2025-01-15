import * as React from "react";
import { structuredDefinitionUSCoreEthnicity } from "../../../../../../../__mocks__/structuredDefinitions/StructureDefinition-us-core-ethnicity";
import { render, screen, waitFor } from "@testing-library/react";
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
    const structureDefinition = {
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
    mockedAxios.get.mockResolvedValue({
      data: { definition: structuredDefinitionUSCoreEthnicity },
    });

    render(
      <ApiContextProvider value={mockServiceConfig}>
        <FormikProvider value={mockFormik}>
          <TypeEditor
            type="Extension"
            resource={resource}
            required={false}
            value={undefined}
            onChange={handleChange}
            structureDefinition={structureDefinition}
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
  });
});
