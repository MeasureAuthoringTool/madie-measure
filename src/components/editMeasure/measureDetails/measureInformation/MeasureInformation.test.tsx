import * as React from "react";
import {
  render,
  cleanup,
  fireEvent,
  waitFor,
  screen,
  within,
  logRoles,
} from "@testing-library/react";
import { act } from "react-dom/test-utils";
import MeasureInformation from "./MeasureInformation";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import useCurrentMeasure from "../../useCurrentMeasure";
import { MeasureContextHolder } from "../../MeasureContext";
import Measure from "../../../../models/Measure";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { useOktaTokens, useKeyPress } from "@madie/madie-util";
import { describe, expect, it } from "@jest/globals";
import axios, { AxiosError, AxiosResponse } from "axios";

const mockHistoryPush = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

jest.mock("../../../../api/useMeasureServiceApi");
jest.mock("../../useCurrentMeasure");
jest.mock("@madie/madie-util", () => ({
  useOktaTokens: jest.fn(() => ({
    getUserName: jest.fn(() => "testuser@example.com"), //#nosec
  })),
  useKeyPress: jest.fn(() => false),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
  },
  useOnClickOutside: jest.fn(() => false),
}));

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const useCurrentMeasureMock =
  useCurrentMeasure as jest.Mock<MeasureContextHolder>;
const axiosError: AxiosError = {
  response: {
    status: 500,
    data: { status: 500, error: "bad test", message: "oh no what happened" },
  } as AxiosResponse,
  toJSON: jest.fn(),
} as unknown as AxiosError;

let serviceApiMock: MeasureServiceApi;
serviceApiMock = {
  updateMeasure: jest
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce({ status: 200 })
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(axiosError)
    .mockRejectedValueOnce({ response: { data: { measureName: "bad" } } })
    .mockRejectedValueOnce({ response: { data: { measureName: "bad" } } }),
} as unknown as MeasureServiceApi;
useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

useOktaTokens.mockImplementation(() => ({
  getUserName: () => "testuser@example.com", // #nosec
}));

