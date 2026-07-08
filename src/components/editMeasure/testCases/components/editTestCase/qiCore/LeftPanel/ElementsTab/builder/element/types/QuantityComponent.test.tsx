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

const renderWithFormik = ({
  label = "Observation.quantity",
  showComparator = true,
  canEdit = true,
  initialValues = {
    Observation: { quantity: { value: 10, code: "mg", comparator: ">" } },
  },
  showAddAttributeButton = false,
  addTitle = "",
  handleAddElement = jest.fn(),
  showDeleteButton = false,
  handleDeleteElement = jest.fn(),
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
        <QuantityComponent
          label={label}
          canEdit={canEdit}
          showComparator={showComparator}
          fieldRequired={false}
          showAddAttributeButton={showAddAttributeButton}
          addTitle={addTitle}
          handleAddElement={handleAddElement}
          showDeleteButton={showDeleteButton}
          handleDeleteElement={handleDeleteElement}
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
    const valueInput = await screen.findByTestId(
      "decimal-field-input-Observation.quantity.value"
    );
    expect(valueInput).toBeInTheDocument();
    expect((valueInput as HTMLInputElement).value).toBe("10");

    // Code input
    const codeInput = await screen.findByTestId("code-input-input");
    expect(codeInput).toBeInTheDocument();
    expect((codeInput as HTMLInputElement).value).toBe("mg");
  });

  test("hides comparator field when showComparator is false", async () => {
    renderWithFormik({
      label: "Observation.quantity",
      showComparator: false,
    });
    expect(screen.queryByLabelText("Comparator")).not.toBeInTheDocument();
  });

  test("updates comparator when CodesComponent changes", async () => {
    renderWithFormik();

    const comparatorField = await screen.findByLabelText("Comparator");
    const comparatorSelectInput = screen.getByTestId(
      "code-selector-input-Comparator"
    );

    expect(comparatorField).toBeInTheDocument();
    expect(comparatorSelectInput).toHaveValue(">");

    userEvent.click(comparatorField);
    const lessOrEqualOption = await screen.findByText("Less or Equal to");
    userEvent.click(lessOrEqualOption);

    await waitFor(() => {
      expect(comparatorSelectInput).toHaveValue("<=");
    });
  });

  test("sets comparator when field object is initially empty", async () => {
    renderWithFormik({ initialValues: { Observation: {} } });

    const comparatorField = await screen.findByLabelText("Comparator");
    const comparatorSelectInput = screen.getByTestId(
      "code-selector-input-Comparator"
    );

    expect(comparatorSelectInput).toHaveValue("");

    userEvent.click(comparatorField);
    const greaterThanOption = await screen.findByText("Greater than");
    userEvent.click(greaterThanOption);

    await waitFor(() => {
      expect(comparatorSelectInput).toHaveValue(">");
    });
  });

  test("sets value when field object is initially empty", async () => {
    renderWithFormik({ initialValues: { Observation: {} } });

    const valueInput = await screen.findByTestId(
      "decimal-field-input-Observation.quantity.value"
    );

    expect(valueInput.value).toBe("");
    userEvent.clear(valueInput);
    userEvent.type(valueInput, "42");

    await waitFor(() => {
      expect(valueInput.value).toBe("42");
    });
  });

  test("sets code when field object is initially empty", async () => {
    renderWithFormik({ initialValues: { Observation: {} } });

    const codeInput = (await screen.findByTestId(
      "code-input-input"
    )) as HTMLInputElement;
    expect(codeInput.value).toBe("");
    fireEvent.change(codeInput, { target: { value: "kg" } });

    await waitFor(() => {
      expect(codeInput.value).toBe("kg");
    });
  });

  test("updates value when Value changes", async () => {
    renderWithFormik();

    const valueInput = await screen.findByTestId(
      "decimal-field-input-Observation.quantity.value"
    );

    userEvent.clear(valueInput);
    userEvent.type(valueInput, "25");

    await waitFor(() => {
      expect(valueInput.value).toBe("25");
    });
  });

  test("updates code when code input changes", async () => {
    renderWithFormik();

    const codeInput = (await screen.findByTestId(
      "code-input-input"
    )) as HTMLInputElement;
    expect(codeInput).toBeInTheDocument();

    fireEvent.change(codeInput, { target: { value: "g" } });

    await waitFor(() => {
      expect(codeInput.value).toBe("g");
    });
  });

  test("displays validation error for invalid code 'z'", async () => {
    renderWithFormik({
      label: "Observation.quantity",
      showComparator: true,
      canEdit: true,
    });

    const codeInput = screen.getByTestId("code-input-input");
    await userEvent.clear(codeInput);
    await userEvent.type(codeInput, "z");

    await waitFor(() => {
      expect(screen.getByTestId("code-input-helper-text")).toHaveTextContent(
        "z is not a valid UCUM code. No alternatives were found."
      );
    });
  });

  test("does not display validation error for valid code 'mg'", async () => {
    renderWithFormik({
      label: "Observation.quantity",
      showComparator: true,
      canEdit: true,
    });

    const codeInput = screen.getByTestId("code-input-input");
    await userEvent.clear(codeInput);
    await userEvent.type(codeInput, "mg");

    await waitFor(() => {
      const helperText = screen.queryByTestId("code-input-helper-text");
      expect(helperText).toBeNull();
    });
  });

  test("updates code, unit, and system for UCUM code", async () => {
    let formikValues: any;
    const initialValues = {
      Observation: {
        quantity: { value: 10, code: "", comparator: "" },
      },
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
        <Formik initialValues={initialValues} onSubmit={jest.fn()}>
          {(formik) => {
            formikValues = formik.values;
            return (
              <QuantityComponent
                label="Observation.quantity"
                canEdit={true}
                showComparator={true}
              />
            );
          }}
        </Formik>
      </ExecutionContextProvider>
    );

    const codeInput = (await screen.findByTestId(
      "code-input-input"
    )) as HTMLInputElement;

    fireEvent.change(codeInput, { target: { value: "mg" } });

    await waitFor(() => {
      expect(codeInput.value).toBe("mg");

      const updatedQuantity = formikValues.Observation.quantity;
      expect(updatedQuantity.code).toBe("mg");
      expect(updatedQuantity.unit).toBe("milligram");
      expect(updatedQuantity.system).toBe("http://unitsofmeasure.org");
    });
  });

  test("removes unit and system for invalid UCUM code", async () => {
    let formikValues: any;

    const initialValues = {
      Observation: {
        quantity: {
          value: 10,
          code: "mg",
          unit: "milligram",
          system: "http://unitsofmeasure.org",
          comparator: ">",
        },
      },
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
        <Formik initialValues={initialValues} onSubmit={jest.fn()}>
          {(formik) => {
            formikValues = formik.values;
            return (
              <QuantityComponent
                label="Observation.quantity"
                canEdit={true}
                showComparator={true}
              />
            );
          }}
        </Formik>
      </ExecutionContextProvider>
    );

    const codeInput = (await screen.findByTestId(
      "code-input-input"
    )) as HTMLInputElement;

    // invalid code
    fireEvent.change(codeInput, { target: { value: "z" } });

    await waitFor(() => {
      const updatedQuantity = formikValues.Observation.quantity;
      expect(updatedQuantity.code).toBe("z"); // code is still set
      expect(updatedQuantity.unit).toBeUndefined(); // unit removed
      expect(updatedQuantity.system).toBeUndefined(); // system removed
    });
  });

  test("sets unit to code input when ucumUnitCode is 1 (bracketed code)", async () => {
    let formikValues: any;
    const initialValues = {
      Observation: {
        quantity: {
          value: 10,
          code: "mg",
          unit: "milligram",
          system: "http://unitsofmeasure.org",
          comparator: ">",
        },
      },
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
        <Formik initialValues={initialValues} onSubmit={jest.fn()}>
          {(formik) => {
            formikValues = formik.values;
            return (
              <QuantityComponent
                label="Observation.quantity"
                canEdit={true}
                showComparator={true}
              />
            );
          }}
        </Formik>
      </ExecutionContextProvider>
    );

    const codeInput = (await screen.findByTestId(
      "code-input-input"
    )) as HTMLInputElement;

    fireEvent.change(codeInput, { target: { value: "{bracketedCode}" } });

    await waitFor(() => {
      const updatedQuantity = formikValues.Observation.quantity;
      expect(updatedQuantity.code).toBe("{bracketedCode}");
      expect(updatedQuantity.unit).toBe("{bracketedCode}"); // unit is set to code
      expect(updatedQuantity.system).toBe("http://unitsofmeasure.org");
    });
  });

  test("clearing code removes unit and system", async () => {
    let formikValues: any;
    const initialValues = {
      Observation: {
        quantity: {
          value: 10,
          code: "mg",
          unit: "milligram",
          system: "http://unitsofmeasure.org",
          comparator: ">",
        },
      },
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
        <Formik initialValues={initialValues} onSubmit={jest.fn()}>
          {(formik) => {
            formikValues = formik.values;
            return (
              <QuantityComponent
                label="Observation.quantity"
                canEdit={true}
                showComparator={true}
              />
            );
          }}
        </Formik>
      </ExecutionContextProvider>
    );

    const codeInput = (await screen.findByTestId(
      "code-input-input"
    )) as HTMLInputElement;

    fireEvent.change(codeInput, { target: { value: "" } });

    await waitFor(() => {
      const updatedQuantity = formikValues.Observation.quantity;
      expect(updatedQuantity.code).toBeUndefined();
      expect(updatedQuantity.unit).toBeUndefined();
      expect(updatedQuantity.system).toBeUndefined();
    });
  });

  test("maps QI-Core timing display value 'days' to UCUM code 'd' preserving display value as unit", async () => {
    let formikValues: any;
    const initialValues = {
      Observation: {
        quantity: { value: 1, code: "", comparator: "" },
      },
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
        <Formik initialValues={initialValues} onSubmit={jest.fn()}>
          {(formik) => {
            formikValues = formik.values;
            return (
              <QuantityComponent
                label="Observation.quantity"
                canEdit={true}
                showComparator={true}
                fieldRequired={false}
              />
            );
          }}
        </Formik>
      </ExecutionContextProvider>
    );

    const codeInput = (await screen.findByTestId(
      "code-input-input"
    )) as HTMLInputElement;

    fireEvent.change(codeInput, { target: { value: "days" } });

    await waitFor(() => {
      const updatedQuantity = formikValues.Observation.quantity;
      expect(updatedQuantity.code).toBe("d");
      expect(updatedQuantity.unit).toBe("days");
      expect(updatedQuantity.system).toBe("http://unitsofmeasure.org");
      expect(updatedQuantity.value).toBe(1);
    });
  });

  test.each([
    ["years", "a"],
    ["year", "a"],
    ["months", "mo"],
    ["month", "mo"],
    ["weeks", "wk"],
    ["week", "wk"],
    ["days", "d"],
    ["day", "d"],
    ["hours", "h"],
    ["hour", "h"],
    ["minutes", "min"],
    ["minute", "min"],
    ["seconds", "s"],
    ["second", "s"],
    ["milliseconds", "ms"],
    ["millisecond", "ms"],
  ])(
    "maps QI-Core timing display value '%s' to UCUM code '%s'",
    async (display, expectedCode) => {
      let formikValues: any;
      const initialValues = {
        Observation: {
          quantity: { value: 2, code: "", comparator: "" },
        },
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
          <Formik initialValues={initialValues} onSubmit={jest.fn()}>
            {(formik) => {
              formikValues = formik.values;
              return (
                <QuantityComponent
                  label="Observation.quantity"
                  canEdit={true}
                  showComparator={true}
                  fieldRequired={false}
                />
              );
            }}
          </Formik>
        </ExecutionContextProvider>
      );

      const codeInput = (await screen.findByTestId(
        "code-input-input"
      )) as HTMLInputElement;

      fireEvent.change(codeInput, { target: { value: display } });

      await waitFor(() => {
        const updatedQuantity = formikValues.Observation.quantity;
        expect(updatedQuantity.code).toBe(expectedCode);
        expect(updatedQuantity.unit).toBe(display);
        expect(updatedQuantity.system).toBe("http://unitsofmeasure.org");
      });
    }
  );

  test("does not remap a valid UCUM code", async () => {
    let formikValues: any;
    const initialValues = {
      Observation: {
        quantity: { value: 10, code: "", comparator: "" },
      },
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
        <Formik initialValues={initialValues} onSubmit={jest.fn()}>
          {(formik) => {
            formikValues = formik.values;
            return (
              <QuantityComponent
                label="Observation.quantity"
                canEdit={true}
                showComparator={true}
                fieldRequired={false}
              />
            );
          }}
        </Formik>
      </ExecutionContextProvider>
    );

    const codeInput = (await screen.findByTestId(
      "code-input-input"
    )) as HTMLInputElement;

    fireEvent.change(codeInput, { target: { value: "mg" } });

    await waitFor(() => {
      const updatedQuantity = formikValues.Observation.quantity;
      // valid UCUM code, existing behavior preserved (not a timing display value)
      expect(updatedQuantity.code).toBe("mg");
      expect(updatedQuantity.unit).toBe("milligram");
      expect(updatedQuantity.system).toBe("http://unitsofmeasure.org");
    });
  });

  test("all fields are read-only when canEdit is false", async () => {
    renderWithFormik({
      label: "Observation.quantity",
      showComparator: true,
      canEdit: false,
    });

    const comparatorField = await screen.findByTestId(
      "code-selector-Comparator"
    );
    expect(comparatorField).toHaveAttribute("readonly");

    const valueInput = await screen.findByTestId(
      "decimal-field-Observation.quantity.value"
    );

    expect(valueInput).toHaveAttribute("readonly");

    const codeInput = (await screen.findByTestId(
      "code-input-Observation.quantity"
    )) as HTMLTextAreaElement;
    expect(codeInput).toHaveAttribute("readonly");
  });

  test("calls handleAddElement when AddElementButton is clicked", async () => {
    const handleAddElementMock = jest.fn();

    renderWithFormik({
      handleAddElement: handleAddElementMock,
      addTitle: "Quantity",
      showAddAttributeButton: true,
    });

    const addButton = screen.getByText("Add Quantity");
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);

    await waitFor(() => {
      expect(handleAddElementMock).toHaveBeenCalledTimes(1);
    });
  });

  test("does not render AddElementButton when showAddAttributeButton is false", () => {
    renderWithFormik({
      showAddAttributeButton: false,
      addTitle: "Quantity",
    });

    expect(screen.queryByText("Add Quantity")).not.toBeInTheDocument();
  });

  test("does not render AddElementButton when addTitle is empty", () => {
    renderWithFormik({
      showAddAttributeButton: true,
      addTitle: "",
    });

    expect(screen.queryByText("Add Quantity")).not.toBeInTheDocument();
  });

  test("does not render AddElementButton or delete button when canEdit is false", () => {
    renderWithFormik({
      showAddAttributeButton: true,
      addTitle: "Quantity",
      showDeleteButton: true,
      canEdit: false,
    });
    expect(screen.queryByText("Add Quantity")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("delete-button-Observation.quantity")
    ).not.toBeInTheDocument();
  });

  test("displays tooltip on hover for Unit(s) field", async () => {
    renderWithFormik();

    const tooltipButton = await screen.getByTestId("code-input-tooltip");
    userEvent.hover(tooltipButton);
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent(
      "Enter the UCUM (Unified Code for Units of Measure) code value."
    );
  });

  test("should display delete icon and calls handleDeleteElement when delete button is clicked", async () => {
    const handleDeleteElementMock = jest.fn();

    renderWithFormik({
      showDeleteButton: true,
      handleDeleteElement: handleDeleteElementMock,
    });

    const deleteButton = screen.getByTestId(
      "delete-button-Observation.quantity"
    );
    expect(deleteButton).toBeInTheDocument();

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(handleDeleteElementMock).toHaveBeenCalledTimes(1);
    });
  });

  test("does not display delete button when showDeleteButton is false", () => {
    renderWithFormik({
      showDeleteButton: false,
    });

    expect(
      screen.queryByTestId("delete-button-Observation.quantity")
    ).not.toBeInTheDocument();
  });
});
