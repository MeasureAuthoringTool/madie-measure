import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CodesComponent from "./CodesComponent";
import axios from "../../../../../../../../../../../api/axios-instance";
import userEvent from "@testing-library/user-event";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../../../../../../api/ServiceContext";
import { ElementDefinition } from "fhir/r4";

const mockConfig = {
  fhirService: {
    baseUrl: "fhirService.com",
  },
  terminologyService: {
    baseUrl: "terminology-service.com",
  },
} as unknown as ServiceConfig;

const valueSetUrl = "http://hl7.org/fhir/ValueSet/administrative-gender";
const structureDefinition = {
  binding: {
    strength: "required",
    valueSet: valueSetUrl,
  },
} as ElementDefinition;

const mockExpansionResponse = {
  expansion: {
    contains: [
      { code: "male", display: "Male" },
      { code: "female", display: "Female" },
      { code: "other", display: "Other" },
      { code: "unknown", display: "Unknown" },
    ],
  },
};

const structureDefinitionWithExtension = {
  id: "Extension.value[x]",
  path: "Extension.value[x]",
  short: "Value of extension",
  definition:
    "Value of extension - must be one of a constrained set of the data types (see [Extensibility](http://hl7.org/fhir/R4/extensibility.html) for a list).",
  min: 1,
  max: "1",
  base: {
    path: "Extension.value[x]",
    min: 0,
    max: "1",
  },
  type: [
    {
      code: "code",
    },
  ],
  constraint: [
    {
      key: "ele-1",
      severity: "error",
      human: "All FHIR elements must have a @value or children",
      expression: "hasValue() or (children().count() > id.count())",
      xpath: "@value|f:*|h:div",
      source: "http://hl7.org/fhir/StructureDefinition/Element",
    },
  ],
  isModifier: false,
  isSummary: false,
  binding: {
    strength: "required",
    description: "Code for sex assigned at birth",
    valueSet: "http://hl7.org/fhir/us/core/ValueSet/birthsex",
  },
  mapping: [
    {
      identity: "rim",
      map: "N/A",
    },
  ],
} as ElementDefinition;

const resource = {
  resourceType: "Patient",
  id: "446b20b5-dd46-415e-9b9f-9eba6b260743",
  meta: {
    profile: [
      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
    ],
  },
  extension: [
    {
      url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
      extension: [
        {
          url: "ombCategory",
          valueCoding: {
            code: "1002-5",
            system: "urn:oid:2.16.840.1.113883.6.238",
            display: "American Indian or Alaska Native",
            userSelected: true,
          },
        },
        {
          url: "text",
          valueString: "American Indian or Alaska Native",
        },
      ],
    },
    {
      url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
      extension: [
        {
          url: "ombCategory",
          valueCoding: {
            code: "2135-2",
            system: "urn:oid:2.16.840.1.113883.6.238",
            display: "Hispanic or Latino",
            userSelected: true,
          },
        },
        {
          url: "text",
          valueString: "Hispanic or Latino",
        },
      ],
    },
    {
      url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
      valueCode: "M",
    },
  ],
  identifier: [
    {
      type: {
        coding: [
          {
            code: "MR",
            system: "http://terminology.hl7.org/CodeSystem/v2-0203",
          },
        ],
      },
      system: "https://madie.cms.gov/",
      value: "NotscreRefAsseNotmNodxNocp",
    },
  ],
  active: true,
  name: [
    {
      use: "usual",
      text: "NotscreRefAsseNotmNodxNocp",
      family: "denompass2",
      given: ["NotscreRefAsseNotmNodxNocpdenompass2"],
    },
  ],
  gender: "male",
  birthDate: "1952-01-01",
  address: [
    {
      text: "NotscreRefAsseNotmNodxNocp, Screened Not at risk Assessed Severely Malnourished Diagnosed Care Plan, ID=NotscreRefAsseNotmNodxNocp, DOB: 01 Jan 1952",
    },
  ],
} as any;

const oids = ["2.16.840.1.113762.1.4.1", "2.16.840.1.113762.1.4.1021.103"];

