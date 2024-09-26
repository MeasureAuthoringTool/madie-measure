import * as React from "react";
import { MeasureCQL } from "../../../../common/MeasureCQL";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Measure } from "@madie/madie-models";
import {
  ServiceConfig,
  ApiContextProvider,
} from "../../../../../api/ServiceContext";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../../api/useMeasureServiceApi";
import { checkUserCanEdit } from "@madie/madie-util";
import SupplementalData from "./SupplementalData";

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  qdmElmTranslationService: {
    baseUrl: "test-qdm-elm-service",
  },
  fhirElmTranslationService: {
    baseUrl: "test-fhir-elm-service",
  },
  terminologyService: {
    baseUrl: "terminology-service.com",
  },
};

const mockTestMeasure = {
  id: "test measure",
  createdBy: "matt",
  model: "QI-Core v4.1.1",
  measureName: "the measure for testing",
  cqlLibraryName: "TestCqlLibraryName",
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/01/2022",
  measurementPeriodEnd: "12/02/2022",
  measureSetId: "testMeasureId",
  cql: MeasureCQL,
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
  supplementalData: [
    {
      definition: "Initial Population",
      description: "",
    },
  ],
  supplementalDataDescription: "test description",
} as unknown as Measure;

jest.mock("@madie/madie-util", () => ({
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
  useKeyPress: jest.fn(() => false),
  measureStore: {
    updateMeasure: (measure) => measure,
    state: jest.fn().mockImplementation(() => mockTestMeasure),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  routeHandlerStore: {
    subscribe: (set) => {
      set({ canTravel: false, pendingPath: "" });
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

jest.mock("../../../../../api/useMeasureServiceApi");
const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
let measureServiceApi: MeasureServiceApi;

const RenderSupplementalElements = () => {
  return render(
    <ApiContextProvider value={serviceConfig}>
      <SupplementalData />
    </ApiContextProvider>
  );
};

describe("SupplementalData Component QI-Core", () => {
  it("Should render Supplemental Data component with the values saved in DB", async () => {
    RenderSupplementalElements();
    const suppolementalElementsSelect = screen.getByTestId(
      "supplemental-data-dropdown"
    );
    expect(suppolementalElementsSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();

    const description = screen.getByTestId("supplementalDataDescription");
    expect(description).toHaveTextContent("test description");
  });

  it("Should render disabled components if the user doesn't have permissions", async () => {
    checkUserCanEdit.mockReturnValue(false);
    RenderSupplementalElements();
    const suppolementalElementsSelect = screen.getByTestId(
      "supplemental-data-dropdown"
    );
    expect(suppolementalElementsSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();

    const comboBoxInputs = screen.getAllByRole("combobox");
    for (const comboBoxInput of comboBoxInputs) {
      expect(comboBoxInput).toBeDisabled();
    }

    const description = screen.getByTestId("supplementalDataDescription");
    expect(description).toHaveTextContent("test description");
    expect(description).toBeDisabled();
  });

  it("Should successfully update supplemental Elements values with default IncludeInReportTypes and save to DB", async () => {
    checkUserCanEdit.mockReturnValue(true);
    // Mocking service call to update measure
    const newSupplementalData = [
      {
        definition: "Initial Population",
        description: "",
        includeInReportType: ["Individual"],
      },
      {
        definition: '"SDE Ethnicity"',
        description: "",
        includeInReportType: [
          "Individual",
          "Subject List",
          "Summary",
          "Data Collection",
        ],
      },
    ];
    const newSupplementalDataDescription = "Updated test description";
    const updatedMeasure = {
      ...mockTestMeasure,
      supplementalData: newSupplementalData,
      supplementalDataDescription: newSupplementalDataDescription,
    };
    measureServiceApi = {
      updateMeasure: jest
        .fn()
        .mockResolvedValueOnce({ status: 200, data: updatedMeasure }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => measureServiceApi);

    RenderSupplementalElements();

    // Verifies if SE already loads values from store and able to add new
    const suppolementalElementsSelect = screen.getByTestId(
      "supplemental-data-dropdown"
    );
    expect(suppolementalElementsSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();
    const supplementalDataButton = within(
      suppolementalElementsSelect
    ).getByTitle("Open");
    const ipIncludeInReportTypeContainer = screen.getByTestId(
      "Initial Population-include-in-report-type-formcontrol"
    );
    expect(
      within(ipIncludeInReportTypeContainer).queryByText("Individual")
    ).not.toBeInTheDocument();
    expect(
      within(ipIncludeInReportTypeContainer).queryByText("Subject List")
    ).not.toBeInTheDocument();
    expect(
      within(ipIncludeInReportTypeContainer).queryByText("+2")
    ).not.toBeInTheDocument();

    // open Include in Report Type for IP
    const ipIncludeInReportTypeButton = within(
      ipIncludeInReportTypeContainer
    ).getByTitle("Open");
    expect(ipIncludeInReportTypeButton).toBeInTheDocument();
    userEvent.click(ipIncludeInReportTypeButton);
    expect(
      await within(ipIncludeInReportTypeContainer).findByTitle("Close")
    ).toBeInTheDocument();
    // add an option for Initial Population
    expect(
      await within(ipIncludeInReportTypeContainer).findByText("Individual")
    ).toBeInTheDocument();
    await waitFor(() => {
      userEvent.click(screen.getByText("Individual"));
    });
    expect(
      screen.getByRole("button", { name: "Individual" })
    ).toBeInTheDocument();

    userEvent.click(supplementalDataButton);
    const el = screen.getByText("SDE Ethnicity", { exact: false });
    expect(el).toBeDefined();
    await waitFor(() => {
      userEvent.click(el);
    });
    expect(
      screen.getByRole("button", { name: '"SDE Ethnicity"', exact: false })
    ).toBeInTheDocument();

    const sdeEthnicityIncludeInReportTypeContainer = await screen.getByTestId(
      '"SDE Ethnicity"-include-in-report-type-dropdown',
      { exact: true }
    );
    // check that it defaults to all values added for Include in Report Type
    expect(
      within(sdeEthnicityIncludeInReportTypeContainer).queryByText("Individual")
    ).toBeInTheDocument();
    expect(
      within(sdeEthnicityIncludeInReportTypeContainer).queryByText(
        "Subject List"
      )
    ).toBeInTheDocument();
    expect(
      within(sdeEthnicityIncludeInReportTypeContainer).queryByText("+2")
    ).toBeInTheDocument();

    const sdeEthnicityDropdown = within(
      sdeEthnicityIncludeInReportTypeContainer
    ).getByTitle("Open");

    userEvent.click(sdeEthnicityDropdown);
    await waitFor(() => {
      expect(screen.getAllByText("Data Collection").length).toEqual(2);
    });

    userEvent.click(screen.getByRole("button", { name: "Subject List" }));
    userEvent.click(sdeEthnicityDropdown);

    // Verifies if SD description already loads values from store and able to update
    const description = screen.getByTestId("supplementalDataDescription");
    expect(description).toHaveTextContent("test description");
    fireEvent.change(description, {
      target: { value: "Updated test description" },
    });

    // save button
    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).toBeEnabled();
    userEvent.click(saveButton);

    // verifies if success toast message is displayed
    await waitFor(
      () =>
        expect(
          screen.getByTestId("supplemental-data-success")
        ).toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );
    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });

    await waitFor(() =>
      expect(measureServiceApi.updateMeasure).toBeCalledWith({
        ...updatedMeasure,
      })
    );
  });

  it("Should fail an update to supplemental data values because of unexpected internal server issues", async () => {
    measureServiceApi = {
      updateMeasure: jest.fn().mockRejectedValue({ status: 500, data: null }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => measureServiceApi);

    RenderSupplementalElements();

    // Verifies if SD description already loads values from store and able to update
    const description = screen.getByTestId("supplementalDataDescription");
    expect(description).toHaveTextContent("test description");
    fireEvent.change(description, {
      target: { value: "Updated test description" },
    });

    // save button
    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).toBeEnabled();
    userEvent.click(saveButton);

    // Should call service with updated data
    await waitFor(() =>
      expect(measureServiceApi.updateMeasure).toBeCalledWith({
        ...mockTestMeasure,
        supplementalDataDescription: "Updated test description",
      })
    );

    // verifies if error toast message is displayed because of service failure
    await waitFor(
      () =>
        expect(
          screen.getByTestId("supplemental-data-error")
        ).toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );
    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  it("Should not discard changes on click of cancel button on discard model", async () => {
    const { container } = RenderSupplementalElements();

    // Verifies if SD already loads values from store and able to add new
    const supplementalDataSelect = screen.getByTestId(
      "supplemental-data-dropdown"
    );
    expect(supplementalDataSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();
    const supplementalDataButton = within(supplementalDataSelect).getByTitle(
      "Open"
    );

    userEvent.click(supplementalDataButton);
    await waitFor(() => {
      userEvent.click(screen.getByText('"SDE Ethnicity"', { exact: false }));
    });
    userEvent.click(supplementalDataButton); // To collapse the dropdown
    expect(
      screen.getByRole("button", { name: '"SDE Ethnicity"', exact: false })
    ).toBeInTheDocument();

    // Verifies if SD description already loads values from store and able to update
    const description = screen.getByTestId("supplementalDataDescription");
    expect(description).toHaveTextContent("test description");
    fireEvent.change(description, {
      target: { value: "Updated test description" },
    });
    expect(description).toHaveTextContent("Updated test description");

    // verifies if discard button is enabled and on click triggers discard model
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(discardButton).toBeEnabled();
    userEvent.click(discardButton);

    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();

    expect(screen.queryByText("You have unsaved changes.")).toBeVisible();
    const discardDialogCancelButton = screen.getByRole("button", {
      name: "No, Keep Working",
    });
    userEvent.click(discardDialogCancelButton);
    await waitFor(() => {
      expect(screen.queryByText("You have unsaved changes.")).not.toBeVisible();
    });

    //Verifies if the form values are not discarded
    expect(description).toHaveTextContent("Updated test description");
    expect(screen.getByText("+1")).toBeInTheDocument(); // We are limiting the selected options displayed
    const includeInReportTypeContainer = screen.getByTestId(
      '"SDE Ethnicity"-include-in-report-type-dropdown',
      { exact: false }
    );
    expect(
      within(includeInReportTypeContainer).getByText("Individual")
    ).toBeInTheDocument();
    expect(
      within(includeInReportTypeContainer).getByText("Subject List")
    ).toBeInTheDocument();
    expect(
      within(includeInReportTypeContainer).getByText("+2")
    ).toBeInTheDocument();
  });

  it("should reset after discarding changes", async () => {
    RenderSupplementalElements();

    // Verifies if SD already loads values from store and able to add new
    const supplementalDataSelect = screen.getByTestId(
      "supplemental-data-dropdown"
    );
    expect(supplementalDataSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();
    const supplementalDataButton = within(supplementalDataSelect).getByTitle(
      "Open"
    );

    userEvent.click(supplementalDataButton);
    await waitFor(() => {
      userEvent.click(screen.getByText('"SDE Ethnicity"'));
    });
    userEvent.click(supplementalDataButton); // To collapse the dropdown
    expect(
      screen.getByRole("button", { name: '"SDE Ethnicity"' })
    ).toBeInTheDocument();

    // Verifies if SD description already loads values from store and able to update
    const description = screen.getByTestId("supplementalDataDescription");
    expect(description).toHaveTextContent("test description");
    fireEvent.change(description, {
      target: { value: "Updated test description" },
    });
    expect(description).toHaveTextContent("Updated test description");

    // verifies if discard button is enabled and on click triggers discard model
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(discardButton).toBeEnabled();
    userEvent.click(discardButton);

    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();

    expect(screen.queryByText("You have unsaved changes.")).toBeVisible();
    const discardDialogContinueButton = screen.getByRole("button", {
      name: "Yes, Discard All Changes",
    });
    userEvent.click(discardDialogContinueButton);
    await waitFor(() => {
      expect(
        screen.queryByText("You have unsaved changes.")
      ).not.toBeInTheDocument();
      // Verifies if the updated form values are discarded
      expect(description).toHaveTextContent("test description");
      expect(
        screen.getByRole("button", { name: "Initial Population" })
      ).toBeInTheDocument();
      expect(screen.queryByText("+1")).not.toBeInTheDocument(); // We are limiting the selected options displayed
    });
  });
});
