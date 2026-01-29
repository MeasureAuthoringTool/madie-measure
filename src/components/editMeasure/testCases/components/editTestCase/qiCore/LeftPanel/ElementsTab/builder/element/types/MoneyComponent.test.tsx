import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormikContextType, Formik } from "formik";
import { ExecutionContextProvider } from "../../../../../../../routes/qiCore/ExecutionContext";
import MoneyComponent from "./MoneyComponent";
import useFhirDefinitionsServiceApi, {
  FhirDefinitionsServiceApi,
} from "../../../../../../../../api/useFhirDefinitionsService";
import useTerminologyServiceApi, {
  TerminologyServiceApi,
} from "../../../../../../../../api/useTerminologyServiceApi";

jest.mock("../../../../../../../../api/useFhirDefinitionsService");
jest.mock("../../../../../../../../api/useTerminologyServiceApi");

const useFhirDefinitionsServiceApiMock =
  useFhirDefinitionsServiceApi as jest.Mock<FhirDefinitionsServiceApi>;

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

const useTerminologyServiceApiMock =
  useTerminologyServiceApi as jest.Mock<TerminologyServiceApi>;

useTerminologyServiceApiMock.mockImplementation(() => ({
  getValueSetsExpansionForOids: jest.fn().mockResolvedValue([]),
}));

const mockFormik: FormikContextType<any> = {
  values: {
    Claim: { total: { value: 100, currency: "USD" } },
  },
  setFieldValue: jest.fn(),
  setFieldTouched: jest.fn(),
  getFieldProps: () => ({ value: "", onChange: jest.fn(), onBlur: jest.fn() }),
} as unknown as FormikContextType<any>;

const renderWithFormik = () =>
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
      <Formik initialValues={mockFormik.values} onSubmit={jest.fn()}>
        <MoneyComponent
          label="Claim.total"
          canEdit={true}
          resource={{}}
          fieldRequired={false}
        />
      </Formik>
    </ExecutionContextProvider>
  );

describe("MoneyComponent", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders initial Formik values", async () => {
    renderWithFormik();

    // decimal input
    const valueInput = (await screen.findByTestId(
      "decimal-field-input-Claim.total.value"
    )) as HTMLInputElement;
    expect(valueInput).toBeInTheDocument();
    expect(valueInput.value).toBe("100");

    // currency select display
    const currencySelect = await screen.findByLabelText("Currency");
    expect(currencySelect).toBeInTheDocument();

    // assert displayed text includes the expected currency
    expect(currencySelect).toHaveTextContent("United States dollar");
  });

  test("updates currency when CodesComponent changes", async () => {
    renderWithFormik();

    const currencySelect = await screen.findByLabelText("Currency");
    userEvent.click(currencySelect);

    const cadOption = await screen.findByText("Canadian dollar");
    userEvent.click(cadOption);

    await waitFor(() => {
      // assert displayed text updated
      expect(currencySelect).toHaveTextContent("Canadian dollar");
    });
  });

  test("updates value when DecimalInput changes", async () => {
    renderWithFormik();

    const valueInput = screen.getByTestId(
      "decimal-field-input-Claim.total.value"
    ) as HTMLInputElement;

    userEvent.clear(valueInput);
    userEvent.type(valueInput, "250");

    await waitFor(() => {
      expect(valueInput.value).toBe("250");
    });
  });
});
