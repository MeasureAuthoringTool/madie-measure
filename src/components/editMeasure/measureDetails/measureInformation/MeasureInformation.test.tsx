import * as React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  within,
} from "@testing-library/react";
import { act } from "react-dom/test-utils";
import MeasureInformation from "./MeasureInformation";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import { Measure } from "@madie/madie-models";
import { AxiosError, AxiosResponse } from "axios";
import { parseContent, synchingEditorCqlContent } from "@madie/madie-editor";
import userEvent from "@testing-library/user-event";
import { checkUserCanEdit } from "@madie/madie-util";

const mockHistoryPush = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

jest.mock("../../../../api/useMeasureServiceApi");
const setErrorMessage = jest.fn();
const testUser = "john doe";
const measure = {
  id: "test measure",
  measureName: "the measure for testing",
  cqlLibraryName: "TestCqlLibraryName",
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/01/2022",
  measurementPeriodEnd: "12/02/2022",
  createdBy: "john doe",
  measureSetId: "testMeasureId",
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
  programUseContext: {
    code: "ep-ec",
    display: "EP/EC",
    codeSystem:
      "http://hl7.org/fhir/us/cqfmeasures/CodeSystem/quality-programs",
  },
  elmJson: "{library: TestCqlLibraryName}",
  measureMetaData: {
    experimental: false,
    endorsements: [
      {
        endorsementId: "NQF",
        endorser: "1234",
      },
    ],
  },
} as unknown as Measure;

jest.mock("@madie/madie-editor", () => ({
  synchingEditorCqlContent: jest.fn().mockResolvedValue("modified cql"),
  parseContent: jest.fn(() => []),
  validateContent: jest.fn().mockResolvedValue({
    errors: [],
    translation: { library: "NewLibName" },
  }),
}));

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
  useKeyPress: jest.fn(() => false),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => measure),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: (set) => {
      // set(measure)
      return { unsubscribe: () => null };
    },
  },
  routeHandlerStore: {
    subscribe: (set) => {
      set(measure);
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: true, pendingPath: "" },
    initialState: { canTravel: true, pendingPath: "" },
  },
  PROGRAM_USE_CONTEXTS: [
    {
      code: "mips",
      display: "MIPS",
      codeSystem:
        "http://hl7.org/fhir/us/cqfmeasures/CodeSystem/quality-programs",
    },
    {
      code: "ep-ec",
      display: "EP/EC",
      codeSystem:
        "http://hl7.org/fhir/us/cqfmeasures/CodeSystem/quality-programs",
    },
  ],
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
}));

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const endorserList = [
  {
    endorserOrganization: "-",
  },
  {
    endorserOrganization: "NQF",
  },
];

const axiosError: AxiosError = {
  response: {
    status: 500,
    data: { status: 500, error: "bad test", message: "oh no what happened" },
  } as AxiosResponse,
  toJSON: jest.fn(),
} as unknown as AxiosError;

let serviceApiMock: MeasureServiceApi;

