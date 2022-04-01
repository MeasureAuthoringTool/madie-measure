import React from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";
import MeasureCopyright from "./MeasureCopyright";
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

const COPYRIGHT = "Test Copyright";

describe("MeasureCopyright component", () => {
  let measure: Measure;
  let serviceApiMock: MeasureServiceApi;
  let measureContextHolder: MeasureContextHolder;

  afterEach(cleanup);

  beforeEach(() => {
    measure = {
      id: "test measure",
      measureName: "the measure for testing",
      measureMetaData: {
        copyright: COPYRIGHT,
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

  it("should render the component with the supplied copyright information", () => {
    const { getByTestId } = render(<MeasureCopyright />);

    const result = getByTestId("measureCopyright");
    expect(result).toBeInTheDocument();

    const input = getByTestId("measureCopyrightInput");
    expectInputValue(input, COPYRIGHT);
  });

  it("should default the measureMetadata if none is supplied", async () => {
    delete measure.measureMetaData;
    const { findByTestId, getByTestId } = render(<MeasureCopyright />);
    const input = getByTestId("measureCopyrightInput");
    expectInputValue(input, "");

    const save = getByTestId("measureCopyrightSave");
    fireEvent.click(save);

    expect(serviceApiMock.updateMeasure).toHaveBeenCalledWith({
      id: "test measure",
      measureMetaData: {
        copyright: undefined,
      },
      measureName: "the measure for testing",
    });

    const success = await findByTestId("measureCopyrightSuccess");
    expect(success).toBeInTheDocument();
  });

  it("should update the input when a user types a new value", () => {
    const { getByTestId } = render(<MeasureCopyright />);

    const input = getByTestId("measureCopyrightInput");
    expectInputValue(input, COPYRIGHT);

    fireEvent.change(input, {
      target: { value: "new value" },
    });

    expectInputValue(input, "new value");
  });

  it("should save the copyright information when the form is submitted", async () => {
    const { findByTestId, getByTestId } = render(<MeasureCopyright />);
    const input = getByTestId("measureCopyrightInput");
    fireEvent.change(input, {
      target: { value: "new value" },
    });
    const save = getByTestId("measureCopyrightSave");
    fireEvent.click(save);

    expect(serviceApiMock.updateMeasure).toHaveBeenCalledWith({
      id: "test measure",
      measureMetaData: {
        copyright: "new value",
      },
      measureName: "the measure for testing",
    });

    const success = await findByTestId("measureCopyrightSuccess");
    expect(success).toBeInTheDocument();
  });

  it("should render an error message if the measure cannot be saved", async () => {
    serviceApiMock.updateMeasure = jest.fn().mockRejectedValue("Save error");

    const { findByTestId, getByTestId } = render(<MeasureCopyright />);
    const input = getByTestId("measureCopyrightInput");
    fireEvent.change(input, {
      target: { value: "new value" },
    });
    const save = getByTestId("measureCopyrightSave");
    fireEvent.click(save);

    const error = await findByTestId("measureCopyrightError");
    expect(error.textContent).toBe(
      'Error updating measure "the measure for testing"'
    );
  });
});
