import * as React from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";
import MeasureInformation from "./MeasureInformation";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import useCurrentMeasure from "../../useCurrentMeasure";
import useKeyPress from "../../../../hooks/useKeypress";
import { MeasureContextHolder } from "../../MeasureContext";
import Measure from "../../../../models/Measure";

jest.mock("../../../../api/useMeasureServiceApi");
jest.mock("../../useCurrentMeasure");
jest.mock("../../../../hooks/useKeypress");

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const useCurrentMeasureMock =
  useCurrentMeasure as jest.Mock<MeasureContextHolder>;

const useKeypressMock = useKeyPress as jest.Mock<boolean>;

describe("MeasureInformation component", () => {
  let measure: Measure;
  let serviceApiMock: MeasureServiceApi;
  let measureContextHolder: MeasureContextHolder;

  afterEach(cleanup);

  beforeEach(() => {
    useKeypressMock.mockReturnValue(false);

    measure = {
      id: "test measure",
      measureName: "the measure for testing",
    } as Measure;

    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValue(undefined),
    } as unknown as MeasureServiceApi;

    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

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
    };
    const mockSetMeasure = measureContextHolder.setMeasure as jest.Mock<void>;
    expect(serviceApiMock.updateMeasure).toHaveBeenCalledWith(expected);
    expect(mockSetMeasure).toHaveBeenCalledWith(expected);
  });
});
