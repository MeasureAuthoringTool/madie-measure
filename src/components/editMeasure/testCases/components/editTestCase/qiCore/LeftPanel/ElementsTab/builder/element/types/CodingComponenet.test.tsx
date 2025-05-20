import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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
            fieldRequired={false}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    const valueSetSelector = screen.getByTestId("value-set-test-label");
    expect(valueSetSelector).toHaveTextContent("- Select -");
  });

  it("displays loading option when value set expansions are being fetched", async () => {
    mockStructureDefinition.binding.strength = "example";
    render(
      <ApiContextProvider value={mockConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [null, jest.fn()],
            bundleState: [null, jest.fn()],
            valueSetsState: [null, jest.fn()],
            executionContextReady: false,
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
            fieldRequired={false}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

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
            fieldRequired={false}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    const valueSetSelector = await screen.findByTestId("value-set-test-label");
    userEvent.click(valueSetSelector);

    const emptyOption = screen.queryByTestId(/value-set-option-/);
    expect(emptyOption).not.toBeInTheDocument();
  });

  it("Applies selected code from value set for any type of binding", async () => {
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
            fieldRequired={false}
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
    userEvent.click(screen.getAllByRole("option")[0]);

    // select system select
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
        code: "B1",
        system: "http://example.com/system1",
        display: "B1 Code",
      });
    });
  });

  it("Applies custom code if user select it for non-required binding", async () => {
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
            fieldRequired={false}
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
});
