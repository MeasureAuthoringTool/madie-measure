import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import TypeEditor from "./TypeEditor";
import useFhirDefinitionsServiceApi, {
  FhirDefinitionsServiceApi,
} from "../../../../../../../api/useFhirDefinitionsService";
import { FormikProvider, FormikContextType } from "formik";

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
  setFieldValue: jest.fn(),
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
    isComponentDataType: jest.fn().mockReturnValue(true),
    getAllChildren: jest.fn().mockReturnValue(codingTopLevelElements),
    getTopLevelElements: jest.fn().mockReturnValue(codingTopLevelElements),
    updateChildrenPaths: jest.fn().mockReturnValue(codingTopLevelElements),
  };
});
useFhirDefinitionsServiceApiMock.mockImplementation(
  () => fhirDefinitionsServiceApiMock
);

describe("TypeEditor Component", () => {
  test("Should render String component", () => {
    const handleChange = jest.fn();
    render(
      <FormikProvider value={mockFormik}>
        <TypeEditor
          type={`http://hl7.org/fhirpath/System.String`}
          required={false}
          onChange={handleChange}
          structureDefinition={null}
          label={"ClaimResponse.id"}
          value={claimResponseValues.ClaimResponse.id}
        />
      </FormikProvider>
    );
    const inputField = screen.getByTestId(
      "string-field-input-ClaimResponse.id"
    ) as HTMLInputElement;
    expect(inputField).toBeInTheDocument();
    expect(inputField.value).toBe("test");
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
    const handleChange = jest.fn();
    const errorFormik = { ...mockFormik, errors, touched };
    render(
      <FormikProvider value={errorFormik}>
        <TypeEditor
          type={`http://hl7.org/fhirpath/System.String`}
          required={false}
          onChange={handleChange}
          structureDefinition={null}
          label={"ClaimResponse.id"}
        />
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
    const handleChange = jest.fn();
    render(
      <TypeEditor
        type={`Period`}
        required={false}
        value={null}
        onChange={handleChange}
        structureDefinition={null}
      />
    );

    expect(screen.getByText("start")).toBeInTheDocument();
    expect(screen.getByText("End")).toBeInTheDocument();
  });

  test("Should render DateTime component", () => {
    const handleChange = jest.fn();
    render(
      <FormikProvider value={mockFormik}>
        <TypeEditor
          type={`http://hl7.org/fhirpath/System.DateTime`}
          required={false}
          value={`2024-09-26T08:33:33.000-05:00`}
          onChange={handleChange}
          structureDefinition={null}
          label="ClaimResponse.date"
        />
      </FormikProvider>
    );

    const inputDate = screen.getByTestId(
      `date-time-format-selector-field-ClaimResponse.date`
    );
    expect(inputDate).toBeInTheDocument();
  });

  test("Should render DateTime component, should trigger onChange", () => {
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
        <TypeEditor
          type={`http://hl7.org/fhirpath/System.DateTime`}
          required={false}
          value="1992-01-01T00:00:00-08:00"
          onChange={() => {}}
          structureDefinition={null}
          label="ClaimResponse.date"
        />
      </FormikProvider>
    );

    const inputDate = screen.getByTestId(
      `date-time-format-selector-field-ClaimResponse.date`
    );
    expect(inputDate).toBeInTheDocument();
    const timeZone = screen.getByTestId(
      "timezone-input-field-ClaimResponse.date-input"
    );
    expect(timeZone.value).toBe("America/Los_Angeles");
    const guam = "Pacific/Guam";
    fireEvent.change(timeZone, {
      target: {
        value: guam,
      },
    });
    expect(onChange).toHaveBeenCalledWith(
      "ClaimResponse.date",
      "1992-01-01T18:00:00+10:00"
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
        <TypeEditor
          type={`http://hl7.org/fhirpath/System.DateTime`}
          required={false}
          value="2024-09-26asdf332324234"
          onChange={() => {}}
          structureDefinition={null}
          label="ClaimResponse.date"
        />
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
        <TypeEditor
          type="date"
          required={false}
          value="01-01-1992"
          onChange={() => {}}
          structureDefinition={null}
          label="ClaimResponse.date"
        />
      </FormikProvider>
    );

    const dateField = screen.getByTestId("YYYY-MM-DD-field-ClaimResponse.date");
    expect(dateField).toBeInTheDocument();
    const dateFieldInput = screen.getByTestId(
      "YYYY-MM-DD-field-ClaimResponse.date-input"
    );
    expect(dateFieldInput).toBeInTheDocument();
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
        <TypeEditor
          type={`http://hl7.org/fhirpath/System.DateTime`}
          required={false}
          value="1992-01-01T00:00:00-08:00"
          onChange={() => {}}
          structureDefinition={null}
          label="ClaimResponse.date"
        />
      </FormikProvider>
    );

    expect(updatedMockFormik.setFieldTouched).toHaveBeenCalledWith(
      "ClaimResponse.date"
    );
  });

  test("Should render Boolean component", () => {
    const handleChange = jest.fn();
    render(
      <FormikProvider value={mockFormik}>
        <TypeEditor
          type={`boolean`}
          required={false}
          value={`true`}
          onChange={handleChange}
          structureDefinition={null}
          label={"MedicationAbsent.meta"}
        />
      </FormikProvider>
    );
    expect(
      screen.getByTestId("boolean-input-field-MedicationAbsent.meta")
    ).toBeInTheDocument();
  });

  test("Should render URI component", () => {
    const handleChange = jest.fn();
    render(
      <FormikProvider value={mockFormik}>
        <TypeEditor
          type={`uri`}
          required={true}
          value={`urn:oid:2.16.840.1.113883.6.238`}
          onChange={handleChange}
          structureDefinition={null}
          label={"DiagnosticReport.presentedForm.uri"}
        />
      </FormikProvider>
    );
    expect(
      screen.getByTestId("uri-input-field-DiagnosticReport.presentedForm.uri")
    ).toBeInTheDocument();
  });

  test("Should render URL component", () => {
    const handleChange = jest.fn();
    render(
      <TypeEditor
        type={`url`}
        required={true}
        value={`http://hl7.org/fhir/us/core/StructureDefinition/uscdi-requirement`}
        onChange={handleChange}
        structureDefinition={null}
      />
    );
    expect(screen.getByTestId("url-input-field-URL")).toBeInTheDocument();
  });

  test("Should render canonical url type attribute", () => {
    const handleChange = jest.fn();
    const canonicalUri = "https://example.com/blog";
    render(
      <TypeEditor
        type="canonical"
        required={true}
        value={canonicalUri}
        onChange={handleChange}
        structureDefinition={null}
        canEdit={true}
        label="instantiatesCanonical"
      />
    );
    expect(
      screen.getByTestId("url-input-field-instantiatesCanonical")
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
        <TypeEditor
          type="instant"
          required={true}
          value="2025-02-04T00:00:00.000+00:00"
          onChange={handleChange}
          structureDefinition={null}
          resource={undefined}
          parentStructureDefinition={undefined}
          canEdit={true}
          label="Observation.issued"
        />
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
    const handleChange = jest.fn();
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
        <TypeEditor
          type="instant"
          required={true}
          value="2025-02-04T00:00:00.000+00:00"
          onChange={handleChange}
          structureDefinition={null}
          resource={undefined}
          parentStructureDefinition={undefined}
          canEdit={true}
          label="Observation.issued"
        />
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
    const handleChange = jest.fn();
    const formik = { ...mockFormik, errors, touched };
    render(
      <FormikProvider value={formik}>
        <TypeEditor
          type="instant"
          required={true}
          value="2025-02-04T00:00:00.000+00:00"
          onChange={handleChange}
          structureDefinition={null}
          resource={undefined}
          parentStructureDefinition={undefined}
          canEdit={true}
          label="Observation.issued"
        />
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
    const handleChange = jest.fn();
    render(
      <FormikProvider value={mockFormik}>
        <TypeEditor
          type={`date`}
          required={false}
          value={`2024-09-26`}
          onChange={handleChange}
          structureDefinition={null}
          label="ClaimResponse.date"
        />
      </FormikProvider>
    );

    const inputDate = screen.getByTestId(
      `date-format-selector-field-ClaimResponse.date`
    );
    expect(inputDate).toBeInTheDocument();
  });

  test("Should render Time component", () => {
    const handleChange = jest.fn();
    render(
      <FormikProvider value={mockFormik}>
        <TypeEditor
          type={`http://hl7.org/fhir/R4/datatypes.html#time`}
          required={false}
          value={`01:23:45`}
          onChange={handleChange}
          structureDefinition={null}
          label="ClaimResponse.time"
        />
      </FormikProvider>
    );
    const inputTime = screen.getByPlaceholderText("hh:mm:ss aa");
    expect(inputTime).toBeInTheDocument();
    expect(inputTime.value).toBe("01:23:45 AM");
  });

  test("Should render PositiveInt component", () => {
    const handleChange = jest.fn();
    render(
      <FormikProvider value={mockFormik}>
        <TypeEditor
          type={`positiveInt`}
          required={false}
          onChange={handleChange}
          structureDefinition={null}
          label={"ClaimResponse.order"}
        />
      </FormikProvider>
    );
    const inputField = screen.getByTestId(
      "integer-field-input-ClaimResponse.order"
    );
    expect(inputField).toBeInTheDocument();
    expect(inputField.value).toBe("1234");
  });

  test("Should render unsignedInt component", () => {
    const handleChange = jest.fn();
    render(
      <FormikProvider value={mockFormik}>
        <TypeEditor
          type={`unsignedInt`}
          required={false}
          onChange={handleChange}
          label={"ClaimResponse.order"}
        />
      </FormikProvider>
    );

    const inputField = screen.getByTestId(
      "integer-field-input-ClaimResponse.order"
    );
    expect(inputField).toBeInTheDocument();
    expect(inputField.value).toBe("1234");
  });

  test("Should render unsignedInt component", () => {
    const handleChange = jest.fn();
    render(
      <FormikProvider value={mockFormik}>
        <TypeEditor
          type={`http://hl7.org/fhirpath/System.Integer`}
          required={false}
          onChange={handleChange}
          label={"ClaimResponse.order"}
        />
      </FormikProvider>
    );

    const inputField = screen.getByTestId(
      "integer-field-input-ClaimResponse.order"
    );
    expect(inputField).toBeInTheDocument();
    expect(inputField.value).toBe("1234");
  });

  test("Should display unsupported", () => {
    const handleChange = jest.fn();
    render(
      <TypeEditor
        type={`test`}
        required={false}
        value={`test`}
        onChange={handleChange}
        structureDefinition={null}
      />
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
      <TypeEditor
        type={`test`}
        required={false}
        value={`test`}
        onChange={handleChange}
        structureDefinition={null}
      />
    );
    expect(
      screen.queryByText(`Unsupported Type [test]`)
    ).not.toBeInTheDocument();
  });
});
