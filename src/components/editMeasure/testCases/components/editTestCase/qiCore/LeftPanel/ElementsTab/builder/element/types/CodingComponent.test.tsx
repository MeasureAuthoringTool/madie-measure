import * as React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CodingComponent from "./CodingComponent";
import { ElementDefinition, ValueSet } from "fhir/r4";
import { Model } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";
import { Formik, useFormikContext } from "formik";
import { ExecutionContextProvider } from "../../../../../../../routes/qiCore/ExecutionContext";
import axios from "../../../../../../../../../../../api/axios-instance";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../../../../../../api/ServiceContext";

jest.mock("../../../../../../../../../../../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockOnChange = jest.fn();

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

const mockMeasureValueSet = {
  resourceType: "ValueSet",
  name: "Measure ValueSet",
  title: "Measure ValueSet",
  expansion: {
    contains: [
      {
        system: "http://example.com/system1",
        code: "M1",
        display: "M1 Code",
      },
      {
        system: "http://example.com/system2",
        code: "M2",
        display: "M2 Code",
      },
    ],
  },
} as ValueSet;

const FormikCodingHarness = ({ structureDefinition }) => {
  const formik = useFormikContext<any>();
  const [resetKey, setResetKey] = React.useState(0);

  const handleUndo = () => {
    formik.resetForm();
    setResetKey((currentKey) => currentKey + 1);
  };

  return (
    <>
      <CodingComponent
        key={resetKey}
        canEdit={true}
        structureDefinition={structureDefinition}
        label="test-label"
        value={formik.values.coding}
        onChange={(value) => formik.setFieldValue("coding", value)}
      />
      <button type="button" onClick={handleUndo}>
        Undo
      </button>
    </>
  );
};

describe("CodingComponent Tests", () => {
  let mockStructureDefinition: ElementDefinition;
  beforeEach(() => {
    mockStructureDefinition = {
      binding: {
        strength: "required",
        valueSet: "http://example.com/ValueSet/123",
      },
    } as ElementDefinition;
  });

  const renderExtensibleCoding = (
    value: any,
    valueSets: ValueSet[] = [mockMeasureValueSet]
  ) =>
    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [{ model: Model.QICORE } as any, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [valueSets, jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <Formik initialValues={{ coding: value }} onSubmit={jest.fn()}>
            <FormikCodingHarness
              structureDefinition={mockStructureDefinition}
            />
          </Formik>
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

  it("renders placeholder when no value set is selected", () => {
    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });
    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [{ model: Model.QICORE } as any, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [null, jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <CodingComponent
            canEdit={true}
            structureDefinition={mockStructureDefinition}
            label="test-label"
            value={null}
            onChange={mockOnChange}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    const valueSetSelector = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    expect(valueSetSelector).toHaveTextContent("- Select -");
  });

  it("displays loading option when value set expansions are being fetched", async () => {
    mockStructureDefinition.binding.strength = "example";

    // Mock a pending promise to simulate loading state
    mockedAxios.get.mockReturnValue(new Promise(() => {}));

    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [{ model: Model.QICORE } as any, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [null, jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <CodingComponent
            canEdit={true}
            structureDefinition={mockStructureDefinition}
            label="actuality"
            value={null}
            onChange={mockOnChange}
            addTitle={"Coding"}
            showAddAttributeButton={true}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );
    expect(screen.getByText("Add Coding")).toBeInTheDocument();

    const valueSetSelect = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    userEvent.click(valueSetSelect);

    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(1);
    });
    expect(screen.getByRole("option")).toHaveTextContent("Loading...");
  });

  it("handles empty value set expansion gracefully", async () => {
    const emptyValueSet = {
      resourceType: "ValueSet",
      name: "Empty ValueSet",
      title: "Empty ValueSet Title",
      expansion: { contains: [] },
    } as ValueSet;

    mockedAxios.get.mockResolvedValue({
      data: emptyValueSet,
    });

    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [{ model: Model.QICORE } as any, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [null, jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <CodingComponent
            canEdit={true}
            structureDefinition={mockStructureDefinition}
            label="test-label"
            value={null}
            onChange={mockOnChange}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    const valueSetSelector = await screen.findByTestId("value-set-test-label");
    userEvent.click(valueSetSelector);

    const emptyOption = screen.queryByTestId(/value-set-option-/);
    expect(emptyOption).not.toBeInTheDocument();
  });

  it("applies selected code from value set for any type of binding", async () => {
    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });

    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [{ model: Model.QICORE } as any, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [null, jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <CodingComponent
            canEdit={true}
            structureDefinition={mockStructureDefinition}
            label="test-label"
            value={null}
            onChange={mockOnChange}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    // select value set
    const valueSetSelect = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    userEvent.click(valueSetSelect);
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await waitFor(() => {
      expect(screen.getByRole("option")).toHaveTextContent(
        mockBindingValueSet.title
      );
    });
    userEvent.click(screen.getByRole("option"));
    await waitFor(() => {
      expect(valueSetSelect).toHaveTextContent(mockBindingValueSet.title);
    });

    // select code system
    const codeSystemSelect = screen.getByRole("combobox", {
      name: "Code System",
    });
    userEvent.click(codeSystemSelect);
    const codeSystemOptions = screen.getAllByRole("option");
    expect(codeSystemOptions).toHaveLength(2);
    await waitFor(() => {
      expect(codeSystemOptions[0]).toHaveTextContent(
        mockBindingValueSet.expansion?.contains[0].system
      );
    });
    userEvent.click(codeSystemOptions[0]);

    // select code
    const codeSelect = screen.getByRole("combobox", {
      name: "Code",
    });
    userEvent.click(codeSelect);
    const codeOptions = screen.getAllByRole("option");
    userEvent.click(codeOptions[0]);
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        code: mockBindingValueSet.expansion?.contains[0].code,
        system: mockBindingValueSet.expansion?.contains[0].system,
        display: mockBindingValueSet.expansion?.contains[0].display,
        extension: [
          {
            url: "http://hl7.org/fhir/StructureDefinition/valueset-reference",
            valueUri: mockBindingValueSet.url,
          },
        ],
      });
    });
  });

  it("applies custom code if user select it for non-required binding", async () => {
    mockStructureDefinition.binding.strength = "extensible";
    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });
    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [{ model: Model.QICORE } as any, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [[mockMeasureValueSet], jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <CodingComponent
            canEdit={true}
            structureDefinition={mockStructureDefinition}
            label="test-label"
            value={null}
            onChange={mockOnChange}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    const valueSetSelect = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    userEvent.click(valueSetSelect);

    await waitFor(async () => {
      expect(screen.getAllByRole("option")).toHaveLength(3);
    });

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
    expect(mockOnChange).toHaveBeenCalledWith({
      code: "C1",
      system: "http://example.com/custom-system",
      display: "C1",
    });

    fireEvent.change(codeSystem, {
      target: { value: "http://example.com/updated-system" },
    });

    expect(code).toHaveValue("C1");
  });

  it("displays a saved custom code as read only on load", async () => {
    mockStructureDefinition.binding.strength = "extensible";
    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });
    const savedCustomCode = {
      system: "http://example.com/custom-system",
      code: "CUSTOM",
      display: "Custom code",
    };

    renderExtensibleCoding(savedCustomCode);

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", {
          name: "Value Set / Direct Reference Code",
        })
      ).toHaveTextContent("- Select -");
    });
    expect(screen.getByRole("textbox", { name: "Code System" })).toHaveValue(
      savedCustomCode.system
    );
    expect(
      screen.getByRole("textbox", { name: "Code System" })
    ).toHaveAttribute("readonly");
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveValue(
      `${savedCustomCode.code} - ${savedCustomCode.display}`
    );
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveAttribute(
      "readonly"
    );
  });

  it("displays a saved direct reference code as selected on load", async () => {
    mockStructureDefinition.binding.strength = "extensible";
    const directReferenceCode = {
      ...mockMeasureValueSet,
      id: "drc-test123",
      url: "drc-test123",
      name: "Direct Reference Code",
      title: "Direct Reference Code",
    } as ValueSet;
    const savedCoding = directReferenceCode.expansion.contains[0];
    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });

    renderExtensibleCoding(savedCoding, [directReferenceCode]);

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", {
          name: "Value Set / Direct Reference Code",
        })
      ).toHaveTextContent(directReferenceCode.title);
    });
    expect(
      screen.getByRole("combobox", { name: "Code System" })
    ).toHaveTextContent(savedCoding.system);
    expect(screen.getByRole("combobox", { name: "Code" })).toHaveTextContent(
      savedCoding.code
    );
  });

  it("resolves a saved value-set coding after its expansion loads", async () => {
    mockStructureDefinition.binding.strength = "extensible";
    const savedCoding = {
      ...mockBindingValueSet.expansion.contains[0],
      extension: [
        {
          url: "http://hl7.org/fhir/StructureDefinition/valueset-reference",
          valueUri: mockBindingValueSet.url,
        },
      ],
    };
    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });

    renderExtensibleCoding(savedCoding);

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", {
          name: "Value Set / Direct Reference Code",
        })
      ).toHaveTextContent(mockBindingValueSet.title);
    });
    expect(screen.queryByTestId("custom-code-input")).not.toBeInTheDocument();
  });

  it("restores the original custom code after undoing a custom code selection", async () => {
    mockStructureDefinition.binding.strength = "extensible";
    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });
    const originalCustomCode = {
      system: "http://example.com/original-system",
      code: "ORIGINAL",
      display: "Original code",
    };
    renderExtensibleCoding(originalCustomCode);

    const valueSetSelect = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    userEvent.click(valueSetSelect);
    await waitFor(() => {
      expect(
        screen.getByTestId("value-set-option-custom-code")
      ).toBeInTheDocument();
    });
    userEvent.click(screen.getByTestId("value-set-option-custom-code"));

    userEvent.type(
      screen.getByTestId("custom-code-system-input"),
      "http://example.com/changed-system"
    );
    userEvent.type(screen.getByTestId("custom-code-input"), "CHANGED");

    userEvent.click(screen.getByRole("button", { name: "Undo" }));

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", {
          name: "Value Set / Direct Reference Code",
        })
      ).toHaveTextContent("- Select -");
    });
    expect(screen.getByRole("textbox", { name: "Code System" })).toHaveValue(
      originalCustomCode.system
    );
    expect(
      screen.getByRole("textbox", { name: "Code System" })
    ).toHaveAttribute("readonly");
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveValue(
      `${originalCustomCode.code} - ${originalCustomCode.display}`
    );
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveAttribute(
      "readonly"
    );
  });

  it("restores the original custom code after undoing a value set selection", async () => {
    mockStructureDefinition.binding.strength = "extensible";
    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });
    const originalCustomCode = {
      system: "http://example.com/original-system",
      code: "ORIGINAL",
      display: "Original code",
    };
    renderExtensibleCoding(originalCustomCode);

    const valueSetSelect = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    userEvent.click(valueSetSelect);
    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: mockMeasureValueSet.title })
      ).toBeInTheDocument();
    });
    userEvent.click(
      screen.getByRole("option", { name: mockMeasureValueSet.title })
    );

    const codeSystemSelect = screen.getByRole("combobox", {
      name: "Code System",
    });
    userEvent.click(codeSystemSelect);
    userEvent.click(
      screen.getByRole("option", {
        name: mockMeasureValueSet.expansion.contains[1].system,
      })
    );

    const codeSelect = screen.getByRole("combobox", { name: "Code" });
    userEvent.click(codeSelect);
    userEvent.click(
      screen.getByRole("option", {
        name: `${mockMeasureValueSet.expansion.contains[1].code} - ${mockMeasureValueSet.expansion.contains[1].display}`,
      })
    );

    userEvent.click(screen.getByRole("button", { name: "Undo" }));

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", {
          name: "Value Set / Direct Reference Code",
        })
      ).toHaveTextContent("- Select -");
    });
    expect(screen.getByRole("textbox", { name: "Code System" })).toHaveValue(
      originalCustomCode.system
    );
    expect(
      screen.getByRole("textbox", { name: "Code System" })
    ).toHaveAttribute("readonly");
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveValue(
      `${originalCustomCode.code} - ${originalCustomCode.display}`
    );
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveAttribute(
      "readonly"
    );
  });

  it("updates existing code from a value set", async () => {
    const value = {
      ...mockBindingValueSet.expansion?.contains[0],
      extension: [
        {
          url: "http://hl7.org/fhir/StructureDefinition/valueset-reference",
          valueUri: mockBindingValueSet.url,
        },
      ],
    };
    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });

    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [{ model: Model.QICORE } as any, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [null, jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <CodingComponent
            canEdit={true}
            structureDefinition={mockStructureDefinition}
            label="test-label"
            value={value}
            onChange={mockOnChange}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

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
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
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

  it("display existing code from a value set in readonly mode if the coding extension is missing", async () => {
    const coding = {
      ...mockBindingValueSet.expansion?.contains[0],
    };
    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });

    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [{ model: Model.QICORE } as any, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [null, jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <CodingComponent
            canEdit={true}
            structureDefinition={mockStructureDefinition}
            label="test-label"
            value={coding}
            onChange={mockOnChange}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    // verify value set
    const valueSetSelect = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    expect(valueSetSelect).toHaveTextContent("- Select -");

    // verify code system
    const codeSystem = screen.getByRole("textbox", {
      name: "Code System",
    });
    expect(codeSystem).toHaveTextContent(coding.system);
    expect(codeSystem).toHaveAttribute("readonly");

    // verify code
    const code = screen.getByRole("textbox", {
      name: "Code",
    });
    expect(code).toHaveTextContent(`${coding.code} - ${coding.display}`);
    expect(code).toHaveAttribute("readonly");

    expect(
      screen.getByTestId("select-valueset-warning-B1")
    ).toBeInTheDocument();
    // verify note
    expect(
      screen.getByText(
        "To update code system or code please select a valid value set."
      )
    ).toBeInTheDocument();
  });

  it("should not display warning message if canEdit is undefined", async () => {
    const coding = {
      ...mockBindingValueSet.expansion?.contains[0],
    };
    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });

    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [{ model: Model.QICORE } as any, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [null, jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <CodingComponent
            canEdit={undefined}
            structureDefinition={mockStructureDefinition}
            label="test-label"
            value={coding}
            onChange={mockOnChange}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    // verify code system
    const codeSystem = screen.getByRole("textbox", {
      name: "Code System",
    });
    expect(codeSystem).toHaveTextContent(coding.system);
    expect(codeSystem).toHaveAttribute("readonly");

    // verify code
    const code = screen.getByRole("textbox", {
      name: "Code",
    });
    expect(code).toHaveTextContent(`${coding.code} - ${coding.display}`);
    expect(code).toHaveAttribute("readonly");
    expect(
      screen.queryByTestId("select-valueset-warning-B1")
    ).not.toBeInTheDocument();
    // verify note
    expect(
      screen.queryByText(
        "To update code system or code please select a valid value set."
      )
    ).not.toBeInTheDocument();
  });

  it("display existing code from a value set in readonly mode if the coding extension and code display is missing", async () => {
    const coding = {
      ...mockBindingValueSet.expansion?.contains[0],
      display: undefined,
    };
    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });

    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [{ model: Model.QICORE } as any, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [null, jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <CodingComponent
            canEdit={true}
            structureDefinition={mockStructureDefinition}
            label="test-label"
            value={coding}
            onChange={mockOnChange}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    // verify value set
    const valueSetSelect = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    expect(valueSetSelect).toHaveTextContent("- Select -");

    // verify code system
    const codeSystem = screen.getByRole("textbox", {
      name: "Code System",
    });
    expect(codeSystem).toHaveTextContent(coding.system);
    expect(codeSystem).toHaveAttribute("readonly");

    // verify code
    const code = screen.getByRole("textbox", {
      name: "Code",
    });
    expect(code).toHaveTextContent(coding.code);
    expect(code).toHaveAttribute("readonly");
  });

  it("displays expansion failed message when value set fails to expand", async () => {
    mockStructureDefinition.binding.strength = "example";
    mockedAxios.get.mockRejectedValue(new Error("Expansion failed"));

    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [{ model: Model.QICORE } as any, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [[mockMeasureValueSet], jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <CodingComponent
            canEdit={true}
            structureDefinition={mockStructureDefinition}
            label="test-label"
            value={null}
            onChange={mockOnChange}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    const valueSetSelect = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });

    await waitFor(() => {
      userEvent.click(valueSetSelect);
    });

    await waitFor(() => {
      const options = screen.getAllByRole("option");
      // Should show "Valueset failed to expand" and measure value sets
      expect(options.length).toBeGreaterThan(0);
      expect(screen.getByText("Valueset failed to expand")).toBeInTheDocument();
    });
  });

  it("test CodingComponent includePrev set to false", async () => {
    mockStructureDefinition = {
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/us/core/ValueSet/omb-ethnicity-category",
      },
    } as ElementDefinition;

    const mockBindingValueSet = {
      resourceType: "ValueSet",
      id: "omb-ethnicity-category",
      name: "OmbEthnicityCategories",
      title: "OMB Ethnicity Categories",
      url: "http://hl7.org/fhir/us/core/ValueSet/omb-ethnicity-category",
      expansion: {
        contains: [
          {
            system:
              "http://hl7.org/fhir/us/core/ValueSet/omb-ethnicity-category",
            code: "2135-2",
            display: "Hispanic or Latino",
          },
        ],
      },
    };

    mockedAxios.get.mockResolvedValue({
      data: mockBindingValueSet,
    });

    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [{ model: Model.QICORE } as any, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [[mockMeasureValueSet], jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <CodingComponent
            canEdit={true}
            structureDefinition={mockStructureDefinition}
            label="test-label"
            value={null}
            onChange={mockOnChange}
            includePrev={false}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    const valueSetSelector = await screen.findByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });

    await waitFor(() => {
      expect(valueSetSelector).toHaveTextContent("- Select -");
    });

    // When includePrev is false, should only include binding value set
    userEvent.click(valueSetSelector);
    await waitFor(() => {
      const options = screen.getAllByRole("option");
      // Should show Custom Code and OMB Ethnicity Categories only (no measure value sets)
      expect(options).toHaveLength(2);
    });
  });

  it("should add extension to coding when selected value set is not DRC", async () => {
    const mockOnChange = jest.fn();
    mockedAxios.get.mockResolvedValue({
      data: mockMeasureValueSet,
    });

    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [{ model: Model.QICORE } as any, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [null, jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <CodingComponent
            canEdit={true}
            structureDefinition={mockStructureDefinition}
            label="test-label"
            value={null}
            onChange={mockOnChange}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    const valueSetSelect = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    userEvent.click(valueSetSelect);

    await waitFor(() => {
      expect(screen.getByRole("option")).toHaveTextContent(
        mockMeasureValueSet.title
      );
    });
    userEvent.click(screen.getByRole("option"));

    const systemSelect = screen.getByRole("combobox", {
      name: "Code System",
    });
    userEvent.click(systemSelect);

    await waitFor(() => {
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
    });
    userEvent.click(screen.getAllByRole("option")[0]);

    const codeSelect = screen.getByRole("combobox", {
      name: "Code",
    });
    userEvent.click(codeSelect);

    await waitFor(() => {
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
    });
    userEvent.click(screen.getAllByRole("option")[0]);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/valueset-reference",
              valueUri: mockMeasureValueSet.url,
            },
          ],
        })
      );
    });
  });

  it("should not add extension to coding when selected value set is DRC", async () => {
    const drcValueSet = {
      ...mockMeasureValueSet,
      id: "drc-test123",
      url: "drc-test123",
    };
    const mockOnChange = jest.fn();
    mockedAxios.get.mockResolvedValue({
      data: drcValueSet,
    });

    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [{ model: Model.QICORE } as any, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [null, jest.fn()],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <CodingComponent
            canEdit={true}
            structureDefinition={mockStructureDefinition}
            label="test-label"
            value={null}
            onChange={mockOnChange}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    const valueSetSelect = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    userEvent.click(valueSetSelect);

    await waitFor(() => {
      expect(screen.getByRole("option")).toHaveTextContent(drcValueSet.title);
    });
    userEvent.click(screen.getByRole("option"));

    const systemSelect = screen.getByRole("combobox", {
      name: "Code System",
    });
    userEvent.click(systemSelect);

    await waitFor(() => {
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
    });
    userEvent.click(screen.getAllByRole("option")[0]);

    const codeSelect = screen.getByRole("combobox", {
      name: "Code",
    });
    userEvent.click(codeSelect);

    await waitFor(() => {
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
    });
    userEvent.click(screen.getAllByRole("option")[0]);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.not.objectContaining({
          extension: expect.any(Array),
        })
      );
    });
  });
});
