import * as React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  within,
} from "@testing-library/react";
import { act } from "react-dom/test-utils";
import ModelAndMeasurementPeriod from "./ModelAndMeasurementPeriod";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import { Measure } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";
import { useOktaTokens } from "@madie/madie-util";
import { AxiosError, AxiosResponse } from "axios";

const mockHistoryPush = jest.fn();
const setErrorMessage = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

jest.mock("../../../../api/useMeasureServiceApi");

const testUser = "john doe";
const measure = {
  id: "test measure",
  model: "QI-Core v4.1.1",
  measureName: "the measure for testing",
  cqlLibraryName: "TestCqlLibraryName",
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/01/2022",
  measurementPeriodEnd: "12/02/2022",
  createdBy: "john doe",
  measureSetId: "testMeasureId",
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
} as unknown as Measure;

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

describe("Model and Measurement Period component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const { getByTestId, queryByText } = screen;

  it("should render the component with measure's information populated", async () => {
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);

    const result: HTMLElement = getByTestId("model-measurement-form");
    expect(result).toBeInTheDocument();

    await act(async () => {
      const measurementPeriodStartNode = getByTestId(
        "measurement-period-start"
      );
      const measurementPeriodStartInput = within(
        measurementPeriodStartNode
      ).getByRole("textbox") as HTMLInputElement;
      expect(measurementPeriodStartInput.value).toBe(
        measure.measurementPeriodStart
      );
      const measurementPeriodEndNode = getByTestId("measurement-period-end");
      const measurementPeriodEndInput = within(
        measurementPeriodEndNode
      ).getByRole("textbox") as HTMLInputElement;
      expect(measurementPeriodEndInput.value).toBe(
        measure.measurementPeriodEnd
      );
    });
  });

  it("saving measurement information successfully and displaying success message", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodStartInput, "12/07/2009");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/2009")
      );
    });
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2020");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2020")
    );

    const createBtn = getByTestId("model-and-measurement-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toBeEnabled();
    act(() => {
      fireEvent.click(createBtn);
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

  it("saving measurement information fails and displays error message", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockRejectedValueOnce({
        status: 500,
        response: { data: { message: "update failed" } },
      }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodStartInput, "12/07/2009");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/2009")
      );
    });
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2020");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2020")
    );

    const createBtn = getByTestId("model-and-measurement-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toBeEnabled();
    act(() => {
      fireEvent.click(createBtn);
    });
    await waitFor(() => expect(setErrorMessage).toHaveBeenCalled(), {
      timeout: 5000,
    });
  });

  it("should render the component with a blank measure name", async () => {
    measure.measureName = "";
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    const result: HTMLElement = getByTestId("model-measurement-form");
    expect(result).toBeInTheDocument();
    await act(async () => {
      const text = getByTestId("model-id-input") as HTMLInputElement;
      expect(text.value).toBe("QI-Core v4.1.1");
    });
  });

  it("Check if the measurement information save button is present", () => {
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    const result: HTMLElement = getByTestId(
      "model-and-measurement-save-button"
    );
    expect(result).toBeInTheDocument();
  });

  it("Check if measurement start field is present in the form", async () => {
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    const result = getByTestId("model-measurement-form");
    expect(result).toBeInTheDocument();
    await act(async () => {
      const measurementPeriodStart: HTMLElement = getByTestId(
        "measurement-period-start"
      );
      expect(measurementPeriodStart).toBeInTheDocument();
    });
  });

  it("Check if measurement start date field updates input as expected", async () => {
    measure.measurementPeriodStart = null;
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox");

    userEvent.type(measurementPeriodStartInput, "12/07/2001");
    expect(measurementPeriodStartInput.value).toBe("12/07/2001");

    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/2001")
      );
    });
  });

  it("Check if measurement end date field has expected value", async () => {
    measure.measurementPeriodEnd = null;
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2009");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2009")
    );
  });

  it("Check if measurement period save button is disabled when measurement period start and end date have same values", async () => {
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodStartInput, "12/07/2009");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/2009")
      );
    });
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2009");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2009")
    );

    const createBtn = getByTestId("model-and-measurement-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).not.toBeEnabled();
  });

  it("Check if measurement period save button is disabled when measurement period end date is less than start date", async () => {
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    await act(async () => {
      const text = getByTestId("model-id-input") as HTMLInputElement;
      expect(text.value).toBe("QI-Core v4.1.1");
    });
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodStartInput, "12/07/2009");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/2009")
      );
    });
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2008");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2008")
    );

    const createBtn = getByTestId("model-and-measurement-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toBeDisabled();
  });

  it("Check if measurement period save button is disabled when measurement period end date or state date is not valid", async () => {
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    await act(async () => {
      const text = getByTestId("model-id-input") as HTMLInputElement;
      expect(text.value).toBe("QI-Core v4.1.1");
    });
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodStartInput, "12/07/200");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/200")
      );
    });
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2008");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2008")
    );

    const createBtn = getByTestId("model-and-measurement-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toBeDisabled();
  });

  it("Check if measurement period save button is enabled when measurement period start and end dates pass all date checks", async () => {
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.clear(measurementPeriodStartInput);
    userEvent.type(measurementPeriodStartInput, "12/07/2000");
    expect(measurementPeriodStartInput.value).toBe("12/07/2000");
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2009");
    expect(measurementPeriodEndInput.value).toBe("12/07/2009");

    const createBtn = getByTestId("model-and-measurement-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toBeEnabled();
  });

  it("Check if measurement period save button is enabled when measurement period start and end dates pass all date checks, and success works", async () => {
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.clear(measurementPeriodStartInput);
    userEvent.type(measurementPeriodStartInput, "12/07/2000");
    expect(measurementPeriodStartInput.value).toBe("12/07/2000");
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2009");
    expect(measurementPeriodEndInput.value).toBe("12/07/2009");

    const createBtn = getByTestId("model-and-measurement-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toBeEnabled();
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
    } as unknown as MeasureServiceApi;
    act(async () => {
      fireEvent.click(createBtn);
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
  });

  it("Check if measurement period save button is enabled when measurement period start and end dates pass all date checks, and failure works", async () => {
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.clear(measurementPeriodStartInput);
    userEvent.type(measurementPeriodStartInput, "12/07/2000");
    expect(measurementPeriodStartInput.value).toBe("12/07/2000");
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2009");
    expect(measurementPeriodEndInput.value).toBe("12/07/2009");

    const createBtn = getByTestId("model-and-measurement-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toBeEnabled();
    serviceApiMock = {
      updateMeasure: jest.fn().mockRejectedValueOnce({
        status: 500,
        response: { data: { message: "update failed" } },
      }),
    } as unknown as MeasureServiceApi;
    act(async () => {
      fireEvent.click(createBtn);
      await waitFor(
        () =>
          expect(
            getByTestId("edit-measure-information-generic-error-text")
          ).toBeInTheDocument(),
        {
          timeout: 5000,
        }
      );
    });
  });

  it("Check that discarding changes works", async () => {
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.clear(measurementPeriodStartInput);
    userEvent.type(measurementPeriodStartInput, "12/07/2000");
    expect(measurementPeriodStartInput.value).toBe("12/07/2000");
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2009");
    expect(measurementPeriodEndInput.value).toBe("12/07/2009");
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
      expect(measurementPeriodStartInput.value).toBe("");
    });
  });

  it("Check that canceling changes in discard works", async () => {
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.clear(measurementPeriodStartInput);
    userEvent.type(measurementPeriodStartInput, "12/07/2000");
    expect(measurementPeriodStartInput.value).toBe("12/07/2000");
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2009");
    expect(measurementPeriodEndInput.value).toBe("12/07/2009");

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
