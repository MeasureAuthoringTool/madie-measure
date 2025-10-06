import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik } from "formik";
import { ExecutionContextProvider } from "../../../../../../../routes/qiCore/ExecutionContext";
import QuantityComponent from "./QuantityComponent";
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
    return {
      error: false,
      helperText: "",
    };
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

const quantityStructureDefinition = {
  path: "Observation.quantity",
  type: [{ code: "Quantity" }],
};

const simpleQuantityStructureDefinition = {
  path: "Observation.simpleQuantity",
  type: [
    {
      code: "Quantity",
      profile: ["http://hl7.org/fhir/StructureDefinition/SimpleQuantity"],
    },
  ],
};

const renderWithFormik = (
  label = "Observation.quantity",
  structureDefinition = quantityStructureDefinition,
  canEdit = true
) =>
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
      <Formik
        initialValues={{
          Observation: { quantity: { value: 10, unit: "mg", comparator: ">" } },
        }}
        onSubmit={jest.fn()}
      >
        <QuantityComponent
          label={label}
          canEdit={canEdit}
          structureDefinition={structureDefinition}
          fieldRequired={false}
        />
      </Formik>
    </ExecutionContextProvider>
  );

describe("QuantityComponent", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders initial Formik values for Quantity", async () => {
    renderWithFormik();

    // Comparator CodesComponent
    const comparator = await screen.findByLabelText("Comparator");
    expect(comparator).toBeInTheDocument();
    // assert displayed text includes the expected currency
    expect(comparator).toHaveTextContent("Greater than");

    // Value input
    const valueInput = await screen.findByTestId("decimal-input-field-Value");
    expect(valueInput).toBeInTheDocument();
    expect((valueInput as HTMLInputElement).value).toBe("10");

    // Unit input
    const unitInput = await screen.findByTestId("unit-input-input");
    expect(unitInput).toBeInTheDocument();
    expect((unitInput as HTMLInputElement).value).toBe("mg");
  });

  test("hides comparator field for SimpleQuantity structure definition because SimpleQuantity does not allow a comparator", async () => {
    renderWithFormik("Observation.quantity", simpleQuantityStructureDefinition);
    expect(screen.queryByLabelText("Comparator")).not.toBeInTheDocument();
  });

  test("updates comparator when CodesComponent changes", async () => {
    renderWithFormik();

    const comparatorField = await screen.findByLabelText("Comparator");
    expect(comparatorField).toBeInTheDocument();

    userEvent.click(comparatorField);

    const lessOrEqualOption = await screen.findByText("Less or Equal to");
    userEvent.click(lessOrEqualOption);

    await waitFor(() => {
      expect(comparatorField).toHaveTextContent("Less or Equal to");
    });
  });

  test("updates value when Value changes", async () => {
    renderWithFormik();

    const valueInput = screen.getByTestId(
      "decimal-input-field-Value"
    ) as HTMLInputElement;

    userEvent.clear(valueInput);
    userEvent.type(valueInput, "25");

    await waitFor(() => {
      expect(valueInput.value).toBe("25");
    });
  });

  test("updates unit when Unit input changes", async () => {
    renderWithFormik();

    const unitInput = (await screen.findByTestId(
      "unit-input-input"
    )) as HTMLInputElement;
    expect(unitInput).toBeInTheDocument();

    fireEvent.change(unitInput, { target: { value: "g" } });

    await waitFor(() => {
      expect(unitInput.value).toBe("g");
    });
  });

  test("displays validation error for invalid unit 'z'", async () => {
    renderWithFormik("Observation.quantity", quantityStructureDefinition, true);

    const unitInput = screen.getByTestId("unit-input-input");
    await userEvent.clear(unitInput);
    await userEvent.type(unitInput, "z");

    await waitFor(() => {
      expect(screen.getByTestId("unit-input-helper-text")).toHaveTextContent(
        "z is not a valid UCUM code. No alternatives were found."
      );
    });
  });

  test("does not display validation error for valid unit 'mg'", async () => {
    renderWithFormik("Observation.quantity", quantityStructureDefinition, true);

    const unitInput = screen.getByTestId("unit-input-input");
    await userEvent.clear(unitInput);
    await userEvent.type(unitInput, "mg");

    await waitFor(() => {
      const helperText = screen.queryByTestId("unit-input-helper-text");
      expect(helperText).toBeNull();
    });
  });

  test("all fields are read-only when canEdit is false", async () => {
    renderWithFormik(
      "Observation.quantity",
      quantityStructureDefinition,
      false
    );

    const comparatorField = await screen.findByTestId(
      "code-selector-Comparator"
    );
    expect(comparatorField).toHaveAttribute("readonly");

    const valueInput = (await screen.findByTestId(
      "decimal-field-Value"
    )) as HTMLTextAreaElement;
    expect(valueInput).toHaveAttribute("readonly");

    const unitInput = (await screen.findByTestId(
      "unit-input"
    )) as HTMLTextAreaElement;
    expect(unitInput).toHaveAttribute("readonly");
  });
});
