import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ElementDefinition, ValueSet } from "fhir/r4";
import userEvent from "@testing-library/user-event";
import { ExecutionContextProvider } from "../../../../../../../routes/qiCore/ExecutionContext";
import axios from "../../../../../../../../../../../api/axios-instance";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../../../../../../api/ServiceContext";
import CodeableConceptComponent from "./CodeableConceptComponent";
import { FormikProvider, FormikContextType } from "formik";

jest.mock("../../../../../../../../../../../api/axios-instance");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockSetFieldValue = jest.fn();
const mockSetFieldTouched = jest.fn();

const mockConfig = {
  fhirService: {
    baseUrl: "fhirService.com",
  },
} as unknown as ServiceConfig;

const mockBindingValueSet = {
  resourceType: "ValueSet",
  name: "Binding ValueSet",
  title: "Binding ValueSet",
  url: "http://example.com/v1",
  expansion: {
    contains: [
      {
        system: "http://example.com/system1",
        code: "B1",
        display: "B1 Code",
      },
      {
        system: "http://example.com/system2",
        code: "B2",
        display: "B2 Code",
      },
    ],
  },
} as ValueSet;

const mockStructureDefinition = {
  binding: {
    strength: "required",
    valueSet: "http://example.com/ValueSet/123",
  },
} as ElementDefinition;

/**
 * Creates a mock Formik context with the given values
 */
const createMockFormik = (values: any): FormikContextType<any> =>
  ({
    values,
    initialValues: values,
    touched: {},
    errors: {},
    setFieldValue: mockSetFieldValue,
    setFieldTouched: mockSetFieldTouched,
    getFieldProps: jest.fn(),
    dirty: false,
    isValid: true,
  } as unknown as FormikContextType<any>);