describe("MeasureInformation component", () => {
  let measure: Measure;
  let measureContextHolder: MeasureContextHolder;
  afterEach(cleanup);

  beforeEach(() => {
    measure = {
      id: "test measure",
      measureName: "the measure for testing",
      createdBy: "testuser@example.com",
    } as Measure;

    measureContextHolder = {
      measure,
      setMeasure: jest.fn(),
    };

    useCurrentMeasureMock.mockImplementation(() => measureContextHolder);
  });
  const {
    getByTestId,
    findByTestId,
    queryByText,
    queryByTestId,
    findByRole,
    getByRole,
    findByText,
  } = screen;

  it("should render the component with measure's name populated", () => {
    render(<MeasureInformation />);
    const result: HTMLElement = getByTestId("measure-name-edit");
    expect(result).toBeInTheDocument();
    const text = getByTestId("inline-view-span");
    expect(text.textContent).toBe(measure.measureName);
  });

  it("should render the component with a blank measure name", () => {
    delete measure.measureName;
    render(<MeasureInformation />);
    const result: HTMLElement = getByTestId("measure-name-edit");
    expect(result).toBeInTheDocument();
    const text = getByTestId("inline-view-span");
    expect(text.textContent).toBe("");
  });

  it("Check if the measurement period save button is present", () => {
    render(<MeasureInformation />);
    const result: HTMLElement = getByTestId("measurement-period-save-button");
    expect(result).toBeInTheDocument();
  });

  it("Check if measurement start field is present in the form", () => {
    render(<MeasureInformation />);
    const result = getByTestId("measurement-period-form");
    expect(result).toBeInTheDocument();
    const measurementPeriodStart: HTMLElement = getByTestId(
      "measurement-period-start-date"
    );
    expect(measurementPeriodStart).toBeInTheDocument();
  });

  it("Check if measurement start date field updates input as expected", async () => {
    render(<MeasureInformation />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox");
    userEvent.type(measurementPeriodStartInput, "12/07/2001");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/2001")
      );
    });
  });

  it("Check if measurement end date field has expected value", async () => {
    render(<MeasureInformation />);
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox");
    userEvent.type(measurementPeriodEndInput, "12/07/2009");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2009")
    );
  });

  it("Check if measurement period save button is disabled when measurement period start and end date have same values", async () => {
    render(<MeasureInformation />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox");
    userEvent.type(measurementPeriodStartInput, "12/07/2009");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/2009")
      );
    });
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox");
    userEvent.type(measurementPeriodEndInput, "12/07/2009");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2009")
    );

    const createBtn = getByTestId("measurement-period-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toBeDisabled();
  });

  it("Check if measurement period save button is disabled when measurement period end date is less than start date", async () => {
    render(<MeasureInformation />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox");
    userEvent.type(measurementPeriodStartInput, "12/07/2009");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/2009")
      );
    });
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox");
    userEvent.type(measurementPeriodEndInput, "12/07/2008");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2008")
    );

    const createBtn = getByTestId("measurement-period-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toBeDisabled();
  });

  it("Check if measurement period save button is disabled when measurement period end date or state date is not valid", async () => {
    render(<MeasureInformation />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox");
    userEvent.type(measurementPeriodStartInput, "12/07/200");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/200")
      );
    });
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox");
    userEvent.type(measurementPeriodEndInput, "12/07/2008");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2008")
    );

    const createBtn = getByTestId("measurement-period-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toBeDisabled();
  });

  it("Check if measurement period save button is enabled when measurement period start and end dates pass all date checks", async () => {
    render(<MeasureInformation />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox");
    userEvent.type(measurementPeriodStartInput, "12/07/2000");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/2000")
      );
    });
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox");
    userEvent.type(measurementPeriodEndInput, "12/07/2009");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2009")
    );

    const createBtn = getByTestId("measurement-period-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toBeEnabled();
  });

  it("saving measurement periods", async () => {
    render(<MeasureInformation />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox");
    userEvent.type(measurementPeriodStartInput, "12/07/2000");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/2000")
      );
    });
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox");
    userEvent.type(measurementPeriodEndInput, "12/07/2009");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2009")
    );

    const createBtn = getByTestId("measurement-period-save-button");
    fireEvent.click(createBtn);
    await waitFor(
      () =>
        expect(
          getByTestId("measurement-period-success-message")
        ).toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );
  });
  it("should save the measure's name on an update", async () => {
    render(<MeasureInformation />);
    // Click the name to trigger the inline edit
    const clickableSpan = getByTestId("inline-view-span");
    fireEvent.click(clickableSpan);
    // Have the user click enter (after input)
    useKeyPress.mockReturnValueOnce(true);
    // Type in the new value
    const input = await findByTestId("inline-edit-input");
    fireEvent.change(input, {
      target: { value: "new value" },
    });
    // Wait for rendering
    await findByTestId("inline-view-span");
    // Check expectations
    const expected = {
      id: "test measure",
      measureName: "new value",
      createdBy: "testuser@example.com",
    };
    const mockSetMeasure = measureContextHolder.setMeasure as jest.Mock<void>;
    expect(serviceApiMock.updateMeasure).toHaveBeenCalledWith(expected);
    expect(mockSetMeasure).toHaveBeenCalledWith(expected);
  });

  it("Should display a delete button if user is the owner of measure", async () => {
    render(<MeasureInformation />);
    const result: HTMLElement = await findByTestId("delete-measure-button");
    expect(result).toBeInTheDocument();
  });

  it("Should not display a delete button if user is not the owner of measure", () => {
    useOktaTokens.mockImplementationOnce(() => ({
      getUserName: () => "othertestuser@example.com", //#nosec
    }));
    render(<MeasureInformation />);
    const result: HTMLElement = queryByText("delete-measure-button");
    expect(result).toBeNull();
  });

  it("On delete click, user is presented with a confirm deletion screen", async () => {
    render(<MeasureInformation />);
    const result: HTMLElement = await findByTestId("delete-measure-button");
    fireEvent.click(result);
    const confirmDelete = getByTestId("delete-measure-button-2");
    expect(confirmDelete).toBeInTheDocument();
    const cancelDelete = await getByTestId("cancel-delete-measure-button");
    expect(cancelDelete).toBeInTheDocument();
  });

  it("On successful delete action click, user can see success message and routes back to measures", async () => {
    await render(
      <MemoryRouter>
        <MeasureInformation />
      </MemoryRouter>
    );
    const result: HTMLElement = await findByTestId("delete-measure-button");
    fireEvent.click(result);
    const confirmDelete = await getByTestId("delete-measure-button-2");
    expect(confirmDelete).toBeInTheDocument();
    fireEvent.click(confirmDelete);
    await waitFor(
      () => {
        expect(
          getByTestId("edit-measure-information-success-text")
        ).toBeInTheDocument();
        expect(mockHistoryPush).toHaveBeenCalledWith("/measures");
      },
      {
        timeout: 5000,
      }
    );
  });

  it("On failed delete action click, user can see toast error pop up", async () => {
    render(<MeasureInformation />);
    const result: HTMLElement = await findByTestId("delete-measure-button");
    fireEvent.click(result);
    const confirmDelete = await getByTestId("delete-measure-button-2");
    expect(confirmDelete).toBeInTheDocument();
    const cancelDelete = await getByTestId("cancel-delete-measure-button");
    expect(cancelDelete).toBeInTheDocument();
    fireEvent.click(confirmDelete);

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

  it("On failed delete action, user can see toast with error message", async () => {
    render(<MeasureInformation />);

    const deleteButton = await findByRole("button", { name: "Delete Measure" });
    userEvent.click(deleteButton);
    const confirmDeleteButton = await findByRole("button", {
      name: "Yes, Delete",
    });
    userEvent.click(confirmDeleteButton);
    await waitFor(
      () =>
        expect(
          getByTestId("edit-measure-information-generic-error-text")
        ).toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );
    const toastErrorMessage = await findByText(
      "500: bad test oh no what happened"
    );
    expect(toastErrorMessage).toBeInTheDocument();
  });

  it("On failed update of measure, error message shown", async () => {
    render(<MeasureInformation />);
    // Click the name to trigger the inline edit
    const clickableSpan = getByTestId("inline-view-span");
    fireEvent.click(clickableSpan);
    // Have the user click enter (after input)
    useKeyPress.mockReturnValueOnce(true);
    // Type in the new value
    const input = await findByTestId("inline-edit-input");
    fireEvent.change(input, {
      target: { value: "new value" },
    });
    // Wait for rendering
    await findByTestId("inline-view-span");
    // Check expectations
    const submit = {
      id: "test measure",
      measureName: "new value",
      createdBy: "testuser@example.com", //#nosec
    };

    //const mockSetMeasure = measureContextHolder.setMeasure as jest.Mock<void>;
    expect(serviceApiMock.updateMeasure).toHaveBeenCalledWith(submit);
    const error: HTMLElement = getByTestId(
      "edit-measure-information-generic-error-text"
    );
    expect(error).toBeInTheDocument();

    //logRoles(container)
    //screen.debug()
  });

  it("Should not allow user to edit measure name if user is not the owner of measure", async () => {
    useOktaTokens.mockImplementation(() => ({
      getUserName: () => "AnotherUser",
    }));
    await render(<MeasureInformation />);

    const inlineInput = queryByTestId("inline-view-span");
    expect(inlineInput).not.toBeInTheDocument();
  });
});