const mockExpansionResponseWithExtension = {
  resourceType: "ValueSet",
  id: "birthsex",
  url: "http://hl7.org/fhir/us/core/ValueSet/birthsex",
  name: "BirthSex",
  title: "Birth Sex",
  status: "active",
  experimental: false,
  compose: {
    include: [
      {
        valueSet: [
          "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1",
        ],
      },
      {
        valueSet: [
          "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1021.103",
        ],
      },
    ],
  },
};

const valueSetsExpansion = [
  {
    resourceType: "ValueSet",
    id: "2.16.840.1.113762.1.4.1",
    name: "ONCAdministrativeSex",
    title: "ONC Administrative Sex",
    status: "active",
    expansion: {
      contains: [
        {
          system:
            "http://terminology.hl7.org/CodeSystem/v3-AdministrativeGender",
          inactive: true,
          version: "2023-02-01",
          code: "F",
          display: "Female",
        },
        {
          system:
            "http://terminology.hl7.org/CodeSystem/v3-AdministrativeGender",
          inactive: true,
          version: "2023-02-01",
          code: "M",
          display: "Male",
        },
      ],
    },
  },
  {
    resourceType: "ValueSet",
    id: "2.16.840.1.113762.1.4.1021.103",
    name: "OtherOrUnknownOrRefusedToAnswer",
    title: "Other or unknown or refused to answer",
    status: "active",
    expansion: {
      contains: [
        {
          code: "ASKU",
          display: "asked but unknown",
        },
        {
          code: "OTH",
          display: "other",
        },
        {
          code: "UNK",
          display: "unknown",
        },
      ],
    },
  },
];

const onChangeMock = jest.fn();

jest.mock("../../../../../../../../../../../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({ getAccessToken: () => "test.jwt" }),
}));