describe("CodeableConceptComponent Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("render and update codeable concept", async () => {
    const value = {
      coding: [
        {
          ...mockBindingValueSet.expansion?.contains[0],
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/valueset-reference",
              valueUri: mockBindingValueSet.url,
            },
          ],
        },
      ],
    };

    const mockFormik = createMockFormik({ "test-label": value });

    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });

    render(
      <ApiContextProvider value={mockConfig}>
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
            <CodeableConceptComponent
              canEdit={true}
              structureDefinition={mockStructureDefinition}
              label="test-label"
              value={value}
              addTitle={"Codeable"}
            />
          </FormikProvider>
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    expect(screen.getByText("Add Coding")).toBeInTheDocument();

    // verify value set
    const valueSetSelect = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    await waitFor(() => {
      expect(valueSetSelect).toHaveTextContent(mockBindingValueSet.title);
    });

    // verify code system
    const codeSystemSelect = screen.getByRole("combobox", {
      name: "Code System",
    });
    await waitFor(() => {
      expect(codeSystemSelect).toHaveTextContent(
        mockBindingValueSet.expansion?.contains[0].system
      );
    });

    // verify code
    const codeSelect = screen.getByRole("combobox", {
      name: "Code",
    });
    expect(codeSelect).toHaveTextContent(
      mockBindingValueSet.expansion?.contains[0].code
    );

    // select new code system
    userEvent.click(codeSystemSelect);
    const codeSystemOptions = screen.getAllByRole("option");
    expect(codeSystemOptions).toHaveLength(2);
    userEvent.click(codeSystemOptions[1]);
    await waitFor(() => {
      expect(codeSystemSelect).toHaveTextContent(
        mockBindingValueSet.expansion?.contains[1].system
      );
    });

    // select code
    userEvent.click(codeSelect);
    const codeOptions = screen.getAllByRole("option");
    userEvent.click(codeOptions[0]);

    // Verify Formik setFieldValue was called with the coding path (not the whole CodeableConcept)
    await waitFor(() => {
      expect(mockSetFieldValue).toHaveBeenCalledWith("test-label.coding[0]", {
        code: mockBindingValueSet.expansion?.contains[1].code,
        system: mockBindingValueSet.expansion?.contains[1].system,
        display: mockBindingValueSet.expansion?.contains[1].display,
        extension: [
          {
            url: "http://hl7.org/fhir/StructureDefinition/valueset-reference",
            valueUri: mockBindingValueSet.url,
          },
        ],
      });
    });
  });

  it("adds a new coding element when add button is clicked", async () => {
    const value = {
      coding: [
        {
          code: "B1",
          system: "http://example.com/system1",
          display: "B1 Code",
        },
      ],
    };

    const mockFormik = createMockFormik({ "test-label": value });

    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });

    render(
      <ApiContextProvider value={mockConfig}>
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
            <CodeableConceptComponent
              canEdit={true}
              structureDefinition={mockStructureDefinition}
              label="test-label"
              value={value}
              addTitle={"Codeable"}
            />
          </FormikProvider>
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    const addButton = screen.getByText("Add Coding");
    userEvent.click(addButton);

    await waitFor(() => {
      expect(mockSetFieldValue).toHaveBeenCalledWith("test-label", {
        coding: [
          {
            code: "B1",
            system: "http://example.com/system1",
            display: "B1 Code",
          },
          undefined,
        ],
      });
    });
  });

  it("deletes a coding element when delete button is clicked", async () => {
    const value = {
      coding: [
        {
          code: "B1",
          system: "http://example.com/system1",
          display: "B1 Code",
        },
        {
          code: "B2",
          system: "http://example.com/system2",
          display: "B2 Code",
        },
      ],
    };

    const mockFormik = createMockFormik({ "test-label": value });

    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });

    render(
      <ApiContextProvider value={mockConfig}>
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
            <CodeableConceptComponent
              canEdit={true}
              structureDefinition={mockStructureDefinition}
              label="test-label"
              value={value}
              addTitle={"Codeable"}
            />
          </FormikProvider>
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    // Find and click the delete button for the first coding
    const deleteButton0 = screen.getByTestId(
      "delete-button-test-label.coding[0]"
    );
    const deleteButton1 = screen.getByTestId(
      "delete-button-test-label.coding[1]"
    );

    expect(deleteButton0).toBeInTheDocument();
    expect(deleteButton1).toBeInTheDocument();

    userEvent.click(deleteButton0);

    await waitFor(() => {
      expect(mockSetFieldValue).toHaveBeenCalledWith("test-label", {
        coding: [
          {
            code: "B2",
            system: "http://example.com/system2",
            display: "B2 Code",
          },
        ],
      });
    });
  });

  it("clears value when deleting the last coding element", async () => {
    const value = {
      coding: [
        {
          code: "B1",
          system: "http://example.com/system1",
          display: "B1 Code",
        },
      ],
    };

    const mockFormik = createMockFormik({ "test-label": value });

    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });

    render(
      <ApiContextProvider value={mockConfig}>
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
            <CodeableConceptComponent
              canEdit={true}
              structureDefinition={mockStructureDefinition}
              label="test-label"
              value={value}
              addTitle={"Codeable"}
            />
          </FormikProvider>
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    // Find and click the delete button for the only coding element
    const deleteButton = screen.getByTestId(
      "delete-button-test-label.coding[0]"
    );
    expect(deleteButton).toBeInTheDocument();

    userEvent.click(deleteButton);

    // Should clear the value of the last element to an empty object so the fields remain visible
    await waitFor(() => {
      expect(mockSetFieldValue).toHaveBeenCalledWith(
        "test-label.coding[0]",
        {}
      );
    });
  });

  it("calls onChangeForExtension with full CodeableConcept when in extension context", async () => {
    const value = {
      coding: [
        {
          ...mockBindingValueSet.expansion?.contains[0],
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/valueset-reference",
              valueUri: mockBindingValueSet.url,
            },
          ],
        },
      ],
    };

    const mockFormik = createMockFormik({
      "Patient.extension[0].valueCodeableConcept": value,
    });
    const onChangeForExtension = jest.fn();

    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });

    render(
      <ApiContextProvider value={mockConfig}>
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
            <CodeableConceptComponent
              canEdit={true}
              structureDefinition={mockStructureDefinition}
              label="Patient.extension[0].valueCodeableConcept"
              value={value}
              addTitle={"Codeable"}
              onChangeForExtension={onChangeForExtension}
            />
          </FormikProvider>
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    // Wait for value set to load
    const valueSetSelect = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    await waitFor(() => {
      expect(valueSetSelect).toHaveTextContent(mockBindingValueSet.title);
    });

    // Select a different code system
    const codeSystemSelect = screen.getByRole("combobox", {
      name: "Code System",
    });
    await userEvent.click(codeSystemSelect);
    const codeSystemOptions = screen.getAllByRole("option");
    await userEvent.click(codeSystemOptions[1]);

    await waitFor(() => {
      expect(codeSystemSelect).toHaveTextContent(
        mockBindingValueSet.expansion?.contains[1].system
      );
    });

    // Select a code
    const codeSelect = screen.getByRole("combobox", {
      name: "Code",
    });
    await userEvent.click(codeSelect);
    const codeOptions = screen.getAllByRole("option");
    await userEvent.click(codeOptions[0]);

    // Verify onChangeForExtension was called with the full CodeableConcept
    await waitFor(() => {
      expect(onChangeForExtension).toHaveBeenCalledWith({
        coding: [
          {
            code: mockBindingValueSet.expansion?.contains[1].code,
            system: mockBindingValueSet.expansion?.contains[1].system,
            display: mockBindingValueSet.expansion?.contains[1].display,
            extension: [
              {
                url: "http://hl7.org/fhir/StructureDefinition/valueset-reference",
                valueUri: mockBindingValueSet.url,
              },
            ],
          },
        ],
      });
    });

    // Verify formik.setFieldValue was NOT called (extension context should use onChangeForExtension instead)
    expect(mockSetFieldValue).not.toHaveBeenCalled();
  });
});
