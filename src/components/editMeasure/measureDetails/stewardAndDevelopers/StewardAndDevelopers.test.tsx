import * as React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import StewardAndDevelopers from "./StewardAndDevelopers";
import { Measure } from "@madie/madie-models";
import { useOktaTokens, measureStore } from "@madie/madie-util";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import { act } from "react-dom/test-utils";

const mockHistoryPush = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

jest.mock("../../../../api/useMeasureServiceApi");
const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const organizationList = [
  {
    name: "Net-Integrated Consulting, Inc.",
    oid: "1.2.3.4",
  },
  {
    name: "GE Healthcare",
    oid: "1.2.840.113619",
  },
  {
    name: "The Joint Commission",
    oid: "1.3.6.1.4.1.33895",
  },
  {
    name: "Joint Commission",
    oid: "1.3.6.1.4.1.33895.1.3.0",
  },
];
const testUser = "test user";
const mockMetaData = {
  steward: "GE Healthcare",
  developers: ["GE Healthcare", "Joint Commission"],
  description: "Test Description",
  copyright: "Test Copyright",
  disclaimer: "Test Disclaimer",
  rationale: "Test Rationale",
  guidance: "Test Guidance",
};
const mockMeasure = {
  id: "TestMeasureId",
  measureName: "The Measure for Testing",
  createdBy: testUser,
  measureMetaData: { ...mockMetaData },
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
} as Measure;

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: jest.fn(() => ({
    getUserName: jest.fn(() => "test user"), //#nosec
    getAccessToken: () => "test.jwt",
  })),
  useKeyPress: jest.fn(() => false),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => mockMeasure),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: (set) => {
      set(mockMeasure);
      return { unsubscribe: () => null };
    },
  },
  routeHandlerStore: {
    subscribe: (set) => {
      set(mockMeasure);
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: true, pendingPath: "" },
    initialState: { canTravel: true, pendingPath: "" },
  },
}));

useOktaTokens.mockImplementation(() => ({
  getUserName: () => testUser, // #nosec
}));

let serviceApiMock: MeasureServiceApi;

