import * as React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TypeEditor from "./TypeEditor";
import useFhirDefinitionsServiceApi, {
  FhirDefinitionsServiceApi,
} from "../../../../../../../api/useFhirDefinitionsService";
import useTerminologyServiceApi, {
  TerminologyServiceApi,
} from "../../../../../../../api/useTerminologyServiceApi";
import { FormikProvider, FormikContextType, FormikProps } from "formik";
import { RequiredFieldsProvider } from "./RequiredFieldsContext";
import mockRequiredFields from "./mockRequiredFields";
import mockFormInfo from "./mockFormInfo";
import { ExecutionContextProvider } from "../../../../../../routes/qiCore/ExecutionContext";
import { useQiCoreResource } from "../../../../../../../util/QiCorePatientProvider";

const getNestedProperty = (obj, path) => {
  return path.split(".").reduce((current, key) => current && current[key], obj);
};

const claimResponseValues = {
  ClaimResponse: {
    id: "test",
    order: "1234",
    time: "01:23:45",
    Coding: {
      code: "",
      id: "",
      extension: {},
      system: "",
      version: "",
      display: "",
      userSelected: false,
    },
  },
};
const mockSetFieldValue = jest.fn();

//@ts-ignore
const mockFormik: FormikContextType<any> = {
  values: {
    claimResponseValues,
  },
  touched: {},
  getFieldProps: (label) => {
    const name = getNestedProperty(claimResponseValues, label);
    return {
      value: name,
      name,
      onChange: jest.fn(),
      onBlur: jest.fn(),
    };
  },
  handleChange: () => {},
  setFieldValue: mockSetFieldValue,
  setFieldTouched: jest.fn(),
};

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
}));
const codingDef = {
  path: "Coding",
  definition: { resourceType: "StructureDefinition", id: "Coding" },
};
const codingTopLevelElements = [
  {
    id: "ClaimResponse.Coding.code",
    path: "ClaimResponse.Coding.code",
  },
  {
    id: "ClaimResponse.Coding.id",
    path: "ClaimResponse.Coding.id",
  },
  {
    id: "ClaimResponse.Coding.extension",
    path: "ClaimResponse.Coding.extension",
  },
  {
    id: "ClaimResponse.Coding.system",
    path: "ClaimResponse.Coding.system",
  },
  {
    id: "ClaimResponse.Coding.version",
    path: "ClaimResponse.Coding.version",
  },
  {
    id: "ClaimResponse.Coding.display",
    path: "ClaimResponse.Coding.display",
  },
  {
    id: "ClaimResponse.Coding.userSelected",
    path: "ClaimResponse.Coding.userSelected",
  },
];

const mockValueSetDefinitionBirthSex = {
  resourceType: "ValueSet",
  id: "birthsex",
  url: "http://hl7.org/fhir/us/core/ValueSet/birthsex",
  name: "BirthSex",
  title: "Birth Sex",
  status: "active",
  experimental: false,
  compose: {
    include: [
      {
        valueSet: [
          "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1",
        ],
      },
      {
        valueSet: [
          "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1021.103",
        ],
      },
    ],
  },
};
const valueSetExpansionBirthSex = [
  {
    resourceType: "ValueSet",
    id: "2.16.840.1.113762.1.4.1",
    name: "ONCAdministrativeSex",
    title: "ONC Administrative Sex",
    status: "active",
    expansion: {
      contains: [
        {
          system:
            "http://terminology.hl7.org/CodeSystem/v3-AdministrativeGender",
          inactive: true,
          version: "2023-02-01",
          code: "F",
          display: "Female",
        },
        {
          system:
            "http://terminology.hl7.org/CodeSystem/v3-AdministrativeGender",
          inactive: true,
          version: "2023-02-01",
          code: "M",
          display: "Male",
        },
      ],
    },
  },
  {
    resourceType: "ValueSet",
    id: "2.16.840.1.113762.1.4.1021.103",
    name: "OtherOrUnknownOrRefusedToAnswer",
    title: "Other or unknown or refused to answer",
    status: "active",
    expansion: {
      contains: [
        {
          code: "ASKU",
          display: "asked but unknown",
        },
        {
          code: "OTH",
          display: "other",
        },
        {
          code: "UNK",
          display: "unknown",
        },
      ],
    },
  },
];

const structureDefinitionForExtensionValue = {
  id: "Extension.value[x]",
  path: "Extension.value[x]",
  short: "Value of extension",
  type: [
    {
      code: "code",
    },
  ],
  binding: {
    strength: "required",
    description: "Code for sex assigned at birth",
    valueSet: "http://hl7.org/fhir/us/core/ValueSet/birthsex",
  },
};

const parentStructureDefinition = {
  resourceName: null,
  category: null,
  primaryCodePath: null,
  definition: {
    resourceType: "StructureDefinition",
    id: "us-core-birthsex",
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
    name: "USCoreBirthSexExtension",
    title: "US Core Birth Sex Extension",
    type: "Extension",
  },
};

jest.mock("../../../../../../../api/useFhirDefinitionsService");
const useFhirDefinitionsServiceApiMock =
  useFhirDefinitionsServiceApi as jest.Mock<FhirDefinitionsServiceApi>;
const fhirDefinitionsServiceApiMock = {
  getResourceTree: jest.fn().mockResolvedValue(codingDef),
  getValueSetDefinition: jest
    .fn()
    .mockResolvedValue(mockValueSetDefinitionBirthSex),
} as unknown as FhirDefinitionsServiceApi;
useFhirDefinitionsServiceApiMock.mockImplementation(
  () => fhirDefinitionsServiceApiMock
);

jest.mock("../../../../../../../util/QiCorePatientProvider", () => ({
  useQiCoreResource: jest.fn(),
}));
jest.mock("../../../../../../../api/fhirDefinitionServiceUtilities", () => {
  return {
    ...jest.requireActual(
      "../../../../../../../api/fhirDefinitionServiceUtilities"
    ),
    isComponentDataType: (type: string) => true,
    getAllChildren: jest.fn().mockReturnValue(codingTopLevelElements),
    getTopLevelElements: jest.fn().mockReturnValue(codingTopLevelElements),
    updateChildrenPaths: jest.fn().mockReturnValue(codingTopLevelElements),
  };
});

jest.mock("../../../../../../../api/useTerminologyServiceApi");
const useTerminologyServiceApiMock =
  useTerminologyServiceApi as jest.Mock<TerminologyServiceApi>;
