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
import RiskAdjustment, { RiskAdjustmentProps } from "./RiskAdjustment";
import { Measure } from "@madie/madie-models";
import {
  ServiceConfig,
  ApiContextProvider,
} from "../../../../../api/ServiceContext";

import { MeasureServiceApi, useFeatureFlags } from "@madie/madie-util";

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
} as unknown as ServiceConfig;

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
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useKeyPress: jest.fn(() => false),
  measureStore: {
    updateMeasure: (measure: Measure) => measure,
    state: jest.fn().mockImplementation(() => mockTestMeasure),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  useFeatureFlags: jest.fn(() => ({
    Locking: false,
  })),
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

const mockMeasureServiceApi: MeasureServiceApi = {
  getReturnTypesForAllCqlFunctions: jest.fn(),
  getReturnTypesForAllCqlDefinitions: jest.fn(),
  fetchMeasure: jest.fn(),
  updateMeasure: jest.fn(),
  updateGroup: jest.fn(),
  deleteMeasureGroup: jest.fn(),
} as unknown as MeasureServiceApi;

const props: RiskAdjustmentProps = {
  setAlertMessage: jest.fn,
  isTestCaseLocked: false,
  checkTestCasesLockStatus: jest.fn(),
  measureCanEdit: true,
};

const RenderRiskAdjustment = (customProps = props) => {
  const mergedProps = { ...props, ...customProps };
  return render(
    <ApiContextProvider value={serviceConfig}>
      <RiskAdjustment {...mergedProps} />
    </ApiContextProvider>
  );
};

describe("QiCore RiskAdjustment Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should render risk Adjustment component with the values saved in DB", async () => {
    RenderRiskAdjustment();
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();

    const descriptionEditor = screen.getByTestId(
      "risk-adjustment-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();
    const editor = screen.getByRole("textbox");
    expect(editor).toHaveAttribute("contenteditable", "true");
    expect(editor).toHaveTextContent("test description");
  });

  it.skip("Should render disabled components if the user doesn't have permissions", async () => {
    RenderRiskAdjustment();
    const riskAdjustments = screen.getByRole("textbox", {
      name: "Definition",
    });
    expect(riskAdjustments).toHaveTextContent("Initial Population");

    const descriptionEditor = screen.getByTestId(
      "risk-adjustment-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();

    const allFormFields = screen.getAllByRole("textbox");
    for (const formField of allFormFields) {
      expect(formField).toHaveAttribute("readonly");
    }
  });

  it.skip("Should successfully update risk Adjustment values and save to DB on 200", async () => {
    const newRiskAdjustments = [
      {
        definition: "Initial Population",
        description: "",
        includeInReportType: ["Individual"],
      },
      {
        definition: "SDE Ethnicity",
        description: "",
        includeInReportType: [
          "Individual",
          "Subject List",
          "Summary",
          "Data Collection",
        ],
      },
    ];
    const newRiskAdjustmentDescription = "<p>Updated test description</p>";
    const updatedMeasure = {
      ...mockTestMeasure,
      riskAdjustments: newRiskAdjustments,
      riskAdjustmentDescription: newRiskAdjustmentDescription,
    };
    (mockMeasureServiceApi.updateMeasure as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: updatedMeasure,
    });

    RenderRiskAdjustment();

    // Add "Individual" to Initial Population
    const ipIncludeInReportTypeContainer = screen.getByTestId(
      "Initial Population-include-in-report-type-formcontrol"
    );
    const ipIncludeInReportTypeButton = within(
      ipIncludeInReportTypeContainer
    ).getByTitle("Open");
    userEvent.click(ipIncludeInReportTypeButton);
    expect(
      await within(ipIncludeInReportTypeContainer).findByTitle("Close")
    ).toBeInTheDocument();
    await waitFor(() => {
      userEvent.click(screen.getByText("Individual"));
    });
    expect(
      screen.getByRole("button", { name: "Individual" })
    ).toBeInTheDocument();

    // Add SDE Ethnicity
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
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
    const descriptionEditor = screen.getByTestId(
      "risk-adjustment-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();

    const editableContent = within(descriptionEditor).getByRole("textbox");
    expect(editableContent).toHaveAttribute("contenteditable", "true");

    await act(async () => {
      fireEvent.focus(editableContent);
      editableContent.innerHTML = "Updated test description<";
      fireEvent.input(editableContent, {
        target: { innerHTML: "Updated test description" },
      });
      fireEvent.blur(editableContent);
    });

    // Wait for debounced update to take effect (250ms delay from TextEditor component)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    // Wait for save button to be enabled
    await waitFor(
      () => {
        const saveButton = screen.getByRole("button", { name: "Save" });
        expect(saveButton).toBeEnabled();
      },
      { timeout: 1000 }
    );

    expect(editableContent).toHaveTextContent("Updated test description");

    // Save
    const saveButton = screen.getByRole("button", { name: "Save" });
    await waitFor(() => expect(saveButton).toBeEnabled());
    userEvent.click(saveButton);

    // Success toast
    await waitFor(() =>
      expect(screen.getByTestId("risk-adjustment-success")).toBeInTheDocument()
    );
    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });

    // API call with updated description
    await waitFor(() =>
      expect(mockMeasureServiceApi.updateMeasure).toBeCalledWith({
        ...updatedMeasure,
      })
    );
  });

  it.skip("Should successfully update risk Adjustment values and save to DB on 201", async () => {
    const newRiskAdjustments = [
      {
        definition: "Initial Population",
        description: "",
      },
      {
        definition: "SDE Ethnicity",
        description: "",
        includeInReportType: [
          "Individual",
          "Subject List",
          "Summary",
          "Data Collection",
        ],
      },
    ];
    const newRiskAdjustmentDescription = "<p>Updated test description</p>";
    const updatedMeasure = {
      ...mockTestMeasure,
      riskAdjustments: newRiskAdjustments,
      riskAdjustmentDescription: newRiskAdjustmentDescription,
    };
    (mockMeasureServiceApi.updateMeasure as jest.Mock).mockResolvedValueOnce({
      status: 201,
      data: updatedMeasure,
    });

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
    // Verifies if RA description already loads values from store and able to update
    const descriptionEditor = screen.getByTestId(
      "risk-adjustment-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();

    const editableContent = within(descriptionEditor).getByRole("textbox");
    expect(editableContent).toHaveAttribute("contenteditable", "true");

    await act(async () => {
      fireEvent.focus(editableContent);
      editableContent.innerHTML = "Updated test description<";
      fireEvent.input(editableContent, {
        target: { innerHTML: "Updated test description" },
      });
      fireEvent.blur(editableContent);
    });

    // Wait for debounced update to take effect (250ms delay from TextEditor component)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    // Wait for save button to be enabled
    await waitFor(
      () => {
        const saveButton = screen.getByRole("button", { name: "Save" });
        expect(saveButton).toBeEnabled();
      },
      { timeout: 1000 }
    );

    expect(editableContent).toHaveTextContent("Updated test description");

    // save button
    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).toBeEnabled();
    userEvent.click(saveButton);

    // verifies if success toast message is displayed
    await waitFor(() =>
      expect(screen.getByTestId("risk-adjustment-success")).toBeInTheDocument()
    );
    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    userEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });

    await waitFor(() =>
      expect(mockMeasureServiceApi.updateMeasure).toBeCalledWith({
        ...updatedMeasure,
      })
    );
  });

  it.skip("Should fail an update to risk adjustment values because of unexpected internal server issues", async () => {
    (mockMeasureServiceApi.updateMeasure as jest.Mock).mockRejectedValue({
      status: 500,
      data: null,
    });

    RenderRiskAdjustment();

    // Verifies if RA description already loads values from store and able to update
    const descriptionEditor = screen.getByTestId(
      "risk-adjustment-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();

    const editableContent = within(descriptionEditor).getByRole("textbox");
    expect(editableContent).toHaveAttribute("contenteditable", "true");

    await act(async () => {
      fireEvent.focus(editableContent);
      editableContent.innerHTML = "Updated test description";
      fireEvent.input(editableContent, {
        target: { innerHTML: "Updated test description" },
      });
      fireEvent.blur(editableContent);
    });

    // Wait for debounced update to take effect (250ms delay from TextEditor component)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    // Wait for save button to be enabled
    await waitFor(
      () => {
        const saveButton = screen.getByRole("button", { name: "Save" });
        expect(saveButton).toBeEnabled();
      },
      { timeout: 1000 }
    );

    expect(editableContent).toHaveTextContent("Updated test description");

    // save button
    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).toBeEnabled();
    userEvent.click(saveButton);

    // Should call service with updated data
    await waitFor(() =>
      expect(mockMeasureServiceApi.updateMeasure).toBeCalledWith({
        ...mockTestMeasure,
        riskAdjustmentDescription: "<p>Updated test description</p>",
      })
    );

    // verifies if error toast message is displayed because of service failure
    await waitFor(() =>
      expect(screen.getByTestId("risk-adjustment-error")).toBeInTheDocument()
    );
    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  it.skip("Should not discard changes on click of cancel button on discard model", async () => {
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
    const descriptionEditor = screen.getByTestId(
      "risk-adjustment-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();

    const editableContent = within(descriptionEditor).getByRole("textbox");
    expect(editableContent).toHaveAttribute("contenteditable", "true");

    await act(async () => {
      fireEvent.focus(editableContent);
      editableContent.innerHTML = "Updated test description";
      fireEvent.input(editableContent, {
        target: { innerHTML: "Updated test description" },
      });
      fireEvent.blur(editableContent);
    });

    // Wait for debounced update to take effect (250ms delay from TextEditor component)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
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
    expect(editableContent).toHaveTextContent("Updated test description");
    expect(screen.getByText("+1")).toBeInTheDocument(); // We are limiting the selected options displayed
  });

  it.skip("should reset after discarding changes", async () => {
    RenderRiskAdjustment();

    // Verifies if RA already loads values from store and able to add new
    const descriptionEditor = screen.getByTestId(
      "risk-adjustment-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();

    const editableContent = within(descriptionEditor).getByRole("textbox");
    expect(editableContent).toHaveAttribute("contenteditable", "true");

    await act(async () => {
      fireEvent.focus(editableContent);
      editableContent.innerHTML = "Updated test description";
      fireEvent.input(editableContent, {
        target: { innerHTML: "Updated test description" },
      });
      fireEvent.blur(editableContent);
    });

    // Wait for debounced update to take effect (250ms delay from TextEditor component)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

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
      expect(editableContent).toHaveTextContent("test description");
      expect(
        screen.getByRole("button", { name: "Initial Population" })
      ).toBeInTheDocument();
      expect(screen.queryByText("+1")).not.toBeInTheDocument(); // We are limiting the selected options displayed
    });
  });

  it.skip("should allow users to add and delete a value using the chip delete icon", async () => {
    // Mocking service call to update measure
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
  it("Renders in read only when testCases are locked", async () => {
    RenderRiskAdjustment({ ...props, isTestCaseLocked: true });
    const riskAdjustments = screen.getByRole("textbox", {
      name: "Definition",
    });
    expect(riskAdjustments).toHaveTextContent("Initial Population");

    const descriptionEditor = screen.getByTestId(
      "risk-adjustment-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();

    const allFormFields = screen.getAllByRole("textbox");
    for (const formField of allFormFields) {
      expect(formField).toHaveAttribute("readonly");
    }
  });
  it("displays error alert when locking feature is enabled and test cases get locked during edit", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: true,
    }));
    const checkTestCasesLockStatusMock = jest.fn().mockResolvedValue(true);
    const setAlertMessageMock = jest.fn();
    RenderRiskAdjustment({
      ...props,
      checkTestCasesLockStatus: checkTestCasesLockStatusMock,
      setAlertMessage: setAlertMessageMock,
    });
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

    const saveButton = screen.getByRole("button", {
      name: "Save",
    });
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);
    // Verify error toast appears
    await waitFor(() => {
      const errorToast = screen.getByTestId("risk-adjustment-error");
      expect(errorToast).toBeInTheDocument();
      expect(errorToast).toHaveTextContent(
        "This measure cannot be saved because changes to the Population Criteria will update test cases and one or more test cases are locked by another user."
      );
    });
  });
});