describe("Codes Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.endsWith("/value-set-definition?url=" + valueSetUrl)) {
        return Promise.resolve({ data: mockExpansionResponse });
      }
    });
  });
  it("Should render codes component with appropriate options retrieved from API", async () => {
    render(
      <ApiContextProvider value={mockConfig}>
        <CodesComponent
          canEdit={true}
          label={"Gender"}
          value={"female"}
          onChange={onChangeMock}
          fieldRequired
          structureDefinition={structureDefinition}
        />
      </ApiContextProvider>
    );
    expect(axios.get).toHaveBeenCalledWith(
      "fhirService.com/qicore/resources/value-set-definition?url=" +
        valueSetUrl,
      { headers: { Authorization: "Bearer test.jwt" } }
    );

    const codeSelectInput = screen.getByTestId("code-selector-input-Gender");
    expect(codeSelectInput).toHaveValue("female");

    const codeSelect = screen.getByRole("combobox", { name: "Gender" });

    userEvent.click(codeSelect);

    await waitFor(async () => {
      expect(await screen.getAllByRole("option")).toHaveLength(4);
    });
  });

  it("Should ignore generating the options when expansion call fails", async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.endsWith("expand")) {
        return Promise.reject({ data: "unknown error" });
      }
    });
    render(
      <ApiContextProvider value={mockConfig}>
        <CodesComponent
          canEdit={true}
          label={"Gender"}
          value={"female"}
          onChange={onChangeMock}
          fieldRequired
          structureDefinition={structureDefinition}
        />
      </ApiContextProvider>
    );
    expect(axios.get).toHaveBeenCalledWith(
      "fhirService.com/qicore/resources/value-set-definition?url=" +
        valueSetUrl,
      { headers: { Authorization: "Bearer test.jwt" } }
    );

    const codeSelectInput = screen.getByTestId("code-selector-input-Gender");
    expect(codeSelectInput).toHaveValue("female");

    const codeSelect = screen.getByRole("combobox", { name: "Gender" });
    userEvent.click(codeSelect);

    await waitFor(() => {
      const options = screen.queryAllByRole("option");
      expect(options).toHaveLength(0);
    });
  });

  it("Should disable the input if user cannot edit", async () => {
    render(
      <ApiContextProvider value={mockConfig}>
        <CodesComponent
          canEdit={false}
          label={"Gender"}
          value={"female"}
          onChange={onChangeMock}
          fieldRequired
          structureDefinition={structureDefinition}
        />
      </ApiContextProvider>
    );
    expect(axios.get).toHaveBeenCalledWith(
      "fhirService.com/qicore/resources/value-set-definition?url=" +
        valueSetUrl,
      { headers: { Authorization: "Bearer test.jwt" } }
    );

    const codeSelect = screen.getByRole("textbox", { name: "Gender" });
    expect(codeSelect).toHaveTextContent("female");
    expect(codeSelect).toHaveAttribute("readonly");
  });

  describe("Test CodesComponent for simple extension codes", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    beforeEach(() => {
      mockedAxios.get.mockImplementation((url) => {
        if (
          url ===
          "fhirService.com/qicore/resources/value-set-definition?url=http://hl7.org/fhir/us/core/ValueSet/birthsex"
        ) {
          return Promise.resolve({ data: mockExpansionResponseWithExtension });
        }
      });
      mockedAxios.put.mockImplementation((url, body, config) => {
        if (
          url === "terminology-service.com/ValueSet/$expand" &&
          Array.isArray((body as any).valueSet) &&
          (body as any).valueSet.includes(oids[0]) &&
          (body as any).valueSet.includes(oids[1]) &&
          config.headers.Authorization === "Bearer test.jwt"
        ) {
          return Promise.resolve({ data: valueSetsExpansion });
        }
        // Optionally, return a default for other calls
        return Promise.resolve({ data: {} });
      });
    });
    it("should fetch value set expansion", async () => {
      render(
        <ApiContextProvider value={mockConfig}>
          <CodesComponent
            canEdit={true}
            label={"Patient.extension[2].value[x]"}
            value={undefined}
            onChange={onChangeMock}
            fieldRequired
            structureDefinition={structureDefinitionWithExtension}
            resource={resource}
          />
        </ApiContextProvider>
      );
      expect(axios.get).toHaveBeenCalledWith(
        "fhirService.com/qicore/resources/value-set-definition?url=http://hl7.org/fhir/us/core/ValueSet/birthsex",
        { headers: { Authorization: "Bearer test.jwt" } }
      );

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalled();
      });
    });

    it("should render the codes component with options from the value set expansion", async () => {
      render(
        <ApiContextProvider value={mockConfig}>
          <CodesComponent
            canEdit={true}
            label={"Patient.extension[2].value[x]"}
            value={"M"}
            onChange={onChangeMock}
            fieldRequired
            structureDefinition={structureDefinitionWithExtension}
            resource={resource}
          />
        </ApiContextProvider>
      );

      const codeSelectInput = screen.getByTestId(
        "code-selector-input-Patient.extension[2].value[x]"
      );
      expect(codeSelectInput).toHaveValue("M");
    });

    it("test get value set definition does not have expansion or compose.include", async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (
          url ===
          "fhirService.com/qicore/resources/value-set-definition?url=http://hl7.org/fhir/us/core/ValueSet/birthsex"
        ) {
          return Promise.reject({ error: "error" });
        }
      });
      render(
        <ApiContextProvider value={mockConfig}>
          <CodesComponent
            canEdit={true}
            label={"Patient.extension[2].value[x]"}
            value={undefined}
            onChange={onChangeMock}
            fieldRequired
            structureDefinition={structureDefinitionWithExtension}
            resource={resource}
          />
        </ApiContextProvider>
      );
      expect(axios.get).toHaveBeenCalledWith(
        "fhirService.com/qicore/resources/value-set-definition?url=http://hl7.org/fhir/us/core/ValueSet/birthsex",
        { headers: { Authorization: "Bearer test.jwt" } }
      );
      await waitFor(() => {
        expect(axios.put).not.toHaveBeenCalled();
      });

      const birthSexInput = screen.getByTestId(
        "code-selector-input-Patient.extension[2].value[x]"
      );
      expect(birthSexInput).toBeInTheDocument();
      expect(birthSexInput).toHaveValue("");
    });

    it("calls getCodes with OIDs when valueSet definition has compose.include.valueSet", async () => {
      const getValueSetDefinitionMock = jest
        .fn()
        .mockResolvedValue(mockExpansionResponseWithExtension);

      const getValueSetsExpansionForOidsMock = jest
        .fn()
        .mockResolvedValue(valueSetsExpansion);

      jest
        .spyOn(
          require("../../../../../../../../api/useFhirDefinitionsService"),
          "default"
        )
        .mockReturnValue({
          getValueSetDefinition: getValueSetDefinitionMock,
        });
      jest
        .spyOn(
          require("../../../../../../../../api/useTerminologyServiceApi"),
          "default"
        )
        .mockReturnValue({
          getValueSetsExpansionForOids: getValueSetsExpansionForOidsMock,
        });

      render(
        <CodesComponent
          canEdit={true}
          label="Patient.extension[2].value[x]"
          value={undefined}
          onChange={onChangeMock}
          fieldRequired
          structureDefinition={structureDefinitionWithExtension}
          resource={resource}
        />
      );

      await waitFor(() => {
        // OIDs should be extracted and getCodes called
        expect(getValueSetsExpansionForOidsMock).toHaveBeenCalledWith([
          "2.16.840.1.113762.1.4.1",
          "2.16.840.1.113762.1.4.1021.103",
        ]);
      });
    });

    it("when structureDefinition does not have binding", async () => {
      const structureDefinitionWithoutBinding = {
        ...structureDefinitionWithExtension,
        binding: undefined,
      } as ElementDefinition;
      render(
        <ApiContextProvider value={mockConfig}>
          <CodesComponent
            canEdit={true}
            label={"Patient.extension[2].value[x]"}
            value={undefined}
            onChange={onChangeMock}
            fieldRequired
            structureDefinition={structureDefinitionWithoutBinding}
            resource={resource}
          />
        </ApiContextProvider>
      );
      const birthSexInput = screen.getByTestId(
        "code-selector-input-Patient.extension[2].value[x]"
      );
      expect(birthSexInput).toBeInTheDocument();
      expect(birthSexInput).toHaveValue("");
    });
  });

  it("Should render delete button and handle delete action when showDeleteButton is true", async () => {
    const handleDeleteElement = jest.fn();
    render(
      <ApiContextProvider value={mockConfig}>
        <CodesComponent
          canEdit={true}
          label={"Gender"}
          value={"female"}
          onChange={onChangeMock}
          fieldRequired
          structureDefinition={structureDefinition}
          showDeleteButton={true}
          handleDeleteElement={handleDeleteElement}
        />
      </ApiContextProvider>
    );

    const deleteButton = screen.getByTestId("delete-button-Gender");
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveAttribute("aria-label", "delete Gender");

    userEvent.click(deleteButton);
    await waitFor(() => {
      expect(handleDeleteElement).toHaveBeenCalledTimes(1);
    });
  });

  it("Should render add button and handle add action when showAddAttributeButton is true", async () => {
    const handleAddElement = jest.fn();
    render(
      <ApiContextProvider value={mockConfig}>
        <CodesComponent
          canEdit={true}
          label={"Gender"}
          value={"female"}
          onChange={onChangeMock}
          fieldRequired
          structureDefinition={structureDefinition}
          showAddAttributeButton={true}
          addTitle="Codes"
          handleAddElement={handleAddElement}
        />
      </ApiContextProvider>
    );

    const addButton = screen.getByText("Add Codes");
    expect(addButton).toBeInTheDocument();

    userEvent.click(addButton);
    await waitFor(() => {
      expect(handleAddElement).toHaveBeenCalledTimes(1);
    });
  });

  it("Should not render delete and add buttons when canEdit is false", async () => {
    const handleDeleteElement = jest.fn();
    const handleAddElement = jest.fn();
    render(
      <ApiContextProvider value={mockConfig}>
        <CodesComponent
          canEdit={false}
          label={"Gender"}
          value={"female"}
          onChange={onChangeMock}
          fieldRequired
          structureDefinition={structureDefinition}
          showDeleteButton={true}
          handleDeleteElement={handleDeleteElement}
          showAddAttributeButton={true}
          addTitle="Codes"
          handleAddElement={handleAddElement}
        />
      </ApiContextProvider>
    );

    const deleteButton = screen.queryByTestId("delete-button-Gender");
    expect(deleteButton).not.toBeInTheDocument();

    const addButton = screen.queryByText("Add Codes");
    expect(addButton).not.toBeInTheDocument();
  });
});
