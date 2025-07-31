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

    const codeSelect = screen.getByRole("combobox", { name: "Gender" });
    expect(codeSelect).toHaveTextContent("female");

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

    const codeSelect = screen.getByRole("combobox", { name: "Gender" });
    expect(codeSelect).toHaveTextContent("female");

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
          addTitle={"Codes"}
          showAddAttributeButton={true}
        />
      </ApiContextProvider>
    );
    expect(screen.getByText("Add Codes")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith(
      "fhirService.com/qicore/resources/value-set-definition?url=" +
        valueSetUrl,
      { headers: { Authorization: "Bearer test.jwt" } }
    );

    const codeSelect = screen.getByRole("textbox", { name: "Gender" });
    expect(codeSelect).toHaveTextContent("female");
    expect(codeSelect).toHaveAttribute("readonly");
  });
});
