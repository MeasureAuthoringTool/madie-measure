import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ElementDefinition, ValueSet } from "fhir/r4";
import userEvent from "@testing-library/user-event";
import { ExecutionContextProvider } from "../../../../../../../routes/qiCore/ExecutionContext";
import axios from "../../../../../../../../../../../api/axios-instance";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../../../../../../api/ServiceContext";
import CodeableConceptComponent from "./CodeableConceptComponent";

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

const mockStructureDefinition = {
  binding: {
    strength: "required",
    valueSet: "http://example.com/ValueSet/123",
  },
} as ElementDefinition;

describe("CodeableConceptComponent Tests", () => {
  it("render and update codeable concept", async () => {
    const value = {
      coding: [
        {
          ...mockBindingValueSet.expansion?.contains[0],
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/valueset-reference",
              valueUrl: mockBindingValueSet.url,
            },
          ],
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
          <CodeableConceptComponent
            canEdit={true}
            structureDefinition={mockStructureDefinition}
            label="test-label"
            value={value}
            onChange={mockOnChange}
            addTitle={"Codeable"}
            showAddAttributeButton={true}
          />
        </ExecutionContextProvider>
      </ApiContextProvider>
    );
    expect(screen.getByText("Add Codeable")).toBeInTheDocument();

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
        coding: [
          {
            code: mockBindingValueSet.expansion?.contains[1].code,
            system: mockBindingValueSet.expansion?.contains[1].system,
            display: mockBindingValueSet.expansion?.contains[1].display,
            extension: [
              {
                url: "http://hl7.org/fhir/StructureDefinition/valueset-reference",
                valueUri: mockBindingValueSet.url,
              },
            ],
          },
        ],
      });
    });
  });
});