describe("Steward and Developers component", () => {
  beforeEach(() => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
      getAllOrganizations: jest.fn().mockResolvedValue(organizationList),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
    mockMeasure.measureMetaData = { ...mockMetaData };
  });

  afterEach(() => jest.clearAllMocks());

  it("should render steward and developers form with disabled save and discard buttons", async () => {
    render(<StewardAndDevelopers />);
    expect(await screen.findByTestId("measure-steward-developers-form"));
    expect(screen.getByRole("heading")).toHaveTextContent(
      "Steward & Developers"
    );

    const comboBoxes = await screen.findAllByRole("combobox");
    expect(comboBoxes).toHaveLength(2);

    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    }) as HTMLButtonElement;
    expect(discardButton).toBeDisabled();
    const saveButton = screen.getByRole("button", {
      name: "Save",
    }) as HTMLButtonElement;
    expect(saveButton).toBeDisabled();
  });

  it("should render steward and developers dropdown with organization list", async () => {
    render(<StewardAndDevelopers />);
    const stewardDropDown = await screen.findByTestId("steward");
    fireEvent.keyDown(stewardDropDown, { key: "ArrowDown" });

    const stewardOptions = await screen.findAllByRole("option");
    expect(stewardOptions).toHaveLength(4);

    // equivalent to pressing escape on keyboard
    fireEvent.keyDown(stewardDropDown, {
      key: "Escape",
      code: "Escape",
      charCode: 27,
    });

    const developersDropDown = await screen.findByTestId("developers");
    fireEvent.keyDown(developersDropDown, { key: "ArrowDown" });

    const developersOptions = await screen.findAllByRole("option");
    expect(developersOptions).toHaveLength(4);
  });

  it("should display a toast message if the service fails to fetch organization list", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValue(undefined),
      getAllOrganizations: jest.fn().mockRejectedValue(undefined),
    } as unknown as MeasureServiceApi;

    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
    render(<StewardAndDevelopers />);

    const toastMessage = await screen.findByTestId(
      "steward-and-developers-error"
    );
    expect(toastMessage).toBeInTheDocument();
    expect(toastMessage).toHaveTextContent("Error fetching organizations");

    // verify if the toast message can be closed manually
    fireEvent.click(screen.getByTestId("close-error-button"));
    expect(toastMessage).not.toBeInTheDocument();
  });

  it("should disable dropdowns if the user does not have measure edit permissions", async () => {
    useOktaTokens.mockImplementation(() => ({
      getUserName: () => "Test User 2", //#nosec
    }));

    render(<StewardAndDevelopers />);
    const stewardAutoComplete = await screen.findByTestId("steward");
    const stewardComboBox = await within(stewardAutoComplete).getByRole(
      "combobox"
    );
    await waitFor(() => expect(stewardComboBox).toBeDisabled());

    const developersAutoComplete = await screen.findByTestId("developers");
    const developersComboBox = await within(developersAutoComplete).getByRole(
      "combobox"
    );
    await waitFor(() => expect(developersComboBox).toBeDisabled());
  });

  it("should not disable dropdowns if the measure is shared with the user", async () => {
    useOktaTokens.mockImplementation(() => ({
      getUserName: () => "othertestuser@example.com", //#nosec
    }));
    render(<StewardAndDevelopers />);
    const stewardAutoComplete = await screen.findByTestId("steward");
    const stewardComboBox = await within(stewardAutoComplete).findByRole(
      "combobox"
    );
    await waitFor(() => expect(stewardComboBox).toBeEnabled());

    const developersAutoComplete = await screen.findByTestId("developers");
    const developersComboBox = await within(developersAutoComplete).findByRole(
      "combobox"
    );
    await waitFor(() => expect(developersComboBox).toBeEnabled());
  });

  it("should render steward and developers fields with values from DB", async () => {
    render(<StewardAndDevelopers />);
    const stewardAutoComplete = await screen.findByTestId("steward");
    const stewardComboBox = within(stewardAutoComplete).getByRole("combobox");
    expect(stewardComboBox).toHaveValue("GE Healthcare");

    const developersAutoComplete = await screen.findByTestId("developers");
    const selectedDevelopersOption1 = within(
      developersAutoComplete
    ).queryByRole("button", { name: "GE Healthcare" });
    expect(selectedDevelopersOption1).not.toBe(null);
    const selectedDevelopersOption2 = within(
      developersAutoComplete
    ).queryByRole("button", { name: "Joint Commission" });
    expect(selectedDevelopersOption2).not.toBe(null);
  });

  it.skip("should display validation error messages, if the form is dirty and no options are selected", async () => {
    render(<StewardAndDevelopers />);

    // verify if inline error is displayed if no steward is selected and save button is disabled
    const stewardAutoComplete = await screen.findByTestId("steward");
    fireEvent.mouseOver(stewardAutoComplete);
    const clearStewardButton = await within(stewardAutoComplete).findByTitle(
      "Clear"
    );
    fireEvent.click(clearStewardButton);
    expect(await screen.findByTestId("steward-helper-text")).toHaveTextContent(
      "Steward is required"
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    fireEvent.click(screen.getByTestId("cancel-button")); // revert steward changes

    // verify if inline error is displayed if no developers are selected and save button is disabled
    const developersAutoComplete = await screen.findByTestId("developers");
    fireEvent.mouseOver(developersAutoComplete);
    const clearDevelopersButton = await within(
      developersAutoComplete
    ).findByTitle("Clear");
    fireEvent.click(clearDevelopersButton);

    // Actually save doesn't work, but it needs a clickable component to render helperText.
    const saveButton = await screen.findByRole("button", { name: "Save" });
    fireEvent.click(saveButton);
    const helperText = await screen.findByTestId("developers-helper-text");
    expect(helperText).toHaveTextContent("At least one developer is required");
  });

  it("should enable save and discard button after updating options for steward and Developers", async () => {
    render(<StewardAndDevelopers />);
    // Note that drop down options are alphabetically sorted
    await act(async () => {
      const stewardAutoComplete = await screen.findByTestId("steward");
      fireEvent.keyDown(stewardAutoComplete, { key: "ArrowDown" });
      // selects 2nd option
      const stewardOptions = await screen.findAllByRole("option");
      fireEvent.click(stewardOptions[1]);
      // verifies if the option is selected
      const stewardComboBox = within(stewardAutoComplete).getByRole("combobox");
      expect(stewardComboBox).toHaveValue("Joint Commission");

      const developersAutoComplete = await screen.findByTestId("developers");
      fireEvent.keyDown(developersAutoComplete, { key: "ArrowDown" });

      const developersOptions = await screen.findAllByRole("option");
      // deselecting existing options
      fireEvent.click(developersOptions[0]);
      fireEvent.click(developersOptions[1]);
      // selects 1st & 3rd options
      fireEvent.click(developersOptions[2]);
      fireEvent.click(developersOptions[3]);
      fireEvent.keyDown(developersAutoComplete, {
        key: "Escape",
        code: "Escape",
        charCode: 27,
      });
      // verifies if the options are updated
      const selectedDevelopersOption1 = within(
        developersAutoComplete
      ).queryByRole("button", { name: "Net-Integrated Consulting, Inc." });
      expect(selectedDevelopersOption1).not.toBe(null);
      const selectedDevelopersOption2 = within(
        developersAutoComplete
      ).queryByRole("button", { name: "The Joint Commission" });
      expect(selectedDevelopersOption2).not.toBe(null);

      const saveButton = await screen.findByRole("button", { name: "Save" });
      expect(saveButton).toBeEnabled();
      fireEvent.click(saveButton);
    });

    expect(serviceApiMock.updateMeasure).toHaveBeenCalledWith({
      ...mockMeasure,
      measureMetaData: {
        ...mockMetaData,
        steward: "Joint Commission",
        developers: ["Net-Integrated Consulting, Inc.", "The Joint Commission"],
      },
    });

    expect(
      await screen.findByTestId("steward-and-developers-success")
    ).toHaveTextContent(
      "Steward and Developers Information Saved Successfully"
    );
  });

  it("should display error message in toast, if update to measure fails", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockRejectedValue(undefined),
      getAllOrganizations: jest.fn().mockResolvedValue(organizationList),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

    render(<StewardAndDevelopers />);
    await act(async () => {
      const stewardAutoComplete = await screen.findByTestId("steward");
      fireEvent.keyDown(stewardAutoComplete, { key: "ArrowDown" });
      // selects 2nd option
      const stewardOptions = await screen.findAllByRole("option");
      fireEvent.click(stewardOptions[1]);
      // verifies if the option is selected
      const stewardComboBox = within(stewardAutoComplete).getByRole("combobox");
      expect(stewardComboBox).toHaveValue("Joint Commission");

      const saveButton = await screen.findByRole("button", { name: "Save" });
      expect(saveButton).toBeEnabled();
      fireEvent.click(saveButton);
    });

    const toastMessage = await screen.findByTestId(
      "steward-and-developers-error"
    );
    expect(toastMessage).toBeInTheDocument();
    expect(toastMessage).toHaveTextContent("Error updating measure");
  });

  it("should discard changes by click discard changes button", async () => {
    render(<StewardAndDevelopers />);

    // verifies if the fields are populated with existing data
    const stewardAutoComplete = await screen.findByTestId("steward");
    const stewardComboBox = within(stewardAutoComplete).getByRole("combobox");
    expect(stewardComboBox).toHaveValue("GE Healthcare");

    fireEvent.keyDown(stewardAutoComplete, { key: "ArrowDown" });
    // selects 2nd option
    const stewardOptions = await screen.findAllByRole("option");
    fireEvent.click(stewardOptions[1]);

    // verifies that the value is updated
    expect(stewardComboBox).toHaveValue("Joint Commission");

    fireEvent.click(screen.getByTestId("cancel-button")); // revert steward changes

    expect(
      await screen.findByRole("button", { name: "Yes, Discard All Changes" })
    ).toBeEnabled();
    expect(
      await screen.findByRole("button", { name: "No, Keep Working" })
    ).toBeEnabled();

    fireEvent.click(
      await screen.findByRole("button", { name: "Yes, Discard All Changes" })
    );
    expect(stewardComboBox).toHaveValue("GE Healthcare");
  });
});
