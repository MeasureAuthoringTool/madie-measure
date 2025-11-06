import * as React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Measure } from "@madie/madie-models";
import {
  ServiceConfig,
  ApiContextProvider,
} from "../../../../../api/ServiceContext";

import {
  checkUserCanEdit,
  MeasureServiceApi,
  useFeatureFlags,
  measureStore,
} from "@madie/madie-util";
import SupplementalData, { SupplementalDataProps } from "./SupplementalData";
import { QdmMeasureCQL } from "../../../../common/QdmMeasureCQL";

const serviceConfig = {
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
} as ServiceConfig;

const mockTestMeasure = {
  id: "test measure",
  createdBy: "matt",
  model: "QDM v5.6",
  measureName: "the measure for testing",
  cqlLibraryName: "TestCqlLibraryName",
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/01/2022",
  measurementPeriodEnd: "12/02/2022",
  measureSetId: "testMeasureId",
  cql: QdmMeasureCQL,
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
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),

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

const props: SupplementalDataProps = {
  setAlertMessage: jest.fn,
  isTestCaseLocked: false,
  checkTestCasesLockStatus: jest.fn(),
};
const RenderSupplementalElements = (customProps = props) => {
  const mergedProps = { ...props, ...customProps };
  return render(
    <ApiContextProvider value={serviceConfig}>
      <SupplementalData {...mergedProps} />
    </ApiContextProvider>
  );
};

