import * as React from "react";
import { screen, render, waitFor } from "@testing-library/react";
import { Measure } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";
// @ts-ignore
import {
  checkUserCanEdit,
  measureStore,
  MeasureServiceApi,
} from "@madie/madie-util";
import Expansion from "./Expansion";
import { QdmExecutionContextProvider } from "../../routes/qdm/QdmExecutionContext";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../api/ServiceContext";
import axios from "../../../../../../api/axios-instance";

const mockServiceConfig = {
  measureService: { baseUrl: "measure.url" },
  testCaseService: { baseUrl: "testcase.url" },
  terminologyService: { baseUrl: "terminology.url" },
  qdmElmTranslationService: { baseUrl: "qdm-translator.url" },
  fhirElmTranslationService: { baseUrl: "fhir-translator.url" },
  excelExportService: { baseUrl: "excel-export.com" },
} as ServiceConfig;

const mockManifestList = [
  {
    fullUrl:
      "https://cts.nlm.nih.gov/fhir/Library/cms-pre-rulemaking-ecqm-2019-08-30",
    id: "cms-pre-rulemaking-ecqm-2019-08-30",
    title: "CMS Pre-rulemaking eCQM 2019-08-30",
  },
  {
    fullUrl: "https://cts.nlm.nih.gov/fhir/Library/mu2-update-2012-10-25",
    id: "mu2-update-2012-10-25",
    title: "MU2 Update 2012-10-25",
  },
  {
    fullUrl: "https://cts.nlm.nih.gov/fhir/Library/mu2-update-2012-12-21",
    id: "mu2-update-2012-12-21",
    title: "MU2 Update 2012-12-21",
  },
];

const measure = {
  id: "m1234",
  measureName: "the measure for testing",
  cqlLibraryName: "TestCqlLibraryName",
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/01/2022",
  measurementPeriodEnd: "12/02/2022",
  createdBy: "john doe",
  measureSetId: "testMeasureId",
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
} as unknown as Measure;

const measureWithTestCaseConfiguration = {
  ...measure,
  testCaseConfiguration: {
    id: "test-case-config-id",
    sdeIncluded: false,
    manifestExpansion: {
      fullUrl:
        "https://cts.nlm.nih.gov/fhir/Library/cms-pre-rulemaking-ecqm-2019-08-30",
      id: "cms-pre-rulemaking-ecqm-2019-08-30",
    },
  },
};

const mockMeasureServiceApi: MeasureServiceApi = {
  getReturnTypesForAllCqlFunctions: jest.fn(),
  getReturnTypesForAllCqlDefinitions: jest.fn(),
  fetchMeasure: jest.fn(),
  fetchMeasureBundle: jest.fn(),
  updateMeasure: jest.fn(),
  updateGroup: jest.fn(),
  deleteMeasureGroup: jest.fn(),
  updateMeasureTestCaseConfiguration: jest.fn(),
} as unknown as MeasureServiceApi;
jest.mock("../../../../../../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => measure),
    initialState: jest.fn().mockImplementation(() => measure),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  routeHandlerStore: {
    subscribe: (set) => {
      set();
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: true, pendingPath: "" },
    initialState: { canTravel: true, pendingPath: "" },
  },
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
}));

const setExecutionContextReady = jest.fn();

function renderExpansionComponent() {
  return render(
    <ApiContextProvider value={mockServiceConfig}>
      <QdmExecutionContextProvider
        value={{
          measureState: [null, jest.fn()],
          cqmMeasureState: [null, jest.fn()],
          executionContextReady: true,
          setExecutionContextReady: setExecutionContextReady,
          executing: false,
          setExecuting: jest.fn(),
          contextFailure: false,
        }}
      >
        <Expansion />
      </QdmExecutionContextProvider>
    </ApiContextProvider>
  );
}