const terminologyServiceApiMock = {
  getValueSetsExpansionForOids: jest.fn().mockResolvedValue([]),
} as unknown as TerminologyServiceApi;
useTerminologyServiceApiMock.mockImplementation(
  () => terminologyServiceApiMock
);
const mockBundle = {
  entry: [{ resource: { resourceType: "Patient", id: "patient-1" } }],
};
describe("TypeEditor Component", () => {
  beforeEach(() => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: { bundle: mockBundle },
    });
  });
  test("Should render String component", () => {
    // const handleChange = jest.fn();
    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            resource={null}
            structureDefinition={{
              id: "ClaimResponse.id",
              path: "ClaimResponse.id",
              min: 0,
              max: "1",
              type: [
                {
                  extension: [
                    {
                      url: "http://hl7.org/fhir/StructureDefinition/structuredefinition-fhir-type",
                      valueUrl: "id",
                    },
                  ],
                  code: "http://hl7.org/fhirpath/System.String",
                },
              ],
            }}
            label={"ClaimResponse.id"}
            canEdit={true}
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    const inputField = screen.getByTestId(
      "string-field-input-ClaimResponse.id"
    ) as HTMLInputElement;
    expect(inputField).toBeInTheDocument();
    expect(inputField.value).toBe("test");
  });

  // can't update root id, going to fake a text
  test("Should render String component, should trigger setFieldValue and setFieldTouched", async () => {
    const setFieldValue = jest.fn();
    const setFieldTouched = jest.fn();
    const onChange = jest.fn();
    const stringFormik = {
      ...mockFormik,
      setFieldTouched: setFieldTouched,
      setFieldValue: setFieldValue,
      getFieldProps: () => ({
        label: "ClaimResponse.test",
        name: "ClaimResponse.test",
        value: "1234-abcd-ABCD",
        onChange,
        onBlur: jest.fn(),
      }),
    };

    render(
      <FormikProvider value={stringFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            resource={null}
            structureDefinition={{
              id: "ClaimResponse.test",
              path: "ClaimResponse.test",
              min: 0,
              max: "1",
              type: [
                {
                  extension: [
                    {
                      url: "http://hl7.org/fhir/StructureDefinition/structuredefinition-fhir-type",
                      valueUrl: "test",
                    },
                  ],
                  code: "http://hl7.org/fhirpath/System.String",
                },
              ],
            }}
            label={"ClaimResponse.test"}
            canEdit={true}
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    const inputField = screen.getByTestId(
      "string-field-input-ClaimResponse.test"
    ) as HTMLInputElement;
    expect(inputField).toBeInTheDocument();
    expect(inputField.value).toBe("1234-abcd-ABCD");

    userEvent.type(inputField, "1234-abcd-ABCD-5678");
    expect(onChange).toHaveBeenCalled();
  });

  test("String field should display errors and helper text", () => {
    const touched = {
      ClaimResponse: {
        id: true,
      },
    };
    const errors = {
      ClaimResponse: {
        id: "This field is required",
      },
    };
    const errorFormik = { ...mockFormik, errors, touched };
    render(
      <FormikProvider value={errorFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            structureDefinition={{
              id: "ClaimResponse.id",
              path: "ClaimResponse.id",
              min: 0,
              max: "1",
              type: [
                {
                  code: "http://hl7.org/fhirpath/System.String",
                },
              ],
            }}
            resource={null}
            label={"ClaimResponse.id"}
            canEdit={true}
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    const inputField = screen.getByTestId(
      "string-field-input-ClaimResponse.id"
    );
    expect(inputField).toBeInTheDocument();
    const errorText = screen.getByText("This field is required");
    expect(errorText).toBeInTheDocument();
  });

  test("Should render Period component", () => {
    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            resource={null}
            structureDefinition={{
              id: "ClaimResponse.instantiatesCanonical",
              path: "ClaimResponse.instantiatesCanonical",
              min: 0,
              max: "1",
              type: [
                {
                  code: "Period",
                },
              ],
            }}
            canEdit={true}
            label="instantiatesCanonical"
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );

    expect(screen.getByText("start")).toBeInTheDocument();
    expect(screen.getByText("End")).toBeInTheDocument();
  });

  test("Should render DateTime component", () => {
    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            structureDefinition={{
              id: "ClaimResponse.date",
              path: "ClaimResponse.date",
              min: 0,
              max: "1",
              type: [
                {
                  code: "http://hl7.org/fhirpath/System.DateTime",
                },
              ],
            }}
            resource={null}
            label="ClaimResponse.date"
            canEdit={true}
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );

    const inputDate = screen.getByTestId(
      `date-time-format-selector-field-ClaimResponse.date`
    );
    expect(inputDate).toBeInTheDocument();
  });

  test("Should render DateTime component, should trigger onChange", async () => {
    const onChange = jest.fn();
    const setFieldTouched = jest.fn();
    const updatedMockFormik = {
      ...mockFormik,
      setFieldTouched: setFieldTouched,
      setFieldValue: onChange,
      getFieldProps: () => ({
        label: "ClaimResponse.date",
        value: "1992-01-01T00:00:00-08:00",
        setFieldTouched: jest.fn(),
        setFieldValue: jest.fn(),
      }),
    };
    // need to figure out how to check this mock
    render(
      <FormikProvider value={updatedMockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            structureDefinition={{
              id: "ClaimResponse.date",
              path: "ClaimResponse.date",
              min: 0,
              max: "1",
              type: [
                {
                  code: "http://hl7.org/fhirpath/System.DateTime",
                },
              ],
            }}
            resource={null}
            parentStructureDefinition={null}
            canEdit={true}
            label="ClaimResponse.date"
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );

    const dateInput = screen.getByTestId(
      `YYYY-MM-DDTHH:mm:ssZ-field-ClaimResponse.date-input`
    ) as HTMLInputElement;

    userEvent.type(dateInput, "09-26-2024");

    expect(onChange).toHaveBeenCalledWith(
      "ClaimResponse.date",
      "2024-09-26T08:00:00+00:00"
    );

    const timeInput = screen.getByPlaceholderText("hh:mm:ss aa");
    userEvent.type(timeInput, "02:45:30 PM");

    expect(onChange).toHaveBeenCalledWith(
      "ClaimResponse.date",
      "2024-09-26T14:45:30+00:00"
    );
  });

  test("Should render DateTime component, should trigger setTouched", () => {
    const onChange = jest.fn();
    const setFieldTouched = jest.fn();
    const updatedMockFormik = {
      ...mockFormik,
      setFieldTouched: setFieldTouched,
      setFieldValue: onChange,
      getFieldProps: () => ({
        label: "ClaimResponse.date",
        value: "2024-09-262342342343423423",
        setFieldTouched: jest.fn(),
        setFieldValue: jest.fn(),
      }),
    };
    // need to figure out how to check this mock
    render(
      <FormikProvider value={updatedMockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            structureDefinition={{
              id: "ClaimResponse.date",
              path: "ClaimResponse.date",
              min: 0,
              max: "1",
              type: [
                {
                  code: "http://hl7.org/fhirpath/System.DateTime",
                },
              ],
            }}
            resource={null}
            label="ClaimResponse.date"
            canEdit={true}
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );

    expect(updatedMockFormik.setFieldTouched).toHaveBeenCalledWith(
      "ClaimResponse.date"
    );
  });

  test("Should render Date component, should trigger onChange", () => {
    const onChange = jest.fn();
    const setFieldTouched = jest.fn();
    const dateFormik = {
      ...mockFormik,
      setFieldTouched: setFieldTouched,
      setFieldValue: onChange,
      getFieldProps: () => ({
        label: "ClaimResponse.date",
        value: "2019-01-01",
        setFieldTouched: jest.fn(),
        setFieldValue: jest.fn(),
      }),
    };
    // need to figure out how to check this mock
    render(
      <FormikProvider value={dateFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            resource={null}
            structureDefinition={{
              id: "ClaimResponse.date",
              path: "ClaimResponse.date",
              min: 0,
              max: "1",
              type: [
                {
                  code: "date",
                },
              ],
            }}
            label="ClaimResponse.date"
            canEdit={true}
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );

    const dateField = screen.getByTestId("YYYY-MM-DD-field-ClaimResponse.date");
    expect(dateField).toBeInTheDocument();
    const dateFieldInput = screen.getByTestId(
      "YYYY-MM-DD-field-ClaimResponse.date-input"
    ) as HTMLInputElement;
    expect(dateFieldInput.value).toBe("01-01-2019");

    const formatSelectorField = screen.getByRole("combobox", {
      name: "Date Precision Level",
    });
    expect(formatSelectorField).toBeInTheDocument();
    userEvent.click(formatSelectorField);
    userEvent.click(screen.getByRole("option", { name: "YYYY" }));
    expect(onChange).toHaveBeenCalledWith("ClaimResponse.date", "2019");
  });

  test("Should render DateTime component, should trigger setTouched", () => {
    const onChange = jest.fn();
    const setFieldTouched = jest.fn();
    const updatedMockFormik = {
      ...mockFormik,
      setFieldTouched: setFieldTouched,
      setFieldValue: onChange,
      getFieldProps: () => ({
        label: "ClaimResponse.date",
        value: "1992-01-2342301T00:00:00234-08:00a234234",
        setFieldTouched: jest.fn(),
        setFieldValue: jest.fn(),
      }),
    };
    // need to figure out how to check this mock
    render(
      <FormikProvider value={updatedMockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            structureDefinition={{
              id: "ClaimResponse.date",
              path: "ClaimResponse.date",
              min: 0,
              max: "1",
              type: [
                {
                  code: "http://hl7.org/fhirpath/System.DateTime",
                },
              ],
            }}
            resource={null}
            label="ClaimResponse.date"
            canEdit={true}
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );

    expect(updatedMockFormik.setFieldTouched).toHaveBeenCalledWith(
      "ClaimResponse.date"
    );
  });

  test("Should render Boolean component", () => {
    const updatedMockFormik = {
      ...mockFormik,
      getFieldProps: () => ({
        label: "MedicationAbsent.meta",
        name: "MedicationAbsent.meta",
        value: `true`,
        setFieldTouched: jest.fn(),
        setFieldValue: jest.fn(),
      }),
    };
    render(
      <FormikProvider value={updatedMockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            structureDefinition={{
              id: "MedicationAbsent.meta",
              path: "MedicationAbsent.meta",
              min: 0,
              max: "1",
              type: [
                {
                  code: "boolean",
                },
              ],
            }}
            label={"MedicationAbsent.meta"}
            resource={null}
            canEdit={true}
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    expect(
      screen.getByTestId("boolean-input-field-MedicationAbsent.meta")
    ).toBeInTheDocument();
  });

  test("Should render URI component", () => {
    const updatedMockFormik = {
      ...mockFormik,
      getFieldProps: () => ({
        label: "DiagnosticReport.presentedForm.uri",
        name: "DiagnosticReport.presentedForm.uri",
        value: `urn:oid:2.16.840.1.113883.6.238`,
        setFieldTouched: jest.fn(),
        setFieldValue: jest.fn(),
      }),
    };
    render(
      <FormikProvider value={updatedMockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            resource={null}
            structureDefinition={{
              id: "Observation.uri",
              path: "Observation.uri",
              min: 0,
              max: "1",
              type: [
                {
                  code: "uri",
                },
              ],
            }}
            label={"DiagnosticReport.presentedForm.uri"}
            canEdit={true}
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    expect(
      screen.getByTestId("uri-input-field-DiagnosticReport.presentedForm.uri")
    ).toBeInTheDocument();
  });
  it("Should render URI component ( invalid input validation)", async () => {
    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            resource={null}
            structureDefinition={{
              id: "Observation.uri",
              path: "Observation.uri",
              min: 0,
              max: "1",
              type: [
                {
                  code: "uri",
                },
              ],
            }}
            label={"DiagnosticReport.presentedForm.uri"}
            canEdit={true}
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    const inputField = screen.getByTestId(
      "uri-input-field-DiagnosticReport.presentedForm.uri"
    );
    expect(inputField).toBeInTheDocument();
    await act(async () => {
      userEvent.type(inputField, "urn:oid:AA");
    });
    expect(mockSetFieldValue).toHaveBeenCalled();
  });

  test("Should render URL component", () => {
    const updatedMockFormik = {
      ...mockFormik,
      getFieldProps: () => ({
        label: "Observation.url",
        name: "Observation.url",
        value: `http://hl7.org/fhir/us/core/StructureDefinition/uscdi-requirement`,
        setFieldTouched: jest.fn(),
        setFieldValue: jest.fn(),
      }),
    };
    render(
      <FormikProvider value={updatedMockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            resource={null}
            structureDefinition={{
              id: "Observation.url",
              path: "Observation.url",
              min: 0,
              max: "1",
              type: [
                {
                  code: "url",
                },
              ],
            }}
            canEdit={true}
            label="Observation.url"
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    expect(
      screen.getByTestId("url-input-field-Observation.url")
    ).toBeInTheDocument();
  });

  test("Should render canonical url type attribute", () => {
    const canonicalUri = "https://example.com/blog";
    const updatedMockFormik = {
      ...mockFormik,
      getFieldProps: () => ({
        label: "Observation.issued",
        name: "Observation.issued",
        value: canonicalUri,
        setFieldTouched: jest.fn(),
        setFieldValue: jest.fn(),
      }),
    };
    render(
      <FormikProvider value={updatedMockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            structureDefinition={{
              id: "Observation.issued",
              path: "Observation.issued",
              min: 0,
              max: "1",
              type: [
                {
                  code: "canonical",
                },
              ],
            }}
            resource={undefined}
            canEdit={true}
            label="Observation.issued"
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    expect(
      screen.getByTestId("url-input-field-Observation.issued")
    ).toHaveValue(canonicalUri);
  });

  test("Should render Instant component for valid format", () => {
    const handleChange = jest.fn();
    const onChange = jest.fn();
    const setFieldTouched = jest.fn();
    const updatedMockFormik = {
      ...mockFormik,
      setFieldTouched: setFieldTouched,
      setFieldValue: onChange,
      getFieldProps: () => ({
        label: "Observation.issued",
        name: "Observation.issued",
        value: "2025-02-04T00:00:00.000+00:00",
        setFieldTouched: jest.fn(),
        setFieldValue: jest.fn(),
      }),
    };

    render(
      <FormikProvider value={updatedMockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            structureDefinition={{
              id: "Observation.issued",
              path: "Observation.issued",
              min: 0,
              max: "1",
              type: [
                {
                  code: "instant",
                },
              ],
            }}
            resource={undefined}
            parentStructureDefinition={undefined}
            canEdit={true}
            label="Observation.issued"
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    const dateInput = screen.getByTestId("Observation.issued_instant-input");
    expect(dateInput).toBeInTheDocument();
    expect(dateInput.getAttribute("aria-invalid")).toBe("false");
  });

  test("Should render errors if Invalid Instant format", () => {
    const errors = {
      Observation: {
        issued: "Invalid instant format",
      },
    };
    const onChange = jest.fn();
    const setFieldTouched = jest.fn();
    const updatedMockFormik = {
      ...mockFormik,
      setFieldTouched: setFieldTouched,
      setFieldValue: onChange,
      errors: errors,
      getFieldProps: () => ({
        label: "Observation.issued",
        name: "Observation.issued",
        value: "2025-02-04T00:00:00.000+00:00test",
        setFieldTouched: jest.fn(),
        setFieldValue: jest.fn(),
      }),
    };

    render(
      <FormikProvider value={updatedMockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            structureDefinition={{
              id: "Observation.issued",
              path: "Observation.issued",
              min: 0,
              max: "1",
              type: [
                {
                  code: "instant",
                },
              ],
            }}
            resource={undefined}
            parentStructureDefinition={undefined}
            canEdit={true}
            label="Observation.issued"
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    const dateInput = screen.getByTestId("Observation.issued_instant-input");
    expect(dateInput).toBeInTheDocument();
    expect(dateInput.getAttribute("aria-invalid")).toBe(
      errors.Observation.issued
    );
  });

  test("Instant validation should display field errors", () => {
    const touched = {
      Observation: {
        issued: true,
      },
    };
    const errors = {
      Observation: {
        issued: "This field is required",
      },
    };
    const formik = { ...mockFormik, errors, touched };
    render(
      <FormikProvider value={formik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            structureDefinition={{
              id: "Observation.issued",
              path: "Observation.issued",
              min: 0,
              max: "1",
              type: [
                {
                  code: "instant",
                },
              ],
            }}
            resource={undefined}
            parentStructureDefinition={undefined}
            canEdit={true}
            label="Observation.issued"
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    const inputField = screen.getByTestId("Observation.issued_instant-input");
    expect(inputField).toBeInTheDocument();
    expect(inputField.getAttribute("aria-invalid")).toBe(
      errors.Observation.issued
    );
    expect(
      screen.getByTestId("Observation.issued_instant-helper-text")
    ).toHaveTextContent(errors.Observation.issued);
  });

  test("Should render Date component", () => {
    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            resource={null}
            structureDefinition={{
              id: "ClaimResponse.date",
              path: "ClaimResponse.date",
              min: 0,
              max: "1",
              type: [
                {
                  code: "date",
                },
              ],
            }}
            label="ClaimResponse.date"
            parentStructureDefinition={null}
            canEdit={true}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );

    const inputDate = screen.getByTestId(
      `date-format-selector-field-ClaimResponse.date`
    );
    expect(inputDate).toBeInTheDocument();
  });

  test("Should render Time component", () => {
    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            resource={null}
            structureDefinition={{
              id: "ClaimResponse.time",
              path: "ClaimResponse.time",
              min: 0,
              max: "1",
              type: [
                {
                  extension: [
                    {
                      url: "http://hl7.org/fhir/StructureDefinition/structuredefinition-fhir-type",
                      valueUrl: "id",
                    },
                  ],
                  code: `http://hl7.org/fhir/R4/datatypes.html#time`,
                },
              ],
            }}
            label="ClaimResponse.time"
            parentStructureDefinition={null}
            canEdit={true}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    const inputTime = screen.getByPlaceholderText(
      "hh:mm:ss aa"
    ) as HTMLInputElement;
    expect(inputTime.value).toBe("01:23:45 AM");
    // Change the value of the first time component to trigger change event
    userEvent.type(inputTime, "082359AM");
    expect(inputTime).toHaveValue("08:23:59 AM");
  });

  test("Should render PositiveInt component", () => {
    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            resource={null}
            structureDefinition={{
              id: "ClaimResponse.order",
              path: "ClaimResponse.order",
              min: 0,
              max: "1",
              type: [
                {
                  code: "positiveInt",
                },
              ],
            }}
            label={"ClaimResponse.order"}
            parentStructureDefinition={null}
            canEdit={true}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    const inputField = screen.getByTestId(
      "integer-field-input-ClaimResponse.order"
    ) as HTMLInputElement;
    expect(inputField.value).toBe("1234");
  });

  test("Should render unsignedInt component", () => {
    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            structureDefinition={{
              id: "ClaimResponse.order",
              path: "ClaimResponse.order",
              min: 0,
              max: "1",
              type: [
                {
                  code: `unsignedInt`,
                },
              ],
            }}
            resource={null}
            label={"ClaimResponse.order"}
            parentStructureDefinition={null}
            canEdit={true}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );

    const inputField = screen.getByTestId(
      "integer-field-input-ClaimResponse.order"
    ) as HTMLInputElement;
    expect(inputField.value).toBe("1234");
  });

  test("Should render unsignedInt component", () => {
    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            structureDefinition={{
              id: "ClaimResponse.order",
              path: "ClaimResponse.order",
              min: 0,
              max: "1",
              type: [
                {
                  code: `http://hl7.org/fhirpath/System.Integer`,
                },
              ],
            }}
            resource={null}
            label={"ClaimResponse.order"}
            parentStructureDefinition={null}
            canEdit={true}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );

    const inputField = screen.getByTestId(
      "integer-field-input-ClaimResponse.order"
    ) as HTMLInputElement;
    expect(inputField.value).toBe("1234");
  });

  test("Should render unsignedInt component with and without [0] already added", () => {
    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            structureDefinition={{
              id: "ClaimResponse.order",
              path: "ClaimResponse.order",
              min: 0,
              max: "*",
              type: [
                {
                  code: `http://hl7.org/fhirpath/System.Integer`,
                },
              ],
            }}
            resource={null}
            label={"ClaimResponse.order"}
            parentStructureDefinition={null}
            canEdit={true}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    expect(screen.getByText("ClaimResponse.order[0]")).toBeInTheDocument();
  });
  test("Should render unsignedInt component with [0]", () => {
    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            structureDefinition={{
              id: "ClaimResponse.order[0]",
              path: "ClaimResponse.order",
              min: 0,
              max: "*",
              type: [
                {
                  code: `http://hl7.org/fhirpath/System.Integer`,
                },
              ],
            }}
            resource={null}
            label={"ClaimResponse.order[0]"}
            parentStructureDefinition={null}
            canEdit={true}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    expect(screen.getByText("ClaimResponse.order[0]")).toBeInTheDocument();
  });

  test("Should display unsupported", () => {
    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            resource={null}
            structureDefinition={{
              type: [
                {
                  code: "test",
                },
              ],
            }}
            parentStructureDefinition={null}
            canEdit={true}
            label={"test-label"}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    expect(screen.getByText(`Unsupported Type [test]`)).toBeInTheDocument();
    jest.resetAllMocks();
  });

  test("Should handle missing isComponentDataType", async () => {
    const fhirDefinitionsServiceApiMock = {
      getResourceTree: jest.fn().mockResolvedValue(codingDef),
      getAllChildren: jest.fn().mockReturnValue(codingTopLevelElements),
    } as unknown as FhirDefinitionsServiceApi;
    useFhirDefinitionsServiceApiMock.mockImplementation(
      () => fhirDefinitionsServiceApiMock
    );
    const handleChange = jest.fn();

    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            type="test"
            resource={null}
            required={false}
            value="test"
            onChange={handleChange}
            structureDefinition={null}
            parentStructureDefinition={null}
            canEdit={true}
            label="test-label"
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    expect(
      screen.queryByText(`Unsupported Type [test]`)
    ).not.toBeInTheDocument();
  });
  test("Should handle render of !isComponentDataType", async () => {
    const fhirDefinitionsServiceApiMock = {
      getResourceTree: jest.fn().mockResolvedValue(codingDef),
      getAllChildren: jest.fn().mockReturnValue(codingTopLevelElements),
    } as unknown as FhirDefinitionsServiceApi;
    useFhirDefinitionsServiceApiMock.mockImplementation(
      () => fhirDefinitionsServiceApiMock
    );

    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            resource={null}
            structureDefinition={{
              type: [
                {
                  code: "Meta",
                },
              ],
            }}
            parentStructureDefinition={{}}
            canEdit={true}
            label={"ClaimResponse.meta"}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    expect(
      screen.queryByText(`Unsupported Type [test]`)
    ).not.toBeInTheDocument();
  });

  test("Should handle render of !isComponentDataType with a profile extension", async () => {
    const fhirDefinitionsServiceApiMock = {
      getResourceTree: jest.fn().mockResolvedValue(codingDef),
      getAllChildren: jest.fn().mockReturnValue(codingTopLevelElements),
    } as unknown as FhirDefinitionsServiceApi;
    useFhirDefinitionsServiceApiMock.mockImplementation(
      () => fhirDefinitionsServiceApiMock
    );
    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            resource={null}
            structureDefinition={{
              id: "Patient.extension:race",
              extension: [
                {
                  url: "http://hl7.org/fhir/us/core/StructureDefinition/uscdi-requirement",
                  valueBoolean: true,
                },
                {
                  url: "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-keyelement",
                  valueBoolean: true,
                },
              ],
              path: "Patient.extension",
              sliceName: "race",
              short: "(QI-Core)(USCDI) US Core Race Extension",
              definition:
                "Concepts classifying the person into a named category of humans sharing common history, traits, geographical origin or nationality.  The race codes used to represent these concepts are based upon the [CDC Race and Ethnicity Code Set Version 1.0](http://www.cdc.gov/phin/resources/vocabulary/index.html) which includes over 900 concepts for representing race and ethnicity of which 921 reference race.  The race concepts are grouped by and pre-mapped to the 5 OMB race categories:\n\n   - American Indian or Alaska Native\n   - Asian\n   - Black or African American\n   - Native Hawaiian or Other Pacific Islander\n   - White.",
              min: 0,
              max: "1",
              base: {
                path: "DomainResource.extension",
                min: 0,
                max: "*",
              },
              type: [
                {
                  code: "Extension",
                  profile: [
                    "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
                  ],
                },
              ],
              condition: ["ele-1"],
              constraint: [
                {
                  key: "ele-1",
                  severity: "error",
                  human: "All FHIR elements must have a @value or children",
                  expression: "hasValue() or (children().count() > id.count())",
                  xpath: "@value|f:*|h:div",
                  source: "http://hl7.org/fhir/StructureDefinition/Element",
                },
                {
                  key: "ext-1",
                  severity: "error",
                  human: "Must have either extensions or value[x], not both",
                  expression: "extension.exists() != value.exists()",
                  xpath:
                    "exists(f:extension)!=exists(f:*[starts-with(local-name(.), 'value')])",
                  source: "http://hl7.org/fhir/StructureDefinition/Extension",
                },
              ],
              mustSupport: false,
              isModifier: false,
            }}
            parentStructureDefinition={{}}
            canEdit={true}
            label={"ClaimResponse.meta"}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    expect(
      screen.queryByText(`Unsupported Type [test]`)
    ).not.toBeInTheDocument();
  });

  test("Should render Coding component", async () => {
    const onChange = jest.fn();
    const setFieldTouched = jest.fn();
    const mockFormik = {
      setFieldTouched: setFieldTouched,
      setFieldValue: onChange,
      getFieldProps: () => ({
        label: "coding",
        name: "coding",
        value: undefined,
        setFieldTouched: jest.fn(),
        setFieldValue: jest.fn(),
      }),
    } as unknown as FormikProps<any>;

    render(
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
            requiredFields={{ coding: true }}
            formInfo={[
              "coding",
              {
                id: "coding",
                required: true,
                canBeMultipleCardinality: false,
              },
            ]}
          >
            <TypeEditor
              structureDefinition={{
                id: "coding",
                path: "coding",
                min: 1,
                max: "1",
                type: [
                  {
                    code: "Coding",
                  },
                ],
              }}
              resource={null}
              label="coding"
              canEdit={true}
              parentStructureDefinition={null}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      </ExecutionContextProvider>
    );

    const valueSetSelector = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    expect(valueSetSelector).toHaveTextContent("- Select -");
  });

  test("Should render Coding component for <Patient.extension[2].value[x]> and handle onChange properly", async () => {
    const fhirDefinitionsServiceApiMock = {
      getResourceTree: jest.fn().mockResolvedValue([{}]),
      getValueSetDefinition: jest
        .fn()
        .mockResolvedValue(mockValueSetDefinitionBirthSex),
    } as unknown as FhirDefinitionsServiceApi;
    useFhirDefinitionsServiceApiMock.mockImplementation(
      () => fhirDefinitionsServiceApiMock
    );

    const terminologyServiceApiMock = {
      getValueSetsExpansionForOids: jest
        .fn()
        .mockResolvedValue(valueSetExpansionBirthSex),
    } as unknown as TerminologyServiceApi;
    useTerminologyServiceApiMock.mockImplementation(
      () => terminologyServiceApiMock
    );

    const onChange = jest.fn();
    const setFieldTouched = jest.fn();
    const setFieldValue = jest.fn();
    const mockFormik = {
      setFieldTouched: setFieldTouched,
      setFieldValue: onChange,
      getFieldProps: () => ({
        label: "Patient.extension[2].value[x]",
        name: "Patient.extension[2].value[x]",
        value: "M",
        setFieldTouched: setFieldTouched,
        setFieldValue: setFieldValue,
      }),
    } as unknown as FormikProps<any>;

    render(
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
            requiredFields={{ "Patient.extension[2].value[x]": true }}
            formInfo={[
              "Patient.extension[2].value[x]",
              {
                id: "Patient.extension[2].value[x]",
                required: true,
                canBeMultipleCardinality: false,
              },
            ]}
          >
            <TypeEditor
              structureDefinition={structureDefinitionForExtensionValue}
              resource={null}
              label="Patient.extension[2].value[x]"
              canEdit={true}
              parentStructureDefinition={parentStructureDefinition}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      </ExecutionContextProvider>
    );

    const codeSelects = screen.getByRole("combobox", {
      name: "Patient.extension[2].value[x]",
    });
    expect(codeSelects).toBeInTheDocument();
    expect(screen.getByDisplayValue("M")).toBeInTheDocument();

    userEvent.click(codeSelects);
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(5);

    userEvent.click(options[0]);

    await waitFor(() => {
      expect(codeSelects).toHaveTextContent("F");
      expect(onChange).toHaveBeenCalledWith(
        "Patient.extension[2].valueCode",
        "F"
      );
      expect(setFieldTouched).toHaveBeenCalledWith(
        "Patient.extension[2].valueCode"
      );
    });
  });

  test("Should render CodeableConcept component", async () => {
    const onChange = jest.fn();
    const setFieldTouched = jest.fn();
    const mockFormik = {
      setFieldTouched: setFieldTouched,
      setFieldValue: onChange,
      getFieldProps: () => ({
        label: "Observation.code",
        name: "Observation.code",
        value: undefined,
        setFieldTouched: jest.fn(),
        setFieldValue: jest.fn(),
      }),
    } as unknown as FormikProps<any>;

    render(
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
            requiredFields={{ "Observation.code": true }}
            formInfo={[
              "Observation.code",
              {
                id: "Observation.code",
                required: true,
                canBeMultipleCardinality: false,
              },
            ]}
          >
            <TypeEditor
              structureDefinition={{
                id: "Observation.code",
                path: "Observation.code",
                min: 1,
                max: "1",
                type: [
                  {
                    code: "CodeableConcept",
                  },
                ],
              }}
              resource={null}
              label="Observation.code"
              canEdit={true}
              parentStructureDefinition={null}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      </ExecutionContextProvider>
    );

    const valueSetSelector = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    expect(valueSetSelector).toHaveTextContent("- Select -");
  });

  test("Should filter out excluded child types for '[x]' definitions", () => {
    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <TypeEditor
            resource={null}
            structureDefinition={{
              id: "SomeResource.value[x]",
              path: "SomeResource.value[x]",
              min: 0,
              max: "1",
              type: [
                {
                  code: "base64Binary",
                },
                {
                  code: "Annotation",
                },
                {
                  code: "string",
                },
              ],
            }}
            label={"SomeResource.value[x]"}
            canEdit={true}
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );
    const filteredChildDef = screen.getByTestId(
      "string-field-input-SomeResource.value[x]"
    );
    expect(filteredChildDef).toBeInTheDocument();
    expect(filteredChildDef.value).toBe("");
  });

  test("Should render PeriodDateTimeComponent when label ends with .period and childDefs contain .start and .end", () => {
    const mockFormik = {
      ...jest.requireActual("formik"),
      touched: {},
      errors: {},
      getFieldProps: () => ({
        label: "ClaimResponse.period",
        name: "ClaimResponse.period",
        value: "",
        onChange: jest.fn(),
        onBlur: jest.fn(),
      }),
      setFieldTouched: jest.fn(),
      setFieldValue: jest.fn(),
    };

    const childDefs = [
      { id: "ClaimResponse.period.start" },
      { id: "ClaimResponse.period.end" },
    ];

    jest.spyOn(React, "useMemo").mockImplementationOnce((fn) => fn());
    jest.mocked = jest.fn();

    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider requiredFields={{}} formInfo={[]}>
          <TypeEditor
            resource={null}
            structureDefinition={{
              id: "ClaimResponse.period",
              path: "ClaimResponse.period",
              min: 0,
              max: "1",
              type: [{ code: "Period" }],
            }}
            label={"ClaimResponse.period"}
            canEdit={true}
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );

    expect(screen.getByText("start")).toBeInTheDocument();
    expect(screen.getByText("End")).toBeInTheDocument();
  });

  test("Should render PeriodDateTimeComponent for ClaimResponse.period with time format", () => {
    const mockFormik = {
      touched: {},
      errors: {},
      getFieldProps: (label: string) => ({
        label,
        name: label,
        value:
          label === "ClaimResponse.period"
            ? {
                start: "2024-09-26T08:00:00+00:00",
                end: "2024-09-27T14:45:30+00:00",
              }
            : "",
        onChange: jest.fn(),
        onBlur: jest.fn(),
      }),
      setFieldTouched: jest.fn(),
      setFieldValue: jest.fn(),
    };

    render(
      <FormikProvider value={mockFormik}>
        <RequiredFieldsProvider requiredFields={{}} formInfo={[]}>
          <TypeEditor
            resource={null}
            structureDefinition={{
              id: "ClaimResponse.period",
              path: "ClaimResponse.period",
              min: 0,
              max: "1",
              type: [{ code: "Period" }],
            }}
            label={"ClaimResponse.period"}
            canEdit={true}
            parentStructureDefinition={null}
          />
        </RequiredFieldsProvider>
      </FormikProvider>
    );

    expect(screen.getByText("start")).toBeInTheDocument();
    expect(screen.getByText("End")).toBeInTheDocument();
    const timeInputs = screen.getAllByPlaceholderText("MM/DD/YYYY hh:mm aa");
    expect(timeInputs.length).toBeGreaterThanOrEqual(2);
  });

  test("TypeEditor renders IdentifierComponent fields for Identifier type", async () => {
    const mockFormik = {
      values: {},
      touched: {},
      errors: {},
      setFieldValue: jest.fn(),
      setFieldTouched: jest.fn(),
      getFieldProps: jest.fn().mockReturnValue({
        value: "",
        onChange: jest.fn(),
        onBlur: jest.fn(),
        name: "MedicationRequest.identifier[0]",
      }),
    };

    render(
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
          <RequiredFieldsProvider requiredFields={{}} formInfo={{}}>
            <TypeEditor
              label="MedicationRequest.identifier[0]"
              canEdit={true}
              resource={{}}
              structureDefinition={{
                id: "MedicationRequest.identifier",
                path: "MedicationRequest.identifier",
                type: [{ code: "Identifier" }],
                min: 0,
                max: "*",
              }}
              fieldRequired={false}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      </ExecutionContextProvider>
    );

    expect(await screen.findByLabelText("Use")).toBeInTheDocument();
    expect(
      await screen.findByLabelText("Value Set / Direct Reference Code")
    ).toBeInTheDocument();
    expect(await screen.findByLabelText("System")).toBeInTheDocument();
    expect(await screen.findByLabelText("Value")).toBeInTheDocument();
    expect(await screen.findByLabelText("Start Date")).toBeInTheDocument();
    expect(await screen.findByLabelText("End Date")).toBeInTheDocument();
    expect(await screen.findByLabelText("Assigner")).toBeInTheDocument();
  });

  test("TypeEditor renders TimingComponent fields for Timing type", async () => {
    const mockFormik = {
      values: {},
      touched: {},
      errors: {},
      setFieldValue: jest.fn(),
      setFieldTouched: jest.fn(),
      getFieldProps: jest.fn().mockReturnValue({
        value: "",
        onChange: jest.fn(),
        onBlur: jest.fn(),
        name: "MedicationRequest.timing",
      }),
    };

    render(
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
          <RequiredFieldsProvider requiredFields={{}} formInfo={{}}>
            <TypeEditor
              label="MedicationRequest.timing"
              canEdit={true}
              resource={{}}
              structureDefinition={{
                id: "MedicationRequest.timing",
                path: "MedicationRequest.timing",
                type: [{ code: "Timing" }],
                min: 0,
                max: "*",
              }}
              fieldRequired={false}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      </ExecutionContextProvider>
    );

    userEvent.click(
      screen.getByTestId("elements-heading-expansion-button-Timing")
    );
    expect(await screen.findByText("Event[0]")).toBeInTheDocument();
    expect(await screen.findByLabelText("Repeat.Bounds")).toBeInTheDocument();
    expect(await screen.findByLabelText("Repeat.Count")).toBeInTheDocument();
    expect(await screen.findByLabelText("Repeat.CountMax")).toBeInTheDocument();
    expect(await screen.findByLabelText("Repeat.Duration")).toBeInTheDocument();
    expect(
      await screen.findByLabelText("Repeat.DurationMax")
    ).toBeInTheDocument();

    const repeatUnits = screen.getAllByLabelText("Repeat.Unit(s)");
    expect(repeatUnits.length).toBe(2);

    expect(
      await screen.findByLabelText("Repeat.Frequency")
    ).toBeInTheDocument();
    expect(
      await screen.findByLabelText("Repeat.FrequencyMax")
    ).toBeInTheDocument();
    expect(await screen.findByLabelText("Repeat.Period")).toBeInTheDocument();
    expect(
      await screen.findByLabelText("Repeat.PeriodMax")
    ).toBeInTheDocument();
    expect(
      await screen.findByLabelText("Repeat.Day of Week[0]")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Repeat.Time of Day[0]")
    ).toBeInTheDocument();
    expect(await screen.findByLabelText("Repeat.When[0]")).toBeInTheDocument();
    expect(await screen.findByLabelText("Repeat.Offset")).toBeInTheDocument();
  });

  test("Should render Range component", async () => {
    const mockFormik: FormikContextType<any> = {
      values: {
        "Observation.referenceRange[0].age": {
          low: { value: "1" },
          high: { value: "10" },
        },
      },
      touched: {},
      getFieldProps: (label) => {
        const value = getNestedProperty(mockFormik.values, label);
        return { value, name: label, onChange: jest.fn(), onBlur: jest.fn() };
      },
      handleChange: () => {},
      setFieldValue: jest.fn(),
      setFieldTouched: jest.fn(),
    };

    render(
      <ExecutionContextProvider
        value={{
          measureState: [null, jest.fn()],
          bundleState: [null, jest.fn()],
          valueSetsState: [[], jest.fn()],
          executionContextReady: true,
          executing: false,
          setExecuting: jest.fn(),
          contextFailure: false,
        }}
      >
        <FormikProvider value={mockFormik}>
          <RequiredFieldsProvider requiredFields={{}} formInfo={[]}>
            <TypeEditor
              resource={null}
              structureDefinition={{
                id: "Observation.referenceRange[0].age",
                type: [{ code: "Range" }],
                required: false,
                canBeMultipleCardinality: false,
                max: "1",
                min: 0,
              }}
              label="Observation.referenceRange[0].age"
              canEdit={true}
              parentStructureDefinition={null}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      </ExecutionContextProvider>
    );

    // Assert Low/High inputs
    expect(await screen.findByText("Low")).toBeInTheDocument();
    expect(await screen.findByText("High")).toBeInTheDocument();

    // Check that "Unit(s)" appears twice
    const unitLabels = screen.getAllByText("Unit(s)");
    expect(unitLabels).toHaveLength(2);

    // Assert Comparator is NOT present
    expect(screen.queryByLabelText(/Comparator/i)).not.toBeInTheDocument();
  });

  test("renders QuantityComponent fields correctly", async () => {
    useFhirDefinitionsServiceApiMock.mockImplementation(
      () =>
        ({
          getValueSetDefinition: jest.fn().mockResolvedValue({
            resourceType: "ValueSet",
            url: "http://hl7.org/fhir/ValueSet/quantity-comparator",
            expansion: {
              contains: [
                {
                  system: "http://hl7.org/fhir/quantity-comparator",
                  code: "<",
                  display: "Less than",
                },
                {
                  system: "http://hl7.org/fhir/quantity-comparator",
                  code: "<=",
                  display: "Less or Equal to",
                },
                {
                  system: "http://hl7.org/fhir/quantity-comparator",
                  code: ">=",
                  display: "Greater or Equal to",
                },
                {
                  system: "http://hl7.org/fhir/quantity-comparator",
                  code: ">",
                  display: "Greater than",
                },
              ],
            },
          }),
        } as unknown as FhirDefinitionsServiceApi)
    );

    const mockFormikQuantity: FormikContextType<any> = {
      values: {
        "Observation.valueQuantity": {
          value: 10,
          unit: "mg",
          system: "http://unitsofmeasure.org",
          code: "mg",
        },
      },
      touched: {},
      getFieldProps: (label) => {
        const value = getNestedProperty(mockFormikQuantity.values, label);
        return { value, name: label, onChange: jest.fn(), onBlur: jest.fn() };
      },
      handleChange: () => {},
      setFieldValue: jest.fn(),
      setFieldTouched: jest.fn(),
    };

    render(
      <ExecutionContextProvider
        value={{
          measureState: [null, jest.fn()],
          bundleState: [null, jest.fn()],
          valueSetsState: [[], jest.fn()],
          executionContextReady: true,
          executing: false,
          setExecuting: jest.fn(),
          contextFailure: false,
        }}
      >
        <FormikProvider value={mockFormikQuantity}>
          <RequiredFieldsProvider
            requiredFields={mockRequiredFields}
            formInfo={mockFormInfo}
          >
            <TypeEditor
              resource={null}
              structureDefinition={{
                id: "Observation.valueQuantity",
                path: "Observation.valueQuantity",
                min: 0,
                max: "1",
                type: [{ code: "Quantity" }],
              }}
              label="Observation.valueQuantity"
              canEdit={true}
              parentStructureDefinition={null}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      </ExecutionContextProvider>
    );

    // Comparator
    const comparator = await screen.findByLabelText("Comparator");
    expect(comparator).toBeInTheDocument();

    // Value input
    const valueInput = await screen.findByTestId("decimal-input-field-Value");
    expect(valueInput).toBeInTheDocument();

    // Unit input
    const unitInput = await screen.findByTestId("unit-input-input");
    expect(unitInput).toBeInTheDocument();
  });

  test("renders SimpleQuantityComponent fields correctly inside TypeEditor", async () => {
    const fhirDefinitionsServiceApiMock = {
      getResourceTree: jest.fn().mockResolvedValue(codingDef),
      getValueSetDefinition: jest.fn().mockResolvedValue({
        resourceType: "ValueSet",
        url: "http://hl7.org/fhir/ValueSet/quantity-comparator",
        expansion: {
          contains: [
            {
              system: "http://hl7.org/fhir/quantity-comparator",
              code: "<",
              display: "Less than",
            },
            {
              system: "http://hl7.org/fhir/quantity-comparator",
              code: "<=",
              display: "Less or Equal to",
            },
            {
              system: "http://hl7.org/fhir/quantity-comparator",
              code: ">=",
              display: "Greater or Equal to",
            },
            {
              system: "http://hl7.org/fhir/quantity-comparator",
              code: ">",
              display: "Greater than",
            },
          ],
        },
      }),
    } as unknown as FhirDefinitionsServiceApi;

    useFhirDefinitionsServiceApiMock.mockImplementation(
      () => fhirDefinitionsServiceApiMock
    );

    const mockFormikSimpleQuantity: FormikContextType<any> = {
      values: {
        "Observation.simpleQuantity": {
          value: 5,
          unit: "kg",
          system: "http://unitsofmeasure.org",
          code: "kg",
        },
      },
      touched: {},
      getFieldProps: (label) => {
        const value = getNestedProperty(mockFormikSimpleQuantity.values, label);
        return { value, name: label, onChange: jest.fn(), onBlur: jest.fn() };
      },
      handleChange: () => {},
      setFieldValue: jest.fn(),
      setFieldTouched: jest.fn(),
    };

    render(
      <ExecutionContextProvider
        value={{
          measureState: [null, jest.fn()],
          bundleState: [null, jest.fn()],
          valueSetsState: [[], jest.fn()],
          executionContextReady: true,
          executing: false,
          setExecuting: jest.fn(),
          contextFailure: false,
        }}
      >
        <FormikProvider value={mockFormikSimpleQuantity}>
          <RequiredFieldsProvider
            requiredFields={mockRequiredFields}
            formInfo={mockFormInfo}
          >
            <TypeEditor
              resource={null}
              structureDefinition={{
                id: "Observation.simpleQuantity",
                path: "Observation.simpleQuantity",
                min: 0,
                max: "1",
                type: [
                  {
                    code: "Quantity",
                    profile: [
                      "http://hl7.org/fhir/StructureDefinition/SimpleQuantity",
                    ],
                  },
                ],
              }}
              label="Observation.simpleQuantity"
              canEdit={true}
              parentStructureDefinition={null}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      </ExecutionContextProvider>
    );

    // Value input
    const valueInput = await screen.findByTestId("decimal-input-field-Value");
    expect(valueInput).toBeInTheDocument();

    // Unit input
    const unitInput = await screen.findByTestId("unit-input-input");
    expect(unitInput).toBeInTheDocument();

    // Comparator should NOT exist
    const comparator = screen.queryByLabelText("Comparator");
    expect(comparator).not.toBeInTheDocument();
  });

  test("updates Formik when MoneyComponent value or currency changes", async () => {
    useFhirDefinitionsServiceApiMock.mockImplementation(
      () =>
        ({
          getValueSetDefinition: jest.fn().mockResolvedValue({
            resourceType: "ValueSet",
            url: "http://hl7.org/fhir/ValueSet/currencies",
            expansion: {
              contains: [
                {
                  system: "urn:iso:std:iso:4217",
                  code: "CAD",
                  display: "Canadian dollar",
                },
                {
                  system: "urn:iso:std:iso:4217",
                  code: "USD",
                  display: "United States dollar",
                },
                {
                  system: "urn:iso:std:iso:4217",
                  code: "USN",
                  display: "United States dollar (next day) (funds code)",
                },
              ],
            },
          }),
        } as unknown as FhirDefinitionsServiceApi)
    );

    const claimResource = {
      id: "1",
      resourceType: "Claim",
      total: { value: 100, currency: "USD" },
    };

    const mockFormik: FormikContextType<any> = {
      values: { Claim: claimResource },
      touched: {},
      getFieldProps: (label) => {
        const value = getNestedProperty(mockFormik.values, label);
        return {
          value,
          name: label,
          onChange: jest.fn(),
          onBlur: jest.fn(),
        };
      },
      handleChange: () => {},
      setFieldValue: jest.fn(),
      setFieldTouched: jest.fn(),
    };

    render(
      <ExecutionContextProvider
        value={{
          measureState: [null, jest.fn()],
          bundleState: [null, jest.fn()],
          valueSetsState: [[], jest.fn()],
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
              resource={null}
              structureDefinition={{
                id: "Claim.total",
                path: "Claim.total",
                min: 0,
                max: "1",
                type: [
                  {
                    code: "Money",
                  },
                ],
              }}
              label="Claim.total"
              canEdit={true}
              parentStructureDefinition={null}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      </ExecutionContextProvider>
    );

    const valueInput = (await screen.findByTestId(
      "decimal-input-field-Value"
    )) as HTMLInputElement;
    expect(valueInput).toBeInTheDocument();
    expect(valueInput.value).toBe("100");

    await userEvent.clear(valueInput);
    await userEvent.type(valueInput, "250");
    expect(mockFormik.setFieldValue).toHaveBeenCalledWith(
      "Claim.total.value",
      250
    );

    const currencySelect = await screen.findByLabelText("Currency");
    expect(currencySelect).toBeInTheDocument();
    expect(currencySelect).toHaveTextContent("United States dollar");

    userEvent.click(currencySelect);
    const cadOption = await screen.findByRole("option", {
      name: "Canadian dollar",
    });
    userEvent.click(cadOption);

    expect(mockFormik.setFieldValue).toHaveBeenCalledWith(
      "Claim.total.currency",
      "CAD"
    );
    await waitFor(() => {
      expect(currencySelect).toHaveTextContent("Canadian dollar");
    });
  });

  // ========== NEW TESTS FOR ARRAY RENDERING AND CARDINALITY ==========

  describe("Array rendering and multiple cardinality", () => {
    const formik = {
      handleChange: jest.fn(),
      setFieldValue: jest.fn(),
      setFieldTouched: jest.fn(),
    };
    test("Should render multiple string components when values is an array with multiple cardinality", () => {
      const arrayFormik = {
        ...formik,
        values: {
          Patient: {
            name: [
              {
                family: "Doe",
                given: ["John", "Johnny", "Jonathan"],
              },
            ],
          },
        },
        getFieldProps: (label: string) => {
          const match = label.match(/given\[(\d+)]/);
          if (match) {
            const index = parseInt(match[1]);
            return {
              value: ["John", "Johnny", "Jonathan"][index],
              name: label,
              onChange: jest.fn(),
              onBlur: jest.fn(),
            };
          }
        },
      };

      render(
        <FormikProvider value={arrayFormik}>
          <RequiredFieldsProvider
            requiredFields={mockRequiredFields}
            formInfo={mockFormInfo}
          >
            <TypeEditor
              resource={null}
              structureDefinition={{
                id: "Patient.name.given",
                path: "Patient.name.given",
                min: 0,
                max: "*",
                type: [
                  {
                    code: "string",
                  },
                ],
              }}
              label="Patient.name[0].given"
              canEdit={true}
              parentStructureDefinition={null}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      );

      // Check values
      expect(
        (
          screen.getByTestId(
            "string-field-input-Patient.name[0].given[0]"
          ) as HTMLInputElement
        ).value
      ).toBe("John");
      expect(
        (
          screen.getByTestId(
            "string-field-input-Patient.name[0].given[1]"
          ) as HTMLInputElement
        ).value
      ).toBe("Johnny");
      expect(
        (
          screen.getByTestId(
            "string-field-input-Patient.name[0].given[2]"
          ) as HTMLInputElement
        ).value
      ).toBe("Jonathan");

      // Add button should only appear on the last element
      const addButtons = screen.getAllByText("Add Given");
      expect(addButtons).toHaveLength(1);
      // click the add button
      userEvent.click(addButtons[0]);

      // Should call setFieldValue
      expect(formik.setFieldValue).toHaveBeenCalled();
    });

    test("Should render DateTime components as array when multiple cardinality", () => {
      const dateTimeArrayFormik = {
        ...formik,
        values: {
          MedicationRequest: {
            dosageInstruction: [
              {
                timing: {
                  event: ["2024-01-01", "2024-02-01"],
                },
              },
            ],
          },
        },
        getFieldProps: (label) => {
          const match = label.match(/event\[(\d+)]/);
          if (match) {
            const index = parseInt(match[1]);
            return {
              value: ["2024-01-01", "2024-02-01"][index],
              name: label,
              onChange: jest.fn(),
              onBlur: jest.fn(),
            };
          }
        },
      };

      render(
        <FormikProvider value={dateTimeArrayFormik}>
          <RequiredFieldsProvider
            requiredFields={mockRequiredFields}
            formInfo={mockFormInfo}
          >
            <TypeEditor
              resource={null}
              structureDefinition={{
                id: "MedicationRequest.dosageInstruction.timing.event",
                path: "MedicationRequest.dosageInstruction.timing.event",
                min: 0,
                max: "*",
                type: [
                  {
                    code: "dateTime",
                  },
                ],
              }}
              label="MedicationRequest.dosageInstruction[0].timing.event"
              canEdit={true}
              parentStructureDefinition={null}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      );

      const datetime1 = screen.getByTestId(
        "YYYY-MM-DD-field-MedicationRequest.dosageInstruction[0].timing.event[0]-input"
      ) as HTMLInputElement;
      const datetime2 = screen.getByTestId(
        "YYYY-MM-DD-field-MedicationRequest.dosageInstruction[0].timing.event[1]"
      );
      // Should render 2 DateTime components
      expect(datetime1).toBeInTheDocument();
      expect(datetime2).toBeInTheDocument();

      // let's change the value of the first datetime component to trigger change event
      userEvent.type(datetime1, "09-02-2025");
      expect(datetime1.value).toEqual("09-02-2025");
      expect(formik.setFieldValue).toHaveBeenCalled();
      expect(formik.setFieldTouched).toHaveBeenCalled();
    });

    test("Should render Time components as array when multiple cardinality", () => {
      const timeArrayFormik = {
        ...formik,
        values: {
          MedicationRequest: {
            dosageInstruction: [
              {
                timing: {
                  timeOfDay: ["10:30:10", "11:30:10"],
                },
              },
            ],
          },
        },
        getFieldProps: (label) => {
          const match = label.match(/timeOfDay\[(\d+)]/);
          if (match) {
            const index = parseInt(match[1]);
            return {
              value: ["10:30:10", "11:30:10"][index],
              name: label,
              onChange: jest.fn(),
              onBlur: jest.fn(),
            };
          }
        },
      };

      render(
        <FormikProvider value={timeArrayFormik}>
          <RequiredFieldsProvider
            requiredFields={mockRequiredFields}
            formInfo={mockFormInfo}
          >
            <TypeEditor
              resource={null}
              structureDefinition={{
                id: "MedicationRequest.dosageInstruction.timing.timeOfDay",
                path: "MedicationRequest.dosageInstruction.timing.timeOfDay",
                min: 0,
                max: "*",
                type: [
                  {
                    code: "time",
                  },
                ],
              }}
              label="MedicationRequest.dosageInstruction[0].timing.timeOfDay"
              canEdit={true}
              parentStructureDefinition={null}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      );
      const times = screen.getAllByPlaceholderText("hh:mm:ss aa");
      expect(times.length).toEqual(2);
      // Change the value of the first time component to trigger change event
      userEvent.type(times[0], "082359AM");
      expect(times[0]).toHaveValue("08:23:59 AM");
      expect(formik.setFieldTouched).toHaveBeenCalled();
    });

    test("Should render Code components as array when multiple cardinality", () => {
      const codeArrayFormik = {
        ...formik,
        values: {
          MedicationRequest: {
            dosageInstruction: [
              {
                timing: {
                  dayOfWeek: ["mon", "tue"],
                },
              },
            ],
          },
        },
        getFieldProps: (label) => {
          const match = label.match(/dayOfWeek\[(\d+)]/);
          if (match) {
            const index = parseInt(match[1]);
            return {
              value: ["mon", "tue"][index],
              name: label,
              onChange: jest.fn(),
              onBlur: jest.fn(),
            };
          }
        },
      };

      render(
        <FormikProvider value={codeArrayFormik}>
          <RequiredFieldsProvider
            requiredFields={mockRequiredFields}
            formInfo={mockFormInfo}
          >
            <TypeEditor
              resource={null}
              structureDefinition={{
                id: "MedicationRequest.dosageInstruction.timing.dayOfWeek",
                path: "MedicationRequest.dosageInstruction.timing.dayOfWeek",
                min: 0,
                max: "*",
                type: [
                  {
                    code: "code",
                  },
                ],
              }}
              label="MedicationRequest.dosageInstruction[0].timing.dayOfWeek"
              canEdit={true}
              parentStructureDefinition={null}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      );

      // Should render 2 Code components
      const codeInput1 = screen.getByTestId(
        "code-selector-input-MedicationRequest.dosageInstruction[0].timing.dayOfWeek[0]"
      ) as HTMLInputElement;
      expect(codeInput1.value).toEqual("mon");
      const codeInput2 = screen.getByTestId(
        "code-selector-input-MedicationRequest.dosageInstruction[0].timing.dayOfWeek[1]"
      ) as HTMLInputElement;
      expect(codeInput2.value).toEqual("tue");
    });

    test("Should render Quantity components as array when multiple cardinality", async () => {
      useFhirDefinitionsServiceApiMock.mockImplementation(
        () =>
          ({
            getValueSetDefinition: jest.fn().mockResolvedValue({
              resourceType: "ValueSet",
              url: "http://hl7.org/fhir/ValueSet/quantity-comparator",
              expansion: {
                contains: [
                  {
                    system: "http://hl7.org/fhir/quantity-comparator",
                    code: "<",
                    display: "Less than",
                  },
                  {
                    system: "http://hl7.org/fhir/quantity-comparator",
                    code: "<=",
                    display: "Less or Equal to",
                  },
                  {
                    system: "http://hl7.org/fhir/quantity-comparator",
                    code: ">=",
                    display: "Greater or Equal to",
                  },
                  {
                    system: "http://hl7.org/fhir/quantity-comparator",
                    code: ">",
                    display: "Greater than",
                  },
                ],
              },
            }),
          } as unknown as FhirDefinitionsServiceApi)
      );

      const mockFormikQuantity: FormikContextType<any> = {
        values: {
          Device: {
            property: {
              valueQuantity: [
                { value: 10, unit: "mg", comparator: ">" },
                { value: 20, unit: "g", comparator: "<=" },
              ],
            },
          },
        },
        touched: {},
        errors: {},
        setFieldValue: jest.fn(),
        setFieldTouched: jest.fn(),
        handleChange: jest.fn(),
        getFieldProps: jest.fn(),
      };

      render(
        <ExecutionContextProvider
          value={{
            measureState: [null, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [[], jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <FormikProvider value={mockFormikQuantity}>
            <RequiredFieldsProvider
              requiredFields={mockRequiredFields}
              formInfo={mockFormInfo}
            >
              <TypeEditor
                resource={null}
                structureDefinition={{
                  id: "Device.property.valueQuantity",
                  path: "Device.property.valueQuantity",
                  min: 0,
                  max: "*",
                  type: [{ code: "Quantity" }],
                }}
                label="Device.property.valueQuantity"
                canEdit={true}
                parentStructureDefinition={null}
              />
            </RequiredFieldsProvider>
          </FormikProvider>
        </ExecutionContextProvider>
      );

      const valueInputs = await screen.findAllByTestId(
        "decimal-input-field-Value"
      );
      const unitInputs = await screen.findAllByTestId("unit-input-input");
      const comparatorInputs = await screen.findAllByTestId(
        "code-selector-input-Comparator"
      );

      expect(valueInputs).toHaveLength(2);
      expect(unitInputs).toHaveLength(2);
      expect(comparatorInputs).toHaveLength(2);

      expect(valueInputs[0]).toHaveValue(10);
      expect(valueInputs[1]).toHaveValue(20);

      expect(unitInputs[0]).toHaveValue("mg");
      expect(unitInputs[1]).toHaveValue("g");

      expect(comparatorInputs[0]).toHaveValue(">");
      expect(comparatorInputs[1]).toHaveValue("<=");

      const addButtons = screen.getAllByText("Add Value Quantity");
      expect(addButtons).toHaveLength(1);

      userEvent.click(addButtons[0]);

      expect(mockFormikQuantity.setFieldValue).toHaveBeenCalled();
    });

    test("Should not show add button for root level elements", () => {
      const rootFormik = {
        ...mockFormik,
        values: {
          ClaimResponse: {
            id: ["id1", "id2"],
          },
        },
        getFieldProps: (label) => {
          if (label.includes("[")) {
            return {
              value: label.includes("[0]") ? "id1" : "id2",
              name: label,
              onChange: jest.fn(),
              onBlur: jest.fn(),
            };
          }
          return {
            value: ["id1", "id2"],
            name: label,
            onChange: jest.fn(),
            onBlur: jest.fn(),
          };
        },
      };

      render(
        <FormikProvider value={rootFormik}>
          <RequiredFieldsProvider
            requiredFields={mockRequiredFields}
            formInfo={mockFormInfo}
          >
            <TypeEditor
              resource={null}
              structureDefinition={{
                id: "ClaimResponse.id",
                path: "ClaimResponse.id",
                min: 0,
                max: "*",
                type: [
                  {
                    code: "string",
                  },
                ],
              }}
              label="ClaimResponse.id"
              canEdit={true}
              parentStructureDefinition={null}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      );

      // Should not show add button for root level elements (id is root level)
      const addButtons = screen.queryAllByText("Id");
      expect(addButtons).toHaveLength(0);
    });
  });
  test("Should render a reference component", () => {
    const mockBundle = {
      entry: [{ resource: { resourceType: "Patient", id: "patient-1" } }],
    };

    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: { bundle: mockBundle },
      loading: false,
      error: null,
    });
    const onChange = jest.fn();
    const setFieldTouched = jest.fn();
    const mockFormik = {
      setFieldTouched: setFieldTouched,
      setFieldValue: onChange,
      getFieldProps: () => ({
        label: "Claim.patient",
        name: "Claim.patient",
        value: undefined,
        setFieldTouched: jest.fn(),
        setFieldValue: jest.fn(),
      }),
      values: {},
    } as unknown as FormikProps<any>;

    render(
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
            requiredFields={{ "Claim.patient": true }}
            formInfo={[
              "Claim.patient",
              {
                id: "Claim.patient",
                required: true,
                canBeMultipleCardinality: false,
              },
            ]}
          >
            <TypeEditor
              structureDefinition={{
                id: "Claim.patient",
                path: "Claim.patient",
                min: 0,
                max: "*",
                type: [
                  {
                    code: "Reference",
                    targetProfile: [
                      "http://hl7.org/fhir/StructureDefinition/Patient",
                    ],
                  },
                ],
              }}
              label="Claim.patient"
              canEdit={true}
              parentStructureDefinition={null}
            />
          </RequiredFieldsProvider>
        </FormikProvider>
      </ExecutionContextProvider>
    );

    const referenceSelect = screen.getByRole("combobox", {
      name: "Reference Type",
    });
    expect(referenceSelect).toBeInTheDocument();
    expect(referenceSelect).toHaveTextContent("Select");
  });
});
