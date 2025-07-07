import * as React from "react";
import { fireEvent, render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TypeEditor from "./TypeEditor";
import useFhirDefinitionsServiceApi, {
  FhirDefinitionsServiceApi,
} from "../../../../../../../api/useFhirDefinitionsService";
import useTerminologyServiceApi, { TerminologyServiceApi } from "../../../../../../../api/useTerminologyServiceApi";
import { FormikProvider, FormikContextType, FormikProps } from "formik";
import { RequiredFieldsProvider } from "./RequiredFieldsContext";
import mockRequiredFields from "./mockRequiredFields";
import mockFormInfo from "./mockFormInfo";
import { ExecutionContextProvider } from "../../../../../../routes/qiCore/ExecutionContext";
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
jest.mock("../../../../../../../api/useFhirDefinitionsService");
const useFhirDefinitionsServiceApiMock =
  useFhirDefinitionsServiceApi as jest.Mock<FhirDefinitionsServiceApi>;
const fhirDefinitionsServiceApiMock = {
  getResourceTree: jest.fn().mockResolvedValue(codingDef),
} as unknown as FhirDefinitionsServiceApi;
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
useFhirDefinitionsServiceApiMock.mockImplementation(
  () => fhirDefinitionsServiceApiMock
);

jest.mock("../../../../../../../api/useTerminologyServiceApi");
const useTerminologyServiceApiMock =
  useTerminologyServiceApi as jest.Mock<TerminologyServiceApi>;
const terminologyServiceApiMock = {
  getValueSetsExpansionForOids: jest.fn().mockResolvedValue([]),
} as unknown as TerminologyServiceApi;
useTerminologyServiceApiMock.mockImplementation(
  () => terminologyServiceApiMock
);

describe("TypeEditor Component", () => {
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

    fireEvent.change(inputField, { target: { value: "1234-abcd-ABCD-5678" } });
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

    fireEvent.change(dateInput, { target: { value: "09/26/2024" } });

    expect(onChange).toHaveBeenCalledWith(
      "ClaimResponse.date",
      "2024-09-26T08:00:00+00:00"
    );

    const timeInput = screen.getByPlaceholderText("hh:mm:ss aa");
    fireEvent.change(timeInput, { target: { value: "02:45:30 PM" } });

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
    expect(dateFieldInput.value).toBe("01/01/2019");

    const formatSelectorField = screen.getByTestId(
      "date-format-selector-input-field-ClaimResponse.date"
    );
    expect(formatSelectorField).toBeInTheDocument();
    fireEvent.change(formatSelectorField, {
      target: { value: "YYYY" },
    });
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
      <RequiredFieldsProvider
        requiredFields={mockRequiredFields}
        formInfo={mockFormInfo}
      >
        <TypeEditor
          type={`test`}
          resource={null}
          required={false}
          value={`test`}
          onChange={handleChange}
          structureDefinition={null}
          parentStructureDefinition={null}
          canEdit={true}
          label={"test-label"}
        />
      </RequiredFieldsProvider>
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
});
