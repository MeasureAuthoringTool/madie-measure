import * as React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CodingComponent from "./CodingComponent";
import { ElementDefinition, ValueSet } from "fhir/r4";
import userEvent from "@testing-library/user-event";
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

  it("renders placeholder when no value set is selected", () => {
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
            measureState: [null, jest.fn()],
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
            measureState: [null, jest.fn()],
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
            measureState: [null, jest.fn()],
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
            valueUrl: mockBindingValueSet.url,
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
            measureState: [null, jest.fn()],
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
  });

  it("updates existing code from a value set", async () => {
    const value = {
      ...mockBindingValueSet.expansion?.contains[0],
      extension: [
        {
          url: "http://hl7.org/fhir/StructureDefinition/valueset-reference",
          valueUrl: mockBindingValueSet.url,
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
            measureState: [null, jest.fn()],
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
            valueUrl: mockBindingValueSet.url,
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
            measureState: [null, jest.fn()],
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

    // verify note
    expect(
      screen.getByText(
        "To update code system or code please select a valid value set."
      )
    ).toBeInTheDocument();
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
            measureState: [null, jest.fn()],
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
            measureState: [null, jest.fn()],
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
            measureState: [null, jest.fn()],
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
});
