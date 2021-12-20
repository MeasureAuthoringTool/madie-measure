import * as React from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";
import MeasureSteward from "./MeasureSteward";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../api/useMeasureServiceApi";
import useCurrentMeasure from "../useCurrentMeasure";
import { MeasureContextHolder } from "../MeasureContext";
import Measure from "../../../models/Measure";

jest.mock("../../../api/useMeasureServiceApi");
jest.mock("../useCurrentMeasure");

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const useCurrentMeasureMock =
  useCurrentMeasure as jest.Mock<MeasureContextHolder>;

const STEWARD = "Steward Test Value";

describe("MeasureSteward component", () => {
  let measure: Measure;
  let serviceApiMock: MeasureServiceApi;
  let measureContextHolder: MeasureContextHolder;

  afterEach(cleanup);

  beforeEach(() => {
    measure = {
      id: "test measure",
      measureName: "the measure for testing",
      measureMetaData: {
        measureSteward: STEWARD,
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

  function expectInputValue(element: HTMLElement, value: string): void {
    expect(element).toBeInstanceOf(HTMLInputElement);
    const inputEl = element as HTMLInputElement;
    expect(inputEl.value).toBe(value);
  }

  it("should render the component with the supplied steward information", () => {
    const { getByTestId } = render(<MeasureSteward />);

    const result: HTMLElement = getByTestId("measureSteward");
    expect(result).toBeInTheDocument();
    expect(result).toMatchSnapshot();

    const input = getByTestId("measureStewardInput");
    expectInputValue(input, STEWARD);
  });

  it("should default the measureMetadata if none is supplied", async () => {
    delete measure.measureMetaData;
    const { findByTestId, getByTestId } = render(<MeasureSteward />);
    const input = getByTestId("measureStewardInput");
    expectInputValue(input, "");

    const save = getByTestId("measureStewardSave");
    fireEvent.click(save);

    expect(serviceApiMock.updateMeasure).toHaveBeenCalledWith({
      id: "test measure",
      measureMetaData: {
        measureSteward: undefined,
      },
      measureName: "the measure for testing",
    });

    const success = await findByTestId("measureStewardSuccess");
    expect(success).toBeInTheDocument();
  });

  it("should update the input when a user types", () => {
    const { getByTestId } = render(<MeasureSteward />);

    const input = getByTestId("measureStewardInput");
    expectInputValue(input, STEWARD);

    fireEvent.change(input, {
      target: { value: "new value" },
    });

    expectInputValue(input, "new value");
  });

  it("should save the steward information when the form is submitted", async () => {
    const { findByTestId, getByTestId } = render(<MeasureSteward />);
    const input = getByTestId("measureStewardInput");
    fireEvent.change(input, {
      target: { value: "new value" },
    });
    const save = getByTestId("measureStewardSave");
    fireEvent.click(save);

    expect(serviceApiMock.updateMeasure).toHaveBeenCalledWith({
      id: "test measure",
      measureMetaData: {
        measureSteward: "new value",
      },
      measureName: "the measure for testing",
    });

    const success = await findByTestId("measureStewardSuccess");
    expect(success).toBeInTheDocument();
  });

  it("should render an error message if the measure cannot be saved", async () => {
    serviceApiMock.updateMeasure = jest.fn().mockRejectedValue("Save error");

    const { findByTestId, getByTestId } = render(<MeasureSteward />);
    const input = getByTestId("measureStewardInput");
    fireEvent.change(input, {
      target: { value: "new value" },
    });
    const save = getByTestId("measureStewardSave");
    fireEvent.click(save);

    const error = await findByTestId("measureStewardError");
    expect(error.textContent).toBe(
      'Error updating measure "the measure for testing"'
    );
  });
});