describe("SupplementalData Component QDM", () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it("Should render Supplemental Data component with the values saved in DB", async () => {
    RenderSupplementalElements();
    const suppolementalElementsSelect = screen.getByTestId(
      "supplemental-data-dropdown"
    );
    expect(suppolementalElementsSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();

    const descriptionEditor = screen.getByTestId(
      "supplemental-data-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();
    const editor = screen.getByRole("textbox");
    expect(editor).toHaveAttribute("contenteditable", "true");
    expect(editor).toHaveTextContent("test description");
  });

  it("Should render disabled components if the user doesn't have permissions", async () => {
    checkUserCanEdit.mockReturnValue(false);
    RenderSupplementalElements();
    const supplementalElements = screen.getByRole("textbox", {
      name: "Definition",
    });
    expect(supplementalElements).toHaveTextContent("Initial Population");

    const descriptionEditor = screen.getByTestId(
      "supplemental-data-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();

    const content = within(descriptionEditor).getByTestId(
      "supplementalDataDescription-value"
    );
    expect(content).toHaveTextContent("test description");

    const allFormFields = screen.getAllByRole("textbox");
    for (const formField of allFormFields) {
      expect(formField).toHaveAttribute("readonly");
    }
  });

  it("Should successfully update supplemental Elements values and save to DB", async () => {
    checkUserCanEdit.mockReturnValue(true);
    // Mocking service call to update measure
    const newSupplementalData = [
      {
        definition: "Initial Population",
        description: "",
      },
      {
        definition: "SDE Ethnicity",
        description: "",
      },
    ];
    const newSupplementalDataDescription = "<p>Updated test description</p>";
    const updatedMeasure = {
      ...mockTestMeasure,
      supplementalData: newSupplementalData,
      supplementalDataDescription: newSupplementalDataDescription,
    };
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200, data: updatedMeasure });

    RenderSupplementalElements();

    // Verifies if SE already loads values from store and able to add new
    const supplementalElementsSelect = screen.getByTestId(
      "supplemental-data-dropdown"
    );
    expect(supplementalElementsSelect).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Initial Population" })
    ).toBeInTheDocument();
    const supplementalDataButton = within(
      supplementalElementsSelect
    ).getByTitle("Open");

    userEvent.click(supplementalDataButton);
    await waitFor(() => {
      userEvent.click(screen.getByText("SDE Ethnicity"));
    });
    expect(
      screen.getByRole("button", { name: "SDE Ethnicity" })
    ).toBeInTheDocument();

    // Verifies if SD description already loads values from store and able to update
    const descriptionEditor = screen.getByTestId(
      "supplemental-data-description-rich-text-editor"
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

    expect(descriptionEditor).toHaveTextContent("Updated test description");

    // save button
    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).toBeEnabled();
    userEvent.click(saveButton);

    // verifies if success toast message is displayed
    await waitFor(() =>
      expect(
        screen.getByTestId("supplemental-data-success")
      ).toBeInTheDocument()
    );
    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });

    await waitFor(() =>
      expect(mockMeasureServiceApi.updateMeasure).toBeCalledWith({
        ...updatedMeasure,
      })
    );
  });

  it("Should fail an update to supplemental data values because of unexpected internal server issues", async () => {
    checkUserCanEdit.mockReturnValue(true);

    // Mock API to simulate server error
    const failureMessage = "Internal Server Error";
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockRejectedValueOnce(failureMessage);

    RenderSupplementalElements();

    // Add a new supplemental data element
    const supplementalDataDropdown = screen.getByTestId(
      "supplemental-data-dropdown"
    );
    expect(supplementalDataDropdown).toBeInTheDocument();
    const openButton = within(supplementalDataDropdown).getByTitle("Open");
    userEvent.click(openButton);

    const ethnicityOption = screen.getByText("SDE Ethnicity");
    expect(ethnicityOption).toBeInTheDocument();
    userEvent.click(ethnicityOption);

    let editor = within(
      screen.getByTestId("supplemental-data-description-rich-text-editor")
    ).getByRole("textbox");
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute("contenteditable", "true");
    fireEvent.input(editor, {
      target: { textContent: "Updated test description" },
    });

    expect(editor).toHaveTextContent("Updated test description");

    // Wait for save button to be enabled
    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: "Save" });
      expect(saveButton).toBeEnabled();
    });

    // Save changes
    const saveButton = screen.getByRole("button", { name: "Save" });
    await act(async () => {
      userEvent.click(saveButton);
    });

    // Verify error toast appears
    await waitFor(() => {
      const errorToast = screen.getByTestId("supplemental-data-error");
      expect(errorToast).toBeInTheDocument();
      expect(errorToast).toHaveTextContent(
        `Error updating measure "the measure for testing": ${failureMessage}`
      );
    });
  });

  it("Should not discard changes on click of cancel button on discard model", async () => {
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
      userEvent.click(screen.getByText("SDE Ethnicity"));
    });
    userEvent.click(supplementalDataButton); // To collapse the dropdown
    expect(
      screen.getByRole("button", { name: "SDE Ethnicity" })
    ).toBeInTheDocument();

    let editor = within(
      screen.getByTestId("supplemental-data-description-rich-text-editor")
    ).getByRole("textbox");
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute("contenteditable", "true");
    fireEvent.input(editor, {
      target: { textContent: "Updated test description" },
    });

    expect(editor).toHaveTextContent("Updated test description");

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
    expect(editor).toHaveTextContent("Updated test description");
    expect(screen.getByText("+1")).toBeInTheDocument(); // We are limiting the selected options displayed
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
      userEvent.click(screen.getByText("SDE Ethnicity"));
    });
    userEvent.click(supplementalDataButton); // To collapse the dropdown
    expect(
      screen.getByRole("button", { name: "SDE Ethnicity" })
    ).toBeInTheDocument();

    // Verifies if SD description already loads values from store and able to update
    let editor = within(
      screen.getByTestId("supplemental-data-description-rich-text-editor")
    ).getByRole("textbox");
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute("contenteditable", "true");
    fireEvent.input(editor, {
      target: { textContent: "Updated test description" },
    });

    expect(editor).toHaveTextContent("Updated test description");

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
      expect(editor).toHaveTextContent("test description");
      expect(
        screen.getByRole("button", { name: "Initial Population" })
      ).toBeInTheDocument();
      expect(screen.queryByText("+1")).not.toBeInTheDocument(); // We are limiting the selected options displayed
    });
  });

  it("Renders in read only when testCases are locked", async () => {
    RenderSupplementalElements({ ...props, isTestCaseLocked: true });
    const supplementalElements = screen.getByRole("textbox", {
      name: "Definition",
    });
    expect(supplementalElements).toHaveTextContent("Initial Population");

    const descriptionEditor = screen.getByTestId(
      "supplemental-data-description-rich-text-editor"
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
    RenderSupplementalElements({
      ...props,
      checkTestCasesLockStatus: checkTestCasesLockStatusMock,
      setAlertMessage: setAlertMessageMock,
    });

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
      const errorToast = screen.getByTestId("supplemental-data-error");
      expect(errorToast).toBeInTheDocument();
      expect(errorToast).toHaveTextContent(
        "This measure cannot be saved because changes to the Population Criteria will update test cases and one or more test cases are locked by another user."
      );
    });
  });

  it("Should render disabled components if the measure is locked", async () => {
    checkUserCanEdit.mockReturnValue(true);
    const lockedMeasure = {
      ...mockTestMeasure,
      measureLock: { lockedBy: "anotherUser" },
    };
    measureStore.state.mockImplementation(() => lockedMeasure);
    measureStore.initialState.mockImplementation(() => lockedMeasure);
    RenderSupplementalElements();
    const supplementalElements = screen.getByRole("textbox", {
      name: "Definition",
    });
    expect(supplementalElements).toHaveTextContent("Initial Population");

    const descriptionEditor = screen.getByTestId(
      "supplemental-data-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();

    const content = within(descriptionEditor).getByTestId(
      "supplementalDataDescription-value"
    );
    expect(content).toHaveTextContent("test description");

    const allFormFields = screen.getAllByRole("textbox");
    for (const formField of allFormFields) {
      expect(formField).toHaveAttribute("readonly");
    }
  });
});