describe("MeasureInformation component", () => {
  beforeEach(() => {
    serviceApiMock = {
      getAllEndorsers: jest.fn().mockResolvedValue(endorserList),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
  });
  const { getByTestId, queryByText, findByTestId, getByRole, getByText } =
    screen;

  it("should regenerate ELM when the CQL Library Name is updated", async () => {
    serviceApiMock = {
      getAllEndorsers: jest.fn().mockResolvedValue(endorserList),
      updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

    const testMeasure = {
      ...measure,
      versionId: "test measure",
      measureId: undefined,
      cql: "modified cql",
    } as unknown as Measure;

    render(<MeasureInformation setErrorMessage={setErrorMessage} />);

    const cqlLibraryName = (await screen.findByRole("textbox", {
      name: "Measure CQL Library Name",
    })) as HTMLInputElement;
    expect(cqlLibraryName.value).toEqual(testMeasure.cqlLibraryName);

    const modifiedLibName = "NewLibName";
    userEvent.clear(cqlLibraryName);
    userEvent.type(cqlLibraryName, modifiedLibName);
    expect(cqlLibraryName.value).not.toEqual(testMeasure.cqlLibraryName);
    expect(cqlLibraryName.value).toEqual(modifiedLibName);

    const saveButton = await screen.findByRole("button", { name: "Save" });
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());

    userEvent.click(saveButton);
    await waitFor(() => expect(synchingEditorCqlContent).toBeCalled());
    await waitFor(() => expect(parseContent).toBeCalled());

    expect(
      await screen.findByText("Measurement Information Updated Successfully")
    ).toBeInTheDocument();

    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    act(() => {
      fireEvent.click(toastCloseButton);
    });
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });

    await waitFor(() =>
      expect(serviceApiMock.updateMeasure).toBeCalledWith({
        ...testMeasure,
        cqlLibraryName: modifiedLibName,
        elmJson: JSON.stringify({ library: modifiedLibName }),
        // This can be removed after MAT-5396
        measureMetaData: {
          experimental: false,
          endorsements: [
            {
              // endorsementId: undefined,
              // endorser: undefined,
              endorsementId: "NQF",
              endorser: "1234",
            },
          ],
        },
      })
    );
  });

  it("should render the component with measure's information populated", async () => {
    render(<MeasureInformation setErrorMessage={setErrorMessage} />);

    const result: HTMLElement = getByTestId("measure-information-form");
    expect(result).toBeInTheDocument();

    await act(async () => {
      const text = getByTestId("measure-name-input") as HTMLInputElement;
      expect(text.value).toBe(measure.measureName);
      const measureId = getByTestId("measure-id-input") as HTMLInputElement;
      expect(measureId.value).toBe(measure.measureSetId);
      expect(measureId).toHaveProperty("readOnly", true);
      const versionId = getByTestId("version-id-input") as HTMLInputElement;
      expect(versionId.value).toBe(measure.id);
      expect(versionId).toHaveProperty("readOnly", true);
      const cmsId = getByTestId("cms-id-input") as HTMLInputElement;
      expect(cmsId.value).toBe("");
      expect(cmsId).toHaveProperty("readOnly", true);
      const cqlLibraryNameText = getByTestId(
        "cql-library-name-input"
      ) as HTMLInputElement;
      expect(cqlLibraryNameText.value).toBe(measure.cqlLibraryName);
      const ecqmTitleText = getByTestId("ecqm-input") as HTMLInputElement;
      expect(ecqmTitleText.value).toBe(measure.ecqmTitle);

      const experimentalInput = screen.getByRole("checkbox", {
        name: "Experimental",
      }) as HTMLInputElement;
      expect(experimentalInput.value).toBe("false");
    });
  });

  it("Should display measure Version ID when it is not null", async () => {
    measure.versionId = "testVersionId";
    render(<MeasureInformation setErrorMessage={setErrorMessage} />);

    const result: HTMLElement = getByTestId("measure-information-form");
    expect(result).toBeInTheDocument();

    await act(async () => {
      const text = getByTestId("measure-name-input") as HTMLInputElement;
      expect(text.value).toBe(measure.measureName);
      const versionId = getByTestId("version-id-input") as HTMLInputElement;
      expect(versionId.value).toBe(measure.versionId);
      expect(versionId).toHaveProperty("readOnly", true);
    });
  });

  it("should render the component with a blank measure name", async () => {
    measure.measureName = "";
    render(<MeasureInformation setErrorMessage={setErrorMessage} />);
    const result: HTMLElement = getByTestId("measure-information-form");
    expect(result).toBeInTheDocument();
    await act(async () => {
      const text = getByTestId("measure-name-input") as HTMLInputElement;
      expect(text.value).toBe("");
    });
  });

  it("Check if the measurement information save button is present", () => {
    render(<MeasureInformation setErrorMessage={setErrorMessage} />);
    const result: HTMLElement = getByTestId(
      "measurement-information-save-button"
    );
    expect(result).toBeInTheDocument();
  });

  it("saving measurement information successfully and displaying success message", async () => {
    serviceApiMock = {
      getAllEndorsers: jest.fn().mockResolvedValue(endorserList),
      updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
    measure.measureName = "";

    render(<MeasureInformation setErrorMessage={setErrorMessage} />);

    await act(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });
      const createBtn = getByTestId("measurement-information-save-button");
      expect(createBtn).toBeEnabled();
      act(() => {
        fireEvent.click(createBtn);
      });
    });

    await waitFor(
      () =>
        expect(
          getByTestId("edit-measure-information-success-text")
        ).toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );
  });

  it("should display error message when updating failed", async () => {
    serviceApiMock = {
      getAllEndorsers: jest.fn().mockResolvedValue(endorserList),
      updateMeasure: jest.fn().mockRejectedValueOnce({
        status: 500,
        response: { data: { message: "update failed" } },
      }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

    measure.measureName = "";
    render(<MeasureInformation setErrorMessage={setErrorMessage} />);

    await act(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });

      const createBtn = getByTestId("measurement-information-save-button");
      expect(createBtn).toBeEnabled();
      act(() => {
        fireEvent.click(createBtn);
      });
    });

    await waitFor(() => expect(setErrorMessage).toHaveBeenCalled(), {
      timeout: 5000,
    });
  });

  it("Should be editable if measure is shared with the user", () => {
    render(<MeasureInformation setErrorMessage={setErrorMessage} />);
    const result: HTMLElement = getByTestId("measure-information-form");
    expect(result).toBeInTheDocument();

    const measureNameInput = getByTestId(
      "measure-name-input"
    ) as HTMLInputElement;
    expect(measureNameInput).toBeEnabled();

    const cqlLibraryNameText = getByTestId(
      "cql-library-name-input"
    ) as HTMLInputElement;
    expect(cqlLibraryNameText).toBeEnabled();

    const ecqmTitleText = getByTestId("ecqm-input") as HTMLInputElement;
    expect(ecqmTitleText).toBeEnabled();

    const experimentalInput = screen.getByRole("checkbox", {
      name: "Experimental",
    }) as HTMLInputElement;
    expect(experimentalInput).toBeEnabled();
    expect(experimentalInput.value).toBe("false");
    userEvent.click(experimentalInput);
    expect(experimentalInput.value).toBe("true");

    const endorser = getByTestId("endorser") as HTMLInputElement;
    expect(endorser).toBeEnabled();
  });

  it("Should disable all elements if measure is not shared with the user", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return false;
    });
    await act(async () => {
      render(<MeasureInformation setErrorMessage={setErrorMessage} />);
      const result: HTMLElement = getByTestId("measure-information-form");
      expect(result).toBeInTheDocument();

      const measureNameInput = getByTestId(
        "measure-name-input"
      ) as HTMLInputElement;
      expect(measureNameInput).toBeDisabled();

      const cqlLibraryNameText = getByTestId(
        "cql-library-name-input"
      ) as HTMLInputElement;
      expect(cqlLibraryNameText).toBeDisabled();

      const ecqmTitleText = getByTestId("ecqm-input") as HTMLInputElement;
      expect(ecqmTitleText).toBeDisabled();

      const experimentalInput = screen.getByRole("checkbox", {
        name: "Experimental",
      }) as HTMLInputElement;
      expect(experimentalInput).toBeDisabled();

      const endorserAutoComplete = getByTestId("endorser") as HTMLInputElement;
      const endorserComboBox =
        within(endorserAutoComplete).getByRole("combobox");
      expect(endorserComboBox).toBeDisabled();

      const endorserId = getByTestId(
        "endorsement-number-input"
      ) as HTMLInputElement;
      expect(endorserId).toBeDisabled();
    });
  });

  test("Click on dropdown displays different options", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });
    render(<MeasureInformation setErrorMessage={setErrorMessage} />);

    const programUseContextSelect = screen.getByTestId("programUseContext");
    expect(programUseContextSelect).toBeInTheDocument();
    const programUseContextButton = within(programUseContextSelect).getByRole(
      "button",
      {
        name: "Open",
      }
    );

    act(() => {
      userEvent.click(programUseContextButton);
    });

    expect(getByText("MIPS")).toBeInTheDocument();
    expect(getByText("EP/EC")).toBeInTheDocument();
  });
  test("Click Clear icon clears selected value and Discard and Save buttons are disabled", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });
    render(<MeasureInformation setErrorMessage={setErrorMessage} />);

    const programUseContextSelect = getByTestId("programUseContext");
    expect(programUseContextSelect).toBeInTheDocument();
    const programUseContextButton = within(programUseContextSelect).getByRole(
      "button",
      {
        name: "Open",
      }
    );

    act(() => {
      userEvent.click(programUseContextButton);
    });

    expect(getByText("MIPS")).toBeInTheDocument();
    expect(getByText("EP/EC")).toBeInTheDocument();
    const programUseContextOptions = await screen.findAllByRole("option");
    expect(programUseContextOptions.length).toBe(2);

    const programUseContextComboBox = within(programUseContextSelect).getByRole(
      "combobox"
    );
    expect(programUseContextComboBox).toHaveValue("EP/EC");

    const closeIcon = within(programUseContextSelect).getByTestId("CloseIcon");
    act(() => {
      userEvent.click(closeIcon);
    });
    expect(programUseContextComboBox).not.toHaveValue("EP/EC");
  });
  test("Click Save button will save the change", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });
    render(<MeasureInformation setErrorMessage={setErrorMessage} />);

    const programUseContextSelect = getByTestId("programUseContext");
    expect(programUseContextSelect).toBeInTheDocument();
    const programUseContextButton = within(programUseContextSelect).getByRole(
      "button",
      {
        name: "Open",
      }
    );

    act(() => {
      userEvent.click(programUseContextButton);
    });

    expect(getByText("MIPS")).toBeInTheDocument();
    expect(getByText("EP/EC")).toBeInTheDocument();
    const programUseContextOptions = await screen.findAllByRole("option");
    expect(programUseContextOptions.length).toBe(2);

    const programUseContextComboBox = within(programUseContextSelect).getByRole(
      "combobox"
    );
    expect(programUseContextComboBox).toHaveValue("EP/EC");

    const changed = screen.getByText("MIPS");

    act(() => {
      userEvent.click(changed);
    });
    expect(programUseContextComboBox).not.toHaveValue("EP/EC");
    expect(programUseContextComboBox).toHaveValue("MIPS");

    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    }) as HTMLButtonElement;
    expect(discardButton).toBeEnabled();
    const saveButton = screen.getByRole("button", {
      name: "Save",
    }) as HTMLButtonElement;
    expect(saveButton).toBeEnabled();
    act(() => {
      fireEvent.click(saveButton);
    });
  });
  it("Discard dialog opens and succeeds", async () => {
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });
    measure.measureName = "";
    render(<MeasureInformation setErrorMessage={setErrorMessage} />);
    await act(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });
    });
    const cancelButton = getByTestId("cancel-button");
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();
    fireEvent.click(cancelButton);
    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const continueButton = await screen.getByTestId(
      "discard-dialog-continue-button"
    );
    expect(continueButton).toBeInTheDocument();
    fireEvent.click(continueButton);
    await waitFor(() => {
      // check for old value
      const input = getByTestId("measure-name-input");
      expect(input.value).toBe("");
    });
  });

  it("Discard dialog opens and cancels", async () => {
    measure.measureName = "";
    render(<MeasureInformation setErrorMessage={setErrorMessage} />);
    await act(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });
    });
    const cancelButton = getByTestId("cancel-button");
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();
    fireEvent.click(cancelButton);
    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    expect(queryByText("You have unsaved changes.")).toBeVisible();
    const discardDialogCancelButton = screen.getByTestId(
      "discard-dialog-cancel-button"
    );
    expect(discardDialogCancelButton).toBeInTheDocument();
    fireEvent.click(discardDialogCancelButton);
    await waitFor(() => {
      expect(queryByText("You have unsaved changes.")).not.toBeVisible();
    });
  });

  it("should render endorser dropdown with endorser list", async () => {
    render(<MeasureInformation setErrorMessage={setErrorMessage} />);
    const endorserDropDown = await screen.findByTestId("endorser");
    fireEvent.keyDown(endorserDropDown, { key: "ArrowDown" });

    const endorserOptions = await screen.findAllByRole("option");
    expect(endorserOptions).toHaveLength(2);

    // equivalent to pressing escape on keyboard
    fireEvent.keyDown(endorserDropDown, {
      key: "Escape",
      code: "Escape",
      charCode: 27,
    });
  });

  it("should disable endorserId when endorser is unselected", async () => {
    checkUserCanEdit.mockImplementationOnce(() => true);
    await act(async () => {
      render(<MeasureInformation setErrorMessage={setErrorMessage} />);
      const endorserAutoComplete = await screen.findByTestId("endorser");
      const endorserId = getByTestId(
        "endorsement-number-input"
      ) as HTMLInputElement;

      fireEvent.keyDown(endorserAutoComplete, { key: "ArrowDown" });
      // selects 2nd option
      const endorserOptions = await screen.findAllByRole("option");
      fireEvent.click(endorserOptions[1]);

      // verifies if the option is selected
      const endorserComboBox =
        within(endorserAutoComplete).getByRole("combobox");
      expect(endorserComboBox).toHaveValue("NQF");
      //verifies endorserId was enabled
      expect(endorserId).toBeEnabled();
      //Add input for endorserId
      fireEvent.change(endorserId, {
        target: { value: "1234" },
      });
      expect(endorserId).not.toHaveValue("");

      // select 1st option
      fireEvent.keyDown(endorserAutoComplete, { key: "ArrowDown" });
      const endorserOptions2 = await screen.findAllByRole("option");
      fireEvent.click(endorserOptions2[0]);

      // verifies if the option is selected and endorserId has been cleared and disabled
      //expect(endorserComboBox).toHaveValue("-");
      expect(endorserComboBox).toHaveValue("");
      expect(endorserId).toBeDisabled();
      expect(endorserId).toHaveValue("");
    });
  });

  it("Toast error shows when endorsing organization is not null and endorsement Id is empty", async () => {
    checkUserCanEdit.mockImplementationOnce(() => true);
    await act(async () => {
      render(<MeasureInformation setErrorMessage={setErrorMessage} />);
      const endorserAutoComplete = await screen.findByTestId("endorser");
      const endorserId = getByTestId(
        "endorsement-number-input"
      ) as HTMLInputElement;

      fireEvent.keyDown(endorserAutoComplete, { key: "ArrowDown" });
      // selects 2nd option
      const endorserOptions = await screen.findAllByRole("option");
      fireEvent.click(endorserOptions[1]);

      // verifies if the option is selected
      const endorserComboBox =
        within(endorserAutoComplete).getByRole("combobox");
      expect(endorserComboBox).toHaveValue("NQF");
      //verifies endorserId was enabled
      expect(endorserId).toBeEnabled();
      //clear endorserId
      fireEvent.change(endorserId, {
        target: { value: "" },
      });
      expect(endorserId).toHaveValue("");

      const saveButton = await screen.findByRole("button", { name: "Save" });
      expect(saveButton).toBeInTheDocument();
      await waitFor(() => expect(saveButton).toBeEnabled());

      userEvent.click(saveButton);

      setTimeout(() => {
        expect(
          screen.findByText("Endorser Number is Required")
        ).toBeInTheDocument();
      }, 1000);
    });
  });

  it("Toast error shows when endorsement Id is not alphanumeric", async () => {
    checkUserCanEdit.mockImplementationOnce(() => true);
    await act(async () => {
      render(<MeasureInformation setErrorMessage={setErrorMessage} />);
      const endorserAutoComplete = await screen.findByTestId("endorser");
      const endorserId = getByTestId(
        "endorsement-number-input"
      ) as HTMLInputElement;

      fireEvent.keyDown(endorserAutoComplete, { key: "ArrowDown" });
      // selects 2nd option
      const endorserOptions = await screen.findAllByRole("option");
      fireEvent.click(endorserOptions[1]);

      // verifies if the option is selected
      const endorserComboBox =
        within(endorserAutoComplete).getByRole("combobox");
      expect(endorserComboBox).toHaveValue("NQF");
      //verifies endorserId was enabled
      expect(endorserId).toBeEnabled();
      //change endorserId
      fireEvent.change(endorserId, {
        target: { value: "test 1" },
      });
      expect(endorserId).toHaveValue("test 1");

      const saveButton = await screen.findByRole("button", { name: "Save" });
      expect(saveButton).toBeInTheDocument();
      await waitFor(() => expect(saveButton).toBeEnabled());

      userEvent.click(saveButton);

      setTimeout(() => {
        expect(
          screen.findByText("Endorser Number must be alpha numeric")
        ).toBeInTheDocument();
      }, 1000);
    });
  });
});
