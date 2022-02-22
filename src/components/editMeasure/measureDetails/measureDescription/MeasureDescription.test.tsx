import React from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";
import MeasureDescription from "./MeasureDescription";
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

const DESCRIPTION = "Test Description";

describe("MeasureDescription component", () => {
  let measure: Measure;
  let serviceApiMock: MeasureServiceApi;
  let measureContextHolder: MeasureContextHolder;

  afterEach(cleanup);

  beforeEach(() => {
    measure = {
      id: "test measure",
      measureName: "the measure for testing",
      measureMetaData: {
        measureDescription: DESCRIPTION,
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

  it("should render the component with the supplied description information", () => {
    const { getByTestId } = render(<MeasureDescription />);

    const result = getByTestId("measureDescription");
    expect(result).toBeInTheDocument();
    expect(result).toMatchSnapshot();

    const input = getByTestId("measureDescriptionInput");
    expectInputValue(input, DESCRIPTION);
  });

  it("should default the measureMetadata if none is supplied", async () => {
    delete measure.measureMetaData;
    const { findByTestId, getByTestId } = render(<MeasureDescription />);
    const input = getByTestId("measureDescriptionInput");
    expectInputValue(input, "");

    const save = getByTestId("measureDescriptionSave");
    fireEvent.click(save);

    expect(serviceApiMock.updateMeasure).toHaveBeenCalledWith({
      id: "test measure",
      measureMetaData: {
        measureDescription: undefined,
      },
      measureName: "the measure for testing",
    });

    const success = await findByTestId("measureDescriptionSuccess");
    expect(success).toBeInTheDocument();
  });

  it("should update the input when a user types a new value", () => {
    const { getByTestId } = render(<MeasureDescription />);

    const input = getByTestId("measureDescriptionInput");
    expectInputValue(input, DESCRIPTION);

    fireEvent.change(input, {
      target: { value: "new value" },
    });

    expectInputValue(input, "new value");
  });

  it("should save the description information when the form is submitted", async () => {
    const { findByTestId, getByTestId } = render(<MeasureDescription />);
    const input = getByTestId("measureDescriptionInput");
    fireEvent.change(input, {
      target: { value: "new value" },
    });
    const save = getByTestId("measureDescriptionSave");
    fireEvent.click(save);

    expect(serviceApiMock.updateMeasure).toHaveBeenCalledWith({
      id: "test measure",
      measureMetaData: {
        measureDescription: "new value",
      },
      measureName: "the measure for testing",
    });

    const success = await findByTestId("measureDescriptionSuccess");
    expect(success).toBeInTheDocument();
  });

  it("should render an error message if the measure cannot be saved", async () => {
    serviceApiMock.updateMeasure = jest.fn().mockRejectedValue("Save error");

    const { findByTestId, getByTestId } = render(<MeasureDescription />);
    const input = getByTestId("measureDescriptionInput");
    fireEvent.change(input, {
      target: { value: "new value" },
    });
    const save = getByTestId("measureDescriptionSave");
    fireEvent.click(save);

    const error = await findByTestId("measureDescriptionError");
    expect(error.textContent).toBe(
      'Error updating measure "the measure for testing"'
    );
  });
});
