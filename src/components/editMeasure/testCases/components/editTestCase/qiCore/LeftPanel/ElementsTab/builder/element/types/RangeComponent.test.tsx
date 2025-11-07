import * as React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik } from "formik";
import { ExecutionContextProvider } from "../../../../../../../routes/qiCore/ExecutionContext";
import RangeComponent from "./RangeComponent";
import useFhirDefinitionsServiceApi, {
  FhirDefinitionsServiceApi,
} from "../../../../../../../../api/useFhirDefinitionsService";
import useTerminologyServiceApi, {
  TerminologyServiceApi,
} from "../../../../../../../../api/useTerminologyServiceApi";

jest.mock("../../../../../../../../api/useFhirDefinitionsService");
jest.mock("../../../../../../../../api/useTerminologyServiceApi");

jest.mock("../../../../../../../common/quantityInput/validate", () => ({
  validate: (unitValue: string) => {
    if (unitValue === "z") {
      return {
        error: true,
        helperText: "z is not a valid UCUM code. No alternatives were found.",
      };
    }
    return { error: false, helperText: "" };
  },
  ValidationResult: class {
    label?: string;
    helperText?: string;
    error = false;
  },
  ADDITIONAL_UCUM_UNIT_SUPPORT: {},
}));

const useFhirDefinitionsServiceApiMock =
  useFhirDefinitionsServiceApi as jest.Mock<FhirDefinitionsServiceApi>;

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

const useTerminologyServiceApiMock =
  useTerminologyServiceApi as jest.Mock<TerminologyServiceApi>;

useTerminologyServiceApiMock.mockImplementation(() => ({
  getValueSetsExpansionForOids: jest.fn().mockResolvedValue([]),
}));

const rangeStructureDefinition = {
  path: "Observation.range",
  type: [{ code: "Range" }],
};

const renderWithFormik = ({
  label = "Observation.range",
  structureDefinition = rangeStructureDefinition,
  canEdit = true,
  initialValues = {
    Observation: {
      range: {
        low: { value: 1, code: "cm" },
        high: { value: 5, code: "cm" },
      },
    },
  },
} = {}) =>
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
      <Formik initialValues={initialValues} onSubmit={jest.fn()}>
        <RangeComponent
          label={label}
          canEdit={canEdit}
          structureDefinition={structureDefinition}
          fieldRequired={false}
        />
      </Formik>
    </ExecutionContextProvider>
  );

describe("RangeComponent", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders low and high QuantityComponent fields with initial values", async () => {
    renderWithFormik();

    const lowContainer = screen.getByText("Low").closest(".quantity-fields")!;
    const inputLow = within(lowContainer).getByTestId(
      "decimal-input-field-Low"
    ) as HTMLInputElement;
    const codeLow = within(lowContainer).getByTestId(
      "code-input-input"
    ) as HTMLInputElement;

    expect(inputLow.value).toBe("1");
    expect(codeLow.value).toBe("cm");

    const highContainer = screen.getByText("High").closest(".quantity-fields")!;
    const inputHigh = within(highContainer).getByTestId(
      "decimal-input-field-High"
    ) as HTMLInputElement;
    const codeHigh = within(highContainer).getByTestId(
      "code-input-input"
    ) as HTMLInputElement;

    expect(inputHigh.value).toBe("5");
    expect(codeHigh.value).toBe("cm");

    // Comparator should not be rendered for RangeComponent
    expect(screen.queryByText("Comparator")).not.toBeInTheDocument();
  });

  test("updates low and high values correctly", async () => {
    renderWithFormik();

    const lowContainer = screen.getByText("Low").closest(".quantity-fields")!;
    const inputLow = within(lowContainer).getByTestId(
      "decimal-input-field-Low"
    ) as HTMLInputElement;

    const highContainer = screen.getByText("High").closest(".quantity-fields")!;
    const inputHigh = within(highContainer).getByTestId(
      "decimal-input-field-High"
    ) as HTMLInputElement;

    fireEvent.change(inputLow, { target: { value: "10" } });
    fireEvent.change(inputHigh, { target: { value: "20" } });

    await waitFor(() => {
      expect(inputLow.value).toBe("10");
      expect(inputHigh.value).toBe("20");
    });
  });

  test("updates low and high units correctly", async () => {
    renderWithFormik();

    const lowContainer = screen.getByText("Low").closest(".quantity-fields")!;
    const codeLow = within(lowContainer).getByTestId(
      "code-input-input"
    ) as HTMLInputElement;

    const highContainer = screen.getByText("High").closest(".quantity-fields")!;
    const codeHigh = within(highContainer).getByTestId(
      "code-input-input"
    ) as HTMLInputElement;

    fireEvent.change(codeLow, { target: { value: "m" } });
    fireEvent.change(codeHigh, { target: { value: "m" } });

    await waitFor(() => {
      expect(codeLow.value).toBe("m");
      expect(codeHigh.value).toBe("m");
    });
  });

  test("all fields are read-only when canEdit is false", async () => {
    renderWithFormik({ canEdit: false });

    const lowContainer = screen
      .getByTestId("decimal-field-Low")
      .closest(".quantity-component")!;
    const inputLow = within(lowContainer).getByTestId(
      "decimal-field-Low"
    ) as HTMLTextAreaElement;
    const codeLow = within(lowContainer).getByTestId(
      "code-input"
    ) as HTMLTextAreaElement;

    const highContainer = screen
      .getByTestId("decimal-field-High")
      .closest(".quantity-component")!;
    const inputHigh = within(highContainer).getByTestId(
      "decimal-field-High"
    ) as HTMLTextAreaElement;
    const codeHigh = within(highContainer).getByTestId(
      "code-input"
    ) as HTMLTextAreaElement;

    expect(inputLow).toHaveAttribute("readonly");
    expect(codeLow).toHaveAttribute("readonly");
    expect(inputHigh).toHaveAttribute("readonly");
    expect(codeHigh).toHaveAttribute("readonly");
  });
});
