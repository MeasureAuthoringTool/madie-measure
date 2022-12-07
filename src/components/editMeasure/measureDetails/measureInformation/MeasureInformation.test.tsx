import * as React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import MeasureInformation from "./MeasureInformation";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import { Measure } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import { AxiosError, AxiosResponse } from "axios";
import { parseContent, synchingEditorCqlContent } from "@madie/madie-editor";
import userEvent from "@testing-library/user-event";

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
  elmJson: "{library: TestCqlLibraryName}",
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
    getUserName: jest.fn(() => "john doe"), //#nosec
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
}));

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const axiosError: AxiosError = {
  response: {
    status: 500,
    data: { status: 500, error: "bad test", message: "oh no what happened" },
  } as AxiosResponse,
  toJSON: jest.fn(),
} as unknown as AxiosError;

let serviceApiMock: MeasureServiceApi;

useOktaTokens.mockImplementation(() => ({
  getUserName: () => testUser, // #nosec
}));

describe("MeasureInformation component", () => {
  const { getByTestId, queryByText, findByTestId } = screen;

  it("should regenerate ELM when the CQL Library Name is updated", async () => {
    serviceApiMock = {
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

    await waitFor(() =>
      expect(serviceApiMock.updateMeasure).toBeCalledWith({
        ...testMeasure,
        cqlLibraryName: modifiedLibName,
        elmJson: JSON.stringify({ library: modifiedLibName }),
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
    useOktaTokens.mockImplementationOnce(() => ({
      getUserName: () => "othertestuser@example.com", //#nosec
    }));
    render(<MeasureInformation setErrorMessage={setErrorMessage} />);
    const result: HTMLElement = getByTestId("measure-information-form");
    expect(result).toBeInTheDocument();

    const text = getByTestId("measure-name-input") as HTMLInputElement;
    expect(text.disabled).toBe(false);
    const cqlLibraryNameText = getByTestId(
      "cql-library-name-input"
    ) as HTMLInputElement;
    expect(cqlLibraryNameText.disabled).toBe(false);
    const ecqmTitleText = getByTestId("ecqm-input") as HTMLInputElement;
    expect(ecqmTitleText.disabled).toBe(false);
  });

  it("Discard dialog opens and succeeds", async () => {
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
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
});
