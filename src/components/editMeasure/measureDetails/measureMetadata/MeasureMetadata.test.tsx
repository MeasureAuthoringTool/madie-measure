import React from "react";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";

import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import useCurrentMeasure from "../../useCurrentMeasure";
import { MeasureContextHolder } from "../../MeasureContext";
import Measure, { MeasureMetadata } from "../../../../models/Measure";
import MeasureMetadataForm from "./MeasureMetadata";
import useOktaTokens from "../../../../hooks/useOktaTokens";

jest.mock("../../../../api/useMeasureServiceApi");
jest.mock("../../useCurrentMeasure");
jest.mock("../../../../hooks/useOktaTokens");

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const useCurrentMeasureMock =
  useCurrentMeasure as jest.Mock<MeasureContextHolder>;

const useOktaTokensMock = useOktaTokens as Jest.Mock<Function>;

describe("MeasureRationale component", () => {
  let measure: Measure;
  let measureMetaData: MeasureMetadata;
  let serviceApiMock: MeasureServiceApi;
  let measureContextHolder: MeasureContextHolder;

  const MEASUREID = "TestMeasureId";
  const MEASURENAME = "The Measure for Testing";
  const STEWARD = "Test Steward";
  const DECRIPTION = "Test Description";
  const COPYRIGHT = "Test Copyright";
  const DISCLAIMER = "Test Disclaimer";
  const RATIONALE = "Test Rationale";
  const AUTHOR = "Test Author";
  const GUIDANCE = "Test Guidance";
  const NEWVALUE = "Test New Value";
  const MEASURE_CREATEDBY = "testuser@example.com";

  afterEach(cleanup);

  beforeEach(() => {
    measureMetaData = {
      steward: STEWARD,
      description: DECRIPTION,
      copyright: COPYRIGHT,
      disclaimer: DISCLAIMER,
      rationale: RATIONALE,
      author: AUTHOR,
      guidance: GUIDANCE,
    } as MeasureMetadata;

    measure = {
      id: MEASUREID,
      measureName: MEASURENAME,
      createdBy: MEASURE_CREATEDBY,
      measureMetaData: measureMetaData,
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

    useOktaTokensMock.mockImplementation(() => ({
      getUserName: () => MEASURE_CREATEDBY,
    }));
  });

  const expectInputValue = (element: HTMLElement, value: string): void => {
    expect(element).toBeInstanceOf(HTMLInputElement);
    const inputEl = element as HTMLInputElement;
    expect(inputEl.value).toBe(value);
  };

  it("Should render empty titles with empty props", () => {
    render(<MeasureMetadataForm measureMetadataType="" />);

    expect(screen.queryByText("Steward")).toBeNull();
    expect(screen.queryByText("Description")).toBeNull();
    expect(screen.queryByText("Copyright")).toBeNull();
    expect(screen.queryByText("Disclaimer")).toBeNull();
    expect(screen.queryByText("Rationale")).toBeNull();
    expect(screen.queryByText("Author")).toBeNull();
    expect(screen.queryByText("Guidance")).toBeNull();
  });

  it("should render the MeasureMetadata component with the supplied steward information", () => {
    render(<MeasureMetadataForm measureMetadataType="Steward" />);

    expect(screen.getByTestId("measureSteward")).toBeInTheDocument();

    const input = screen.getByTestId("measureStewardInput");
    expectInputValue(input, STEWARD);

    expect(screen.getByText("Steward/Author")).toBeTruthy();
    expect(screen.queryByText("Steward")).not.toBeNull();
    expect(screen.queryByText("Description")).toBeNull();
    expect(screen.queryByText("Copyright")).toBeNull();
    expect(screen.queryByText("Disclaimer")).toBeNull();
    expect(screen.queryByText("Rationale")).toBeNull();
    expect(screen.queryByText("Author")).toBeNull();
    expect(screen.queryByText("Guidance")).toBeNull();
  });

  it("should render the MeasureMetadata component with the supplied rationale information", () => {
    const { queryByText, getByTestId } = render(
      <MeasureMetadataForm measureMetadataType="Rationale" />
    );

    expect(screen.getByTestId("measureRationale")).toBeInTheDocument();

    const input = screen.getByTestId("measureRationaleInput");
    expectInputValue(input, RATIONALE);

    expect(screen.getByText("Rationale")).toBeTruthy();
    expect(screen.queryByText("Steward/Author")).toBeNull();
    expect(screen.queryByText("Description")).toBeNull();
    expect(screen.queryByText("Copyright")).toBeNull();
    expect(screen.queryByText("Disclaimer")).toBeNull();
    expect(screen.queryByText("Author")).toBeNull();
    expect(screen.queryByText("Guidance")).toBeNull();
  });

  it("should render the MeasureMetadata component with the supplied author information", () => {
    const { queryByText, getByTestId } = render(
      <MeasureMetadataForm measureMetadataType="Author" />
    );

    const result = getByTestId("measureAuthor");
    expect(result).toBeInTheDocument();

    const input = getByTestId("measureAuthorInput");
    expectInputValue(input, AUTHOR);

    expect(queryByText("Steward/Author")).toBeNull();
    expect(screen.getByText("Author")).toBeTruthy();
    expect(screen.queryByText("Steward/Author")).toBeNull();
    expect(screen.queryByText("Description")).toBeNull();
    expect(screen.queryByText("Copyright")).toBeNull();
    expect(screen.queryByText("Disclaimer")).toBeNull();
    expect(screen.queryByText("Rationale")).toBeNull();
    expect(screen.queryByText("Guidance")).toBeNull();
  });

  it("should default the measureMetadata if none is supplied", async () => {
    delete measure.measureMetaData;
    const { getByTestId } = render(
      <MeasureMetadataForm measureMetadataType="Rationale" />
    );

    const input = getByTestId("measureRationaleInput");
    expectInputValue(input, "");

    const save = getByTestId("measureRationaleSave");
    fireEvent.click(save);

    expect(serviceApiMock.updateMeasure).not.toHaveBeenCalledWith({
      id: "test measure",
      measureMetaData: {
        rationale: undefined,
      },
    });
  });

  it("should update the rationale input field when a user types a new value", () => {
    const { getByTestId } = render(
      <MeasureMetadataForm measureMetadataType="Rationale" />
    );

    const input = getByTestId("measureRationaleInput");
    expectInputValue(input, RATIONALE);

    fireEvent.change(input, {
      target: { value: NEWVALUE },
    });

    expectInputValue(input, NEWVALUE);
  });

  it("should update the author input field when a user types a new value", () => {
    const { getByTestId } = render(
      <MeasureMetadataForm measureMetadataType="Author" />
    );

    const input = getByTestId("measureAuthorInput");
    expectInputValue(input, AUTHOR);

    fireEvent.change(input, {
      target: { value: NEWVALUE },
    });

    expectInputValue(input, NEWVALUE);
  });

  it("should save the rationale information when the form is submitted", async () => {
    const { findByTestId, getByTestId } = render(
      <MeasureMetadataForm measureMetadataType="Rationale" />
    );
    const input = getByTestId("measureRationaleInput");
    fireEvent.change(input, {
      target: { value: NEWVALUE },
    });
    const save = getByTestId("measureRationaleSave");
    fireEvent.click(save);

    const success = await findByTestId("measureRationaleSuccess");
    expect(success).toBeInTheDocument();
    expect(success.textContent).toBe(
      "Measure Rationale Information Saved Successfully"
    );

    expect(measure.measureMetaData.steward).toBe(STEWARD);
    expect(measure.measureMetaData.description).toBe(DECRIPTION);
    expect(measure.measureMetaData.copyright).toBe(COPYRIGHT);
    expect(measure.measureMetaData.disclaimer).toBe(DISCLAIMER);
    expect(measure.measureMetaData.rationale).toBe(NEWVALUE);
    expect(measure.measureMetaData.author).toBe(AUTHOR);
    expect(measure.measureMetaData.guidance).toBe(GUIDANCE);
  });

  it("should save the author information when the form is submitted", async () => {
    const { findByTestId, getByTestId } = render(
      <MeasureMetadataForm measureMetadataType="Author" />
    );
    const input = getByTestId("measureAuthorInput");
    fireEvent.change(input, {
      target: { value: NEWVALUE },
    });
    const save = getByTestId("measureAuthorSave");
    fireEvent.click(save);

    const success = await findByTestId("measureAuthorSuccess");
    expect(success).toBeInTheDocument();
    expect(success.textContent).toBe(
      "Measure Author Information Saved Successfully"
    );

    expect(measure.measureMetaData.steward).toBe(STEWARD);
    expect(measure.measureMetaData.description).toBe(DECRIPTION);
    expect(measure.measureMetaData.copyright).toBe(COPYRIGHT);
    expect(measure.measureMetaData.disclaimer).toBe(DISCLAIMER);
    expect(measure.measureMetaData.rationale).toBe(RATIONALE);
    expect(measure.measureMetaData.author).toBe(NEWVALUE);
    expect(measure.measureMetaData.guidance).toBe(GUIDANCE);
  });

  it("should render an error message if the measure rationale cannot be saved", async () => {
    serviceApiMock.updateMeasure = jest.fn().mockRejectedValue("Save error");

    const { findByTestId, getByTestId } = render(
      <MeasureMetadataForm measureMetadataType="Rationale" />
    );
    const input = getByTestId("measureRationaleInput");
    fireEvent.change(input, {
      target: { value: NEWVALUE },
    });
    const save = getByTestId("measureRationaleSave");
    fireEvent.click(save);

    const error = await findByTestId("measureRationaleError");
    expect(error.textContent).toBe(
      'Error updating measure "The Measure for Testing" for Rationale'
    );
  });

  it("should render an error message if the measure author cannot be saved", async () => {
    serviceApiMock.updateMeasure = jest.fn().mockRejectedValue("Save error");

    const { findByTestId, getByTestId } = render(
      <MeasureMetadataForm measureMetadataType="Author" />
    );
    const input = getByTestId("measureAuthorInput");
    fireEvent.change(input, {
      target: { value: NEWVALUE },
    });
    const save = getByTestId("measureAuthorSave");
    fireEvent.click(save);

    const error = await findByTestId("measureAuthorError");
    expect(error.textContent).toBe(
      'Error updating measure "The Measure for Testing" for Author'
    );
  });

  it("Should have no input field if user is not the measure owner", async () => {
    useOktaTokensMock.mockImplementation(() => ({
      getUserName: () => "AnotherUser@example.com",
    }));
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);

    const saveButton = screen.queryByText("measureRationaleSave");
    expect(saveButton).not.toBeInTheDocument();
  });

  it("test - Should have no Save button if user is not the measure owner", async () => {
    useOktaTokensMock.mockImplementation(() => ({
      getUserName: () => "AnotherUser@example.com",
    }));
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);

    const input = screen.queryByText("measureRationaleInput");
    expect(input).not.toBeInTheDocument();
  });
});
