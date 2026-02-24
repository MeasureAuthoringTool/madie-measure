import * as React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { Formik } from "formik";
import { ExecutionContextProvider } from "../../../../../../../routes/qiCore/ExecutionContext";
import RatioComponent from "./RatioComponent";
import useTerminologyServiceApi, {
  TerminologyServiceApi,
} from "../../../../../../../../api/useTerminologyServiceApi";

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

const useTerminologyServiceApiMock =
  useTerminologyServiceApi as jest.Mock<TerminologyServiceApi>;

useTerminologyServiceApiMock.mockImplementation(() => ({
  getValueSetsExpansionForOids: jest.fn().mockResolvedValue([]),
}));

const ratioStructureDefinition = {
  path: "Observation.value[x]",
  type: [{ code: "Ratio" }],
};

const renderWithFormik = ({
  label = "Observation.valueRatio",
  structureDefinition = ratioStructureDefinition,
  canEdit = true,
  initialValues = {
    Observation: {
      valueRatio: {
        numerator: { value: 1, code: "mg" },
        denominator: { value: 10, code: "mL" },
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
        <RatioComponent
          label={label}
          canEdit={canEdit}
          structureDefinition={structureDefinition}
          fieldRequired={false}
        />
      </Formik>
    </ExecutionContextProvider>
  );

describe("RatioComponent", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders numerator and denominator QuantityComponent fields with initial values", async () => {
    renderWithFormik();

    const numeratorContainer = screen
      .getByText("Numerator")
      .closest(".quantity-fields")!;
    const inputNumerator = within(numeratorContainer).getByTestId(
      "decimal-field-input-Observation.valueRatio.numerator.value"
    ) as HTMLInputElement;
    const codeNumerator = within(numeratorContainer).getByTestId(
      "code-input-input"
    ) as HTMLInputElement;

    expect(inputNumerator.value).toBe("1");
    expect(codeNumerator.value).toBe("mg");

    const denominatorContainer = screen
      .getByText("Denominator")
      .closest(".quantity-fields")!;
    const inputDenominator = within(denominatorContainer).getByTestId(
      "decimal-field-input-Observation.valueRatio.denominator.value"
    ) as HTMLInputElement;
    const codeDenominator = within(denominatorContainer).getByTestId(
      "code-input-input"
    ) as HTMLInputElement;

    expect(inputDenominator.value).toBe("10");
    expect(codeDenominator.value).toBe("mL");

    // Comparator should not be rendered for RatioComponent
    expect(screen.queryByText("Comparator")).not.toBeInTheDocument();
  });

  test("updates numerator and denominator values correctly", async () => {
    renderWithFormik();

    const numeratorContainer = screen
      .getByText("Numerator")
      .closest(".quantity-fields")!;
    const inputNumerator = within(numeratorContainer).getByTestId(
      "decimal-field-input-Observation.valueRatio.numerator.value"
    ) as HTMLInputElement;

    const denominatorContainer = screen
      .getByText("Denominator")
      .closest(".quantity-fields")!;
    const inputDenominator = within(denominatorContainer).getByTestId(
      "decimal-field-input-Observation.valueRatio.denominator.value"
    ) as HTMLInputElement;

    fireEvent.change(inputNumerator, { target: { value: "5" } });
    fireEvent.change(inputDenominator, { target: { value: "100" } });

    await waitFor(() => {
      expect(inputNumerator.value).toBe("5");
      expect(inputDenominator.value).toBe("100");
    });
  });

  test("updates numerator and denominator units correctly", async () => {
    renderWithFormik();

    const numeratorContainer = screen
      .getByText("Numerator")
      .closest(".quantity-fields")!;
    const codeNumerator = within(numeratorContainer).getByTestId(
      "code-input-input"
    ) as HTMLInputElement;

    const denominatorContainer = screen
      .getByText("Denominator")
      .closest(".quantity-fields")!;
    const codeDenominator = within(denominatorContainer).getByTestId(
      "code-input-input"
    ) as HTMLInputElement;

    fireEvent.change(codeNumerator, { target: { value: "g" } });
    fireEvent.change(codeDenominator, { target: { value: "L" } });

    await waitFor(() => {
      expect(codeNumerator.value).toBe("g");
      expect(codeDenominator.value).toBe("L");
    });
  });

  test("all fields are read-only when canEdit is false", async () => {
    renderWithFormik({ canEdit: false });

    const numeratorContainer = screen
      .getByText("Numerator")
      .closest(".quantity-fields")!;
    const denominatorContainer = screen
      .getByText("Denominator")
      .closest(".quantity-fields")!;

    const inputNumerator = screen.getByTestId(
      "decimal-field-Observation.valueRatio.numerator.value"
    ) as HTMLInputElement;
    const codeNumerator = within(numeratorContainer).getByTestId(
      "code-input-Observation.valueRatio.numerator"
    ) as HTMLTextAreaElement;

    const inputDenominator = within(denominatorContainer).getByTestId(
      "decimal-field-Observation.valueRatio.denominator.value"
    ) as HTMLTextAreaElement;
    const codeDenominator = within(denominatorContainer).getByTestId(
      "code-input-Observation.valueRatio.denominator"
    ) as HTMLTextAreaElement;

    expect(inputNumerator).toHaveAttribute("readonly");
    expect(codeNumerator).toHaveAttribute("readonly");
    expect(inputDenominator).toHaveAttribute("readonly");
    expect(codeDenominator).toHaveAttribute("readonly");
  });
});
