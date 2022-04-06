import React from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";
import MeasureRationale from "./MeasureRationale";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import useCurrentMeasure from "../../useCurrentMeasure";
import { MeasureContextHolder } from "../../MeasureContext";
import Measure from "../../../../models/Measure";

jest.mock("../../../../api/useMeasureServiceApi");
jest.mock("../../useCurrentMeasure");

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const useCurrentMeasureMock =
  useCurrentMeasure as jest.Mock<MeasureContextHolder>;

const RATIONALE = "Test Rationale";

describe("MeasureRationale component", () => {
  let measure: Measure;
  let serviceApiMock: MeasureServiceApi;
  let measureContextHolder: MeasureContextHolder;

  afterEach(cleanup);

  beforeEach(() => {
    measure = {
      id: "test measure",
      measureName: "the measure for testing",
      measureMetaData: {
        rationale: RATIONALE,
      },
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

  const expectInputValue = (element: HTMLElement, value: string): void => {
    expect(element).toBeInstanceOf(HTMLInputElement);
    const inputEl = element as HTMLInputElement;
    expect(inputEl.value).toBe(value);
  };

  it("should render the component with the supplied rationale information", () => {
    const { getByTestId } = render(<MeasureRationale />);

    const result = getByTestId("measureRationale");
    expect(result).toBeInTheDocument();

    const input = getByTestId("measureRationaleInput");
    expectInputValue(input, RATIONALE);
  });

  it("should default the measureMetadata if none is supplied", async () => {
    delete measure.measureMetaData;
    const { getByTestId } = render(<MeasureRationale />);

    const input = getByTestId("measureRationaleInput");
    expectInputValue(input, "");

    const save = getByTestId("measureRationaleSave");
    fireEvent.click(save);

    expect(serviceApiMock.updateMeasure).not.toHaveBeenCalledWith({
      id: "test measure",
      measureMetaData: {
        rationale: undefined,
      },
      measureName: "the measure for testing",
    });
  });

  it("should update the input when a user types a new value", () => {
    const { getByTestId } = render(<MeasureRationale />);

    const input = getByTestId("measureRationaleInput");
    expectInputValue(input, RATIONALE);

    fireEvent.change(input, {
      target: { value: "new value" },
    });

    expectInputValue(input, "new value");
  });

  it("should save the rationale information when the form is submitted", async () => {
    const { findByTestId, getByTestId } = render(<MeasureRationale />);
    const input = getByTestId("measureRationaleInput");
    fireEvent.change(input, {
      target: { value: "new value" },
    });
    const save = getByTestId("measureRationaleSave");
    fireEvent.click(save);

    const success = await findByTestId("measureRationaleSuccess");
    expect(success).toBeInTheDocument();
  });

  it("should render an error message if the measure cannot be saved", async () => {
    serviceApiMock.updateMeasure = jest.fn().mockRejectedValue("Save error");

    const { findByTestId, getByTestId } = render(<MeasureRationale />);
    const input = getByTestId("measureRationaleInput");
    fireEvent.change(input, {
      target: { value: "new value" },
    });
    const save = getByTestId("measureRationaleSave");
    fireEvent.click(save);

    const error = await findByTestId("measureRationaleError");
    expect(error.textContent).toBe(
      'Error updating measure "the measure for testing"'
    );
  });
});
