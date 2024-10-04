import * as React from "react";
import { MeasureCQL } from "../../../../common/MeasureCQL";
import {
  act,
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RiskAdjustment from "./RiskAdjustment";
import { Measure } from "@madie/madie-models";
import {
  ServiceConfig,
  ApiContextProvider,
} from "../../../../../api/ServiceContext";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../../api/useMeasureServiceApi";
import { checkUserCanEdit } from "@madie/madie-util";

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  qdmElmTranslationService: {
    baseUrl: "qdm-elm-service",
  },
  fhirElmTranslationService: {
    baseUrl: "fhir-elm-service",
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
  riskAdjustments: [
    {
      definition: "Initial Population",
      description: "",
    },
  ],
  riskAdjustmentDescription: "test description",
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

const RenderRiskAdjustment = () => {
  return render(
    <ApiContextProvider value={serviceConfig}>
      <RiskAdjustment />
    </ApiContextProvider>
  );
};

describe("QdmRiskAdjustment Component", () => {
  it("Should render risk Adjustment component with the values saved in DB", async () => {
    RenderRiskAdjustment();
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();

    const description = screen.getByTestId("riskAdjustmentDescription");
    expect(description).toHaveTextContent("test description");
  });

  it("Should render disabled components if the user doesn't have permissions", async () => {
    checkUserCanEdit.mockReturnValue(false);
    RenderRiskAdjustment();
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();

    const comboBoxInput = screen.getByRole("combobox");
    expect(comboBoxInput).toBeDisabled();

    const description = screen.getByTestId("riskAdjustmentDescription");
    expect(description).toHaveTextContent("test description");
    expect(description).toBeDisabled();
  });

  it("Should successfully update risk Adjustment values and save to DB on 200", async () => {
    checkUserCanEdit.mockReturnValue(true);
    // Mocking service call to update measure
    const newRiskAdjustments = [
      {
        definition: "Initial Population",
        description: "",
      },
      {
        definition: "SDE Ethnicity",
        description: "",
      },
    ];
    const newRiskAdjustmentDescription = "Updated test description";
    const updatedMeasure = {
      ...mockTestMeasure,
      riskAdjustments: newRiskAdjustments,
      riskAdjustmentDescription: newRiskAdjustmentDescription,
    };
    measureServiceApi = {
      updateMeasure: jest
        .fn()
        .mockResolvedValueOnce({ status: 200, data: updatedMeasure }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => measureServiceApi);

    RenderRiskAdjustment();

    // Verifies if RA already loads values from store and able to add new
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();
    const riskAdjustmentButton =
      within(riskAdjustmentSelect).getByTitle("Open");

    userEvent.click(riskAdjustmentButton);
    await waitFor(() => {
      userEvent.click(screen.getByText("SDE Ethnicity"));
    });
    expect(
      screen.getByRole("button", { name: "SDE Ethnicity" })
    ).toBeInTheDocument();

    // Verifies if RA description already loads values from store and able to update
    const description = screen.getByTestId("riskAdjustmentDescription");
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
          screen.getByTestId("risk-adjustment-success")
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

  it("Should render disabled components if the user doesn't have permissions", async () => {
    checkUserCanEdit.mockReturnValue(false);
    RenderRiskAdjustment();
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();

    const comboBoxInput = screen.getByRole("combobox");
    expect(comboBoxInput).toBeDisabled();

    const description = screen.getByTestId("riskAdjustmentDescription");
    expect(description).toHaveTextContent("test description");
    expect(description).toBeDisabled();
  });

  it("Should successfully update risk Adjustment values and save to DB on 201", async () => {
    checkUserCanEdit.mockReturnValue(true);
    // Mocking service call to update measure
    const newRiskAdjustments = [
      {
        definition: "Initial Population",
        description: "",
      },
      {
        definition: "SDE Ethnicity",
        description: "",
      },
    ];
    const newRiskAdjustmentDescription = "Updated test description";
    const updatedMeasure = {
      ...mockTestMeasure,
      riskAdjustments: newRiskAdjustments,
      riskAdjustmentDescription: newRiskAdjustmentDescription,
    };
    measureServiceApi = {
      updateMeasure: jest
        .fn()
        .mockResolvedValueOnce({ status: 201, data: updatedMeasure }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => measureServiceApi);

    RenderRiskAdjustment();

    // Verifies if RA already loads values from store and able to add new
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();
    const riskAdjustmentButton =
      within(riskAdjustmentSelect).getByTitle("Open");

    userEvent.click(riskAdjustmentButton);
    await waitFor(() => {
      userEvent.click(screen.getByText("SDE Ethnicity"));
    });
    expect(
      screen.getByRole("button", { name: "SDE Ethnicity" })
    ).toBeInTheDocument();

    // Verifies if RA description already loads values from store and able to update
    const description = screen.getByTestId("riskAdjustmentDescription");
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
          screen.getByTestId("risk-adjustment-success")
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

  it("Should fail an update to risk adjustment values because of unexpected internal server issues", async () => {
    measureServiceApi = {
      updateMeasure: jest.fn().mockRejectedValue({ status: 500, data: null }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => measureServiceApi);

    RenderRiskAdjustment();

    // Verifies if RA description already loads values from store and able to update
    const description = screen.getByTestId("riskAdjustmentDescription");
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
        riskAdjustmentDescription: "Updated test description",
      })
    );

    // verifies if error toast message is displayed because of service failure
    await waitFor(
      () =>
        expect(screen.getByTestId("risk-adjustment-error")).toBeInTheDocument(),
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
    RenderRiskAdjustment();

    // Verifies if RA already loads values from store and able to add new
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();
    const riskAdjustmentButton =
      within(riskAdjustmentSelect).getByTitle("Open");

    userEvent.click(riskAdjustmentButton);
    await waitFor(() => {
      userEvent.click(screen.getByText("SDE Ethnicity"));
    });
    userEvent.click(riskAdjustmentButton); // To collapse the dropdown
    expect(
      screen.getByRole("button", { name: "SDE Ethnicity" })
    ).toBeInTheDocument();

    // Verifies if RA description already loads values from store and able to update
    const description = screen.getByTestId("riskAdjustmentDescription");
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
  });

  it("should reset after discarding changes", async () => {
    RenderRiskAdjustment();

    // Verifies if RA already loads values from store and able to add new
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();
    const riskAdjustmentButton =
      within(riskAdjustmentSelect).getByTitle("Open");

    userEvent.click(riskAdjustmentButton);
    await waitFor(() => {
      userEvent.click(screen.getByText("SDE Ethnicity"));
    });
    userEvent.click(riskAdjustmentButton); // To collapse the dropdown
    expect(
      screen.getByRole("button", { name: "SDE Ethnicity" })
    ).toBeInTheDocument();

    // Verifies if RA description already loads values from store and able to update
    const description = screen.getByTestId("riskAdjustmentDescription");
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

  it("should allow users to add and delete a value using the chip delete icon", async () => {
    checkUserCanEdit.mockReturnValue(true);
    // Mocking service call to update measure
    useMeasureServiceApiMock.mockImplementation(() => measureServiceApi);
    RenderRiskAdjustment();

    // Verifies if RA already loads values from store and able to add new
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();
    const riskAdjustmentButton =
      within(riskAdjustmentSelect).getByTitle("Open");

    userEvent.click(riskAdjustmentButton);
    await waitFor(() => {
      userEvent.click(screen.getByText("SDE Ethnicity"));
    });
    expect(
      screen.getByRole("button", { name: "SDE Ethnicity" })
    ).toBeInTheDocument();

    act(async () => {
      const deleteButton = await screen.findByTestId("CancelIcon");
      userEvent.click(deleteButton);
      expect(
        screen.queryByRole("button", { name: "SDE Ethnicity" })
      ).not.toBeInTheDocument();
    });
  });
});
