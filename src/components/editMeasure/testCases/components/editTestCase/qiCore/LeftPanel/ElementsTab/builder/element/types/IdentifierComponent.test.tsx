import * as React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { FormikProvider, FormikContextType } from "formik";
import { ExecutionContextProvider } from "../../../../../../../routes/qiCore/ExecutionContext";
import IdentifierComponent from "./IdentifierComponent";
import useFhirDefinitionsServiceApi, {
  FhirDefinitionsServiceApi,
} from "../../../../../../../../api/useFhirDefinitionsService";
import useTerminologyServiceApi, {
  TerminologyServiceApi,
} from "../../../../../../../../api/useTerminologyServiceApi";
import userEvent from "@testing-library/user-event";

jest.mock("../../../../../../../../api/useFhirDefinitionsService");
jest.mock("../../../../../../../../api/useTerminologyServiceApi");

const useFhirDefinitionsServiceApiMock =
  useFhirDefinitionsServiceApi as jest.Mock<FhirDefinitionsServiceApi>;
useFhirDefinitionsServiceApiMock.mockImplementation(
  () =>
    ({
      getValueSetDefinition: jest.fn().mockResolvedValue({
        resourceType: "ValueSet",
        id: "identifier-type",
        expansion: {
          contains: [
            {
              code: "MR",
              display: "Medical Record Number",
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
            },
            {
              code: "SS",
              display: "Social Security Number",
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
            },
          ],
        },
      }),
    } as unknown as FhirDefinitionsServiceApi)
);

const useTerminologyServiceApiMock =
  useTerminologyServiceApi as jest.Mock<TerminologyServiceApi>;
useTerminologyServiceApiMock.mockImplementation(() => ({
  getValueSetsExpansionForOids: jest.fn().mockResolvedValue([]),
}));

// Formik mocks
const setFieldValueMock = jest.fn();
const setFieldTouchedMock = jest.fn();

const mockFormik: FormikContextType<any> = {
  values: {},
  touched: {},
  errors: {},
  setFieldValue: setFieldValueMock,
  setFieldTouched: setFieldTouchedMock,
  getFieldProps: (field) => ({
    value: "",
    name: field,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setFieldValueMock(field, e.target.value);
    },
    onBlur: jest.fn(),
  }),
} as unknown as FormikContextType<any>;

const mockStructureDefinition = {
  id: "MedicationRequest.identifier",
  path: "MedicationRequest.identifier",
  type: [{ code: "Identifier" }],
  min: 0,
  max: "*",
};

describe("IdentifierComponent", () => {
  test("triggers Formik setFieldValue on interactions", async () => {
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
          <IdentifierComponent
            label="MedicationRequest.identifier[0]"
            canEdit={true}
            resource={{}}
            structureDefinition={mockStructureDefinition}
            fieldRequired={false}
          />
        </FormikProvider>
      </ExecutionContextProvider>
    );

    // Use
    const useSelect = await screen.findByLabelText("Use");
    userEvent.click(useSelect);
    const mrOption = await screen.findByText("Medical Record Number");
    userEvent.click(mrOption);

    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.identifier[0].use",
        "MR"
      );
    });

    // Value Set / Direct Reference Code
    const valueSetSelect = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    userEvent.click(valueSetSelect);
    expect(screen.getAllByRole("option")).toHaveLength(2);

    expect(screen.getAllByRole("option")[0]).toHaveTextContent("Custom Code");

    // select custom code option
    userEvent.click(screen.getAllByRole("option")[0]);
    const codeSystem = screen.getByRole("textbox", {
      name: "Custom Code System",
    });

    expect(codeSystem).toBeInTheDocument();
    userEvent.type(codeSystem, "http://example.com/custom-system");

    const code = screen.getByRole("textbox", {
      name: "Custom Code",
    });
    expect(code).toBeInTheDocument();
    userEvent.type(code, "C1");

    expect(setFieldValueMock).toHaveBeenCalledWith(
      "MedicationRequest.identifier[0].type.coding[0]",
      {
        code: "C1",
        display: "C1",
        system: "http://example.com/custom-system",
      }
    );

    // System
    const systemInput = await screen.findByLabelText("System");
    fireEvent.change(systemInput, { target: { value: "urn:oid:1.2.3.4" } });

    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.identifier[0].system",
        "urn:oid:1.2.3.4"
      );
    });

    // Value
    const valueInput = await screen.findByLabelText("Value");
    fireEvent.change(valueInput, { target: { value: "12345" } });

    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.identifier[0].value",
        "12345"
      );
    });

    // Period
    const formatSelector = await screen.findByTestId(
      "date-time-format-selector-input-field-Period"
    );

    // Set the format (e.g., DATE_TIME_ZONE_FORMAT)
    fireEvent.change(formatSelector, { target: { value: "YYYY" } });

    const startInput = screen.getByTestId(`start-YYYY-field-Period-input`);
    const endInput = screen.getByTestId(`end-YYYY-field-Period-input`);

    // Type start and end dates using userEvent.type to simulate real user input
    await userEvent.type(startInput, "2020");
    await userEvent.type(endInput, "2025");

    // Assert Formik setFieldValue called with the period object
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenLastCalledWith(
        "MedicationRequest.identifier[0].period",
        { start: "2020", end: "2025" }
      );
    });

    //
    expect(await screen.findByLabelText("Assigner")).toBeInTheDocument();
  });
});
