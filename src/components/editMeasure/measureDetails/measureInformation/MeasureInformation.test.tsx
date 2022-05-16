import * as React from "react";
import {
  render,
  cleanup,
  fireEvent,
  waitFor,
  screen,
} from "@testing-library/react";
import { act } from "react-dom/test-utils";
import MeasureInformation from "./MeasureInformation";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import useCurrentMeasure from "../../useCurrentMeasure";
import useKeyPress from "../../../../hooks/useKeypress";
import { MeasureContextHolder } from "../../MeasureContext";
import Measure from "../../../../models/Measure";
import useOktaTokens from "../../../../hooks/useOktaTokens";
import { MemoryRouter } from "react-router";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import DateAdapter from "@mui/lab/AdapterDateFns";
import DesktopDatePicker from "@mui/lab/DesktopDatePicker";
import { TextField } from "@mui/material";

const mockHistoryPush = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));
jest.mock("../../../../api/useMeasureServiceApi");
jest.mock("../../useCurrentMeasure");
jest.mock("../../../../hooks/useKeypress");
jest.mock("../../../../hooks/useOktaTokens");

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const useOktaTokensMock = useOktaTokens as Jest.Mock<Function>;

const useCurrentMeasureMock =
  useCurrentMeasure as jest.Mock<MeasureContextHolder>;

const useKeypressMock = useKeyPress as jest.Mock<boolean>;
let serviceApiMock: MeasureServiceApi;
serviceApiMock = {
  updateMeasure: jest
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce({ status: 200 }),
} as unknown as MeasureServiceApi;
useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

describe("MeasureInformation component", () => {
  let measure: Measure;
  let measureContextHolder: MeasureContextHolder;
  afterEach(cleanup);

  beforeEach(() => {
    useKeypressMock.mockReturnValue(false);
    measure = {
      id: "test measure",
      measureName: "the measure for testing",
      createdBy: "testuser@example.com",
    } as Measure;

    useOktaTokensMock.mockImplementation(() => ({
      getUserName: () => "testuser@example.com",
    }));
    measureContextHolder = {
      measure,
      setMeasure: jest.fn(),
    };

    useCurrentMeasureMock.mockImplementation(() => measureContextHolder);
  });

  it("should render the component with measure's name populated", () => {
    const { getByTestId } = render(<MeasureInformation />);
    const result: HTMLElement = getByTestId("measure-name-edit");
    expect(result).toBeInTheDocument();
    const text = getByTestId("inline-view-span");
    expect(text.textContent).toBe(measure.measureName);
  });

  it("should render the component with a blank measure name", () => {
    delete measure.measureName;
    const { getByTestId } = render(<MeasureInformation />);
    const result: HTMLElement = getByTestId("measure-name-edit");
    expect(result).toBeInTheDocument();
    const text = getByTestId("inline-view-span");
    expect(text.textContent).toBe("");
  });

  it("Check if the measurement period save button is present", () => {
    const { getByTestId } = render(<MeasureInformation />);
    const result: HTMLElement = getByTestId("measurement-period-save-button");
    expect(result).toBeInTheDocument();

    fireEvent.click(result);
  });

  it("Check if measurement start field is present in the form", () => {
    const { getByTestId } = render(<MeasureInformation />);
    const result = getByTestId("measurement-period-form");
    expect(result).toBeInTheDocument();
    const measurementPeriodStart: HTMLElement = getByTestId(
      "measurement-period-start-date"
    );
    expect(measurementPeriodStart).toBeInTheDocument();
  });

  it("Check if measurement start date field as expected", () => {
    const measurementPeriodStart1 = "05/10/2022";
    const handleChange = jest.fn();
    const onError = jest.fn();
    render(
      <LocalizationProvider dateAdapter={DateAdapter}>
        <DesktopDatePicker
          data-testid="measurement-period-start"
          disableOpenPicker={true}
          label="Start"
          inputFormat="MM/dd/yyyy"
          value={measurementPeriodStart1}
          onChange={handleChange}
          onError={onError}
          renderInput={(params) => <TextField {...params} />}
        />
      </LocalizationProvider>
    );
    const startLabelContent = screen.getByLabelText("Start");
    expect(startLabelContent).toHaveValue("05/10/2022");
    const { getByTestId } = render(<MeasureInformation />);
    const result: HTMLElement = getByTestId("measurement-period-save-button");
    expect(result).toBeInTheDocument();
  });

  it("Check if measurement end date field has expected value", () => {
    const measurementPeriodEnd = "05/15/2022";
    const handleChange = jest.fn();
    const onError = jest.fn();
    render(
      <LocalizationProvider dateAdapter={DateAdapter}>
        <DesktopDatePicker
          data-testid="measurement-period-end"
          disableOpenPicker={true}
          label="End"
          inputFormat="MM/dd/yyyy"
          value={measurementPeriodEnd}
          onChange={handleChange}
          onError={onError}
          renderInput={(params) => <TextField {...params} />}
        />
      </LocalizationProvider>
    );
    const startLabelContent = screen.getByLabelText("End");
    expect(startLabelContent).toHaveValue("05/15/2022");
  });

  it("should save the measure's name on an update", async () => {
    const { findByTestId, getByTestId } = render(<MeasureInformation />);
    // Click the name to trigger the inline edit
    const clickableSpan = getByTestId("inline-view-span");
    fireEvent.click(clickableSpan);
    // Have the user click enter (after input)
    useKeypressMock.mockReturnValueOnce(true);
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
    await act(async () => {
      const { findByTestId } = render(<MeasureInformation />);
      const result: HTMLElement = await findByTestId("delete-measure-button");
      expect(result).toBeInTheDocument();
    });
  });

  it("Should not display a delete button if user is not the owner of measure", async () => {
    useOktaTokensMock.mockImplementation(() => ({
      getUserName: () => "othertestuser@example.com",
    }));
    await act(async () => {
      const { queryByText } = render(<MeasureInformation />);
      const result: HTMLElement = queryByText("delete-measure-button");
      expect(result).toBeNull();
    });
  });

  it("On delete click, user is presented with a confirm deletion screen", async () => {
    await act(async () => {
      const { findByTestId, getByTestId } = await render(
        <MeasureInformation />
      );
      const result: HTMLElement = await findByTestId("delete-measure-button");
      fireEvent.click(result);
      const confirmDelete = await getByTestId("delete-measure-button-2");
      expect(confirmDelete).toBeInTheDocument();
      const cancelDelete = await getByTestId("cancel-delete-measure-button");
      expect(cancelDelete).toBeInTheDocument();
    });
  });

  it("On failed delete action click, user can see toast error pop up", async () => {
    await act(async () => {
      const { findByTestId, getByTestId } = await render(
        <MeasureInformation />
      );
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
  });

  it("On successful delete action click, user can see success message and routes back to measures", async () => {
    await act(async () => {
      const { findByTestId, getByTestId } = await render(
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
  });

  it("Should not allow user to edit measure name if user is not the owner of measure", async () => {
    useOktaTokensMock.mockImplementation(() => ({
      getUserName: () => "AnotherUser",
    }));
    render(<MeasureInformation />);

    const inlineInput = screen.queryByTestId("inline-view-span");
    expect(inlineInput).not.toBeInTheDocument();
  });
});
