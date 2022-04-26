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
    expect(result).toMatchSnapshot();
    const text = getByTestId("inline-view-span");
    expect(text.textContent).toBe(measure.measureName);
  });

  it("should render the component with a blank measure name", () => {
    delete measure.measureName;
    const { getByTestId } = render(<MeasureInformation />);
    const result: HTMLElement = getByTestId("measure-name-edit");
    expect(result).toBeInTheDocument();
    expect(result).toMatchSnapshot();
    const text = getByTestId("inline-view-span");
    expect(text.textContent).toBe("");
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
      getUserName: () => "othertestuser@example.com",
    }));
    render(<MeasureInformation />);

    const inlineInput = screen.queryByTestId("inline-view-span");
    expect(inlineInput).not.toBeInTheDocument();
  });
});
