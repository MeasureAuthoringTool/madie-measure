import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormikProvider, FormikContextType } from "formik";
import { ExecutionContextProvider } from "../../../../../../../routes/qiCore/ExecutionContext";
import IntegerComponent from "./IntegerComponent";
import { IntegerType } from "../typesValidations/FhirNumbers";

let setFieldValueMock: jest.Mock;

const FormikWrapper = ({
  children,
  initialValue,
}: {
  children: React.ReactNode;
  initialValue: number | string | null;
}) => {
  const [values, setValues] = React.useState({
    testUnsigned: initialValue,
  });

  const setFieldValueRef = React.useRef<jest.Mock>();

  if (!setFieldValueRef.current) {
    setFieldValueRef.current = jest.fn((field: string, value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    });
  }

  setFieldValueMock = setFieldValueRef.current;

  const mockFormik: FormikContextType<any> = {
    values,
    setFieldValue: setFieldValueMock,
    handleChange: jest.fn(),
    handleBlur: jest.fn(),
    getFieldProps: jest.fn(),
  } as unknown as FormikContextType<any>;

  return <FormikProvider value={mockFormik}>{children}</FormikProvider>;
};

const renderWithFormik = (initialValue?: number | string | null) =>
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
      <FormikWrapper initialValue={initialValue ?? 42}>
        <IntegerComponent
          label="Test Unsigned"
          name="testUnsigned"
          canEdit
          fieldRequired={false}
          integerType={IntegerType.UNSIGNED}
        />
      </FormikWrapper>
    </ExecutionContextProvider>
  );

describe("IntegerComponent with Formik", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("onChange empty string sets null", async () => {
    renderWithFormik(42);

    const input = screen.getByTestId(
      "integer-field-input-Test Unsigned"
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "" } });

    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenLastCalledWith("testUnsigned", null);
    });
  });

  test("onChange valid number sets numeric value", async () => {
    renderWithFormik(42);

    const input = screen.getByTestId(
      "integer-field-input-Test Unsigned"
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "10" } });

    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenLastCalledWith("testUnsigned", 10);
    });
  });

  test("onChange invalid input stores raw string", async () => {
    renderWithFormik(42);

    const input = screen.getByTestId(
      "integer-field-input-Test Unsigned"
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "abc" } });

    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenLastCalledWith("testUnsigned", "abc");
    });
  });

  test('SIGNED integer allows "-" to be entered', async () => {
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
        <FormikWrapper initialValue={null}>
          <IntegerComponent
            label="Test Signed"
            name="testSigned"
            canEdit
            fieldRequired={false}
            integerType={IntegerType.SIGNED}
          />
        </FormikWrapper>
      </ExecutionContextProvider>
    );

    const input = screen.getByTestId(
      "integer-field-input-Test Signed"
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "-" } });

    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenLastCalledWith("testSigned", "-");
    });
  });
});