describe("Expansion component", () => {
  it("Should display radio buttons for expansion type selection and display manifest dropdown as needed", async () => {
    mockMeasureServiceApi.updateMeasureTestCaseConfiguration = jest
      .fn()
      .mockResolvedValue(measureWithTestCaseConfiguration);
    mockedAxios.get.mockImplementation((args) => {
      if (
        args &&
        args.startsWith(mockServiceConfig.terminologyService.baseUrl)
      ) {
        return Promise.resolve({
          data: mockManifestList,
          status: 200,
        });
      }
    });
    renderExpansionComponent();

    const latestRadioInput = screen.getByLabelText(
      "Latest"
    ) as HTMLInputElement;
    const manifestRadioInput = screen.getByLabelText(
      "Manifest"
    ) as HTMLInputElement;

    // Verify default selection
    expect(latestRadioInput).toBeChecked();
    expect(manifestRadioInput).not.toBeChecked();

    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    // Update form
    userEvent.click(manifestRadioInput);
    const manifestSelectWrapperDiv = await screen.findByTestId(
      "manifest-select"
    );
    const manifestSelect = manifestSelectWrapperDiv.children[0];
    userEvent.click(manifestSelect);
    const manifestOptions = screen.getAllByRole("option");
    userEvent.click(manifestOptions[0]);
    await waitFor(() => {
      const manifestSelectInput = screen.getByTestId("manifest-select-input");
      expect(manifestSelectInput).toHaveValue(
        "CMS Pre-rulemaking eCQM 2019-08-30"
      );
      expect(saveButton).toBeEnabled();
      userEvent.click(saveButton);
    });
    expect(
      screen.getByTestId("manifest-expansion-success-text")
    ).toHaveTextContent("Expansion details Updated Successfully");
    expect(
      mockMeasureServiceApi.updateMeasureTestCaseConfiguration
    ).toHaveBeenCalledWith(
      {
        manifestExpansion: {
          fullUrl:
            "https://cts.nlm.nih.gov/fhir/Library/cms-pre-rulemaking-ecqm-2019-08-30",
          id: "cms-pre-rulemaking-ecqm-2019-08-30",
        },
      },
      measure.id
    );
  });

  it("Should disable save buttons when values match previously selected values from measure store", async () => {
    mockedAxios.get.mockImplementation((args) => {
      if (
        args &&
        args.startsWith(mockServiceConfig.terminologyService.baseUrl)
      ) {
        return Promise.resolve({
          data: mockManifestList,
          status: 200,
        });
      }
    });
    renderExpansionComponent();

    const latestRadioInput = screen.getByLabelText(
      "Latest"
    ) as HTMLInputElement;
    const manifestRadioInput = screen.getByLabelText(
      "Manifest"
    ) as HTMLInputElement;

    // Verify default selection
    expect(latestRadioInput).toBeChecked();
    expect(manifestRadioInput).not.toBeChecked();

    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    // Update form
    userEvent.click(manifestRadioInput);
    const manifestSelectWrapperDiv = await screen.findByTestId(
      "manifest-select"
    );
    const manifestSelect = manifestSelectWrapperDiv.children[0];
    userEvent.click(manifestSelect);
    const manifestOptions = screen.getAllByRole("option");
    expect(manifestOptions).toHaveLength(3);
    userEvent.click(manifestOptions[0]);
    await waitFor(() => {
      const manifestSelectInput = screen.getByTestId("manifest-select-input");
      expect(manifestSelectInput).toHaveValue(
        "CMS Pre-rulemaking eCQM 2019-08-30"
      );
      expect(saveButton).toBeEnabled();
    });
    userEvent.click(latestRadioInput);

    expect(latestRadioInput).toBeChecked();
    expect(manifestRadioInput).not.toBeChecked();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();
  });

  it("Should throw a toast error when we are unable to fetch manifest list from service", async () => {
    mockedAxios.get.mockImplementation((args) => {
      if (
        args &&
        args.startsWith(mockServiceConfig.terminologyService.baseUrl)
      ) {
        return Promise.reject({
          response: {
            data: {
              message:
                "401 Unauthorized from GET https://uat-cts.nlm.nih.gov/fhir/Library",
            },
            status: 401,
          },
        });
      }
    });
    renderExpansionComponent();

    const latestRadioInput = screen.getByLabelText(
      "Latest"
    ) as HTMLInputElement;
    const manifestRadioInput = screen.getByLabelText(
      "Manifest"
    ) as HTMLInputElement;

    // Verify default selection
    expect(latestRadioInput).toBeChecked();
    expect(manifestRadioInput).not.toBeChecked();

    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    // Update form
    userEvent.click(manifestRadioInput);
    expect(
      await screen.findByTestId("manifest-expansion-generic-error-text")
    ).toHaveTextContent(
      "Error fetching Manifest options : 401 Unauthorized from GET https://uat-cts.nlm.nih.gov/fhir/Library"
    );
  });

  it("Should display previously selected values from measure store", async () => {
    measureStore.state.mockImplementation(
      () => measureWithTestCaseConfiguration
    );
    mockedAxios.get.mockImplementation((args) => {
      if (
        args &&
        args.startsWith(mockServiceConfig.terminologyService.baseUrl)
      ) {
        return Promise.resolve({
          data: mockManifestList,
          status: 200,
        });
      }
    });
    renderExpansionComponent();
    const latestRadioInput = screen.getByLabelText(
      "Latest"
    ) as HTMLInputElement;
    const manifestRadioInput = screen.getByLabelText(
      "Manifest"
    ) as HTMLInputElement;

    expect(latestRadioInput).not.toBeChecked();
    expect(manifestRadioInput).toBeChecked();

    const manifestSelectInput = await screen.findByTestId(
      "manifest-select-input"
    );
    await waitFor(() => {
      expect(manifestSelectInput).toHaveValue(
        "CMS Pre-rulemaking eCQM 2019-08-30"
      );
    });
  });

  it("Should discard changes", async () => {
    measureStore.state.mockImplementation(() => measure);
    renderExpansionComponent();

    const latestRadioInput = screen.getByLabelText(
      "Latest"
    ) as HTMLInputElement;
    const manifestRadioInput = screen.getByLabelText(
      "Manifest"
    ) as HTMLInputElement;

    // Verify default selection
    expect(latestRadioInput).toBeChecked();
    expect(manifestRadioInput).not.toBeChecked();

    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    // Update form
    userEvent.click(manifestRadioInput);
    const manifestSelect = await screen.findByTestId("manifest-select");
    expect(manifestSelect).toBeInTheDocument();

    expect(latestRadioInput).not.toBeChecked();
    expect(manifestRadioInput).toBeChecked();

    // Save button is still disabled because custom expansion is not selected
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeEnabled();
    userEvent.click(discardButton);
    const continueButtonInDiscardDialog = await screen.findByRole("button", {
      name: "Yes, Discard All Changes",
    });
    userEvent.click(continueButtonInDiscardDialog);

    // radio group input selection reverted
    expect(latestRadioInput).toBeChecked();
    expect(manifestRadioInput).not.toBeChecked();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();
  });

  it("Should display input fields and action buttons for a non-owner but the form is disabled", async () => {
    (checkUserCanEdit as jest.Mock).mockClear().mockImplementation(() => {
      return false;
    });
    measureStore.state.mockImplementation(
      () => measureWithTestCaseConfiguration
    );
    renderExpansionComponent();

    const latestRadioInput = screen.getByRole("textbox", {
      name: "Choose Type",
    }) as HTMLInputElement;
    expect(latestRadioInput).toHaveValue("Manifest");
    expect(latestRadioInput).toHaveAttribute("readonly");

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Discard Changes",
      })
    ).toBeDisabled();
  });
});
