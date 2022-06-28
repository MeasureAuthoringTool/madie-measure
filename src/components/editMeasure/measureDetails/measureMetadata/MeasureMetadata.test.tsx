import * as React from "react";
import {
  act,
  waitFor,
  render,
  cleanup,
  fireEvent,
  screen,
} from "@testing-library/react";

import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import { Measure } from "@madie/madie-models";
import MeasureMetadataForm from "./MeasureMetadata";
import { useOktaTokens } from "@madie/madie-util";
import { describe, expect, it } from "@jest/globals";

jest.mock("../../../../api/useMeasureServiceApi");
jest.mock("../../useCurrentMeasure");

const mockMetaData = {
  steward: "Test Steward",
  description: "Test Description",
  copyright: "Test Copyright",
  disclaimer: "Test Disclaimer",
  rationale: "Test Rationale",
  author: "Test Author",
  guidance: "Test Guidance",
};

const mockMeasure = {
  id: "TestMeasureId",
  measureName: "The Measure for Testing",
  createdBy: "testuser@example.com",
  measureMetaData: { ...mockMetaData },
} as Measure;

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: jest.fn(() => ({
    getUserName: jest.fn(() => "testuser@example.com"), //#nosec
  })),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: null,
    initialState: null,
    subscribe: (set) => {
      set(mockMeasure);
      return { unsubscribe: () => null };
    },
  },
}));

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

describe("MeasureRationale component", () => {
  let serviceApiMock: MeasureServiceApi;
  const STEWARD = "Test Steward";
  const DECRIPTION = "Test Description";
  const COPYRIGHT = "Test Copyright";
  const DISCLAIMER = "Test Disclaimer";
  const RATIONALE = "Test Rationale";
  const AUTHOR = "Test Author";
  const GUIDANCE = "Test Guidance";
  const NEWVALUE = "Test New Value";

  afterEach(cleanup);

  beforeEach(() => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValue(undefined),
    } as unknown as MeasureServiceApi;

    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
    mockMeasure.measureMetaData = { ...mockMetaData };
  });

  const expectInputValue = (element: HTMLElement, value: string): void => {
    expect(element).toBeInstanceOf(HTMLInputElement);
    const inputEl = element as HTMLInputElement;
    expect(inputEl.value).toBe(value);
  };
  const { queryByText, getByText, getByTestId, findByTestId } = screen;

  it("Should render empty titles with empty props", () => {
    render(<MeasureMetadataForm measureMetadataType="" />);

    expect(queryByText("Steward")).toBeNull();
    expect(queryByText("Description")).toBeNull();
    expect(queryByText("Copyright")).toBeNull();
    expect(queryByText("Disclaimer")).toBeNull();
    expect(queryByText("Rationale")).toBeNull();
    expect(queryByText("Author")).toBeNull();
    expect(queryByText("Guidance")).toBeNull();
  });

  it("should render the MeasureMetadata component with the supplied steward information", async () => {
    render(<MeasureMetadataForm measureMetadataType="Steward" />);

    expect(screen.getByTestId("measureSteward")).toBeInTheDocument();

    const input = screen.getByTestId("measureStewardInput");
    expectInputValue(input, STEWARD);

    expect(getByText("Steward/Author")).toBeTruthy();
    expect(queryByText("Steward")).not.toBeNull();
    expect(queryByText("Description")).toBeNull();
    expect(queryByText("Copyright")).toBeNull();
    expect(queryByText("Disclaimer")).toBeNull();
    expect(queryByText("Rationale")).toBeNull();
    expect(queryByText("Author")).toBeNull();
    expect(queryByText("Guidance")).toBeNull();
  });

  it("should render the MeasureMetadata component with the supplied rationale information", async () => {
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);

    expect(screen.getByTestId("measureRationale")).toBeInTheDocument();

    const input = screen.getByTestId("measureRationaleInput");
    expectInputValue(input, RATIONALE);

    expect(getByText("Rationale")).toBeTruthy();
    expect(queryByText("Steward/Author")).toBeNull();
    expect(queryByText("Description")).toBeNull();
    expect(queryByText("Copyright")).toBeNull();
    expect(queryByText("Disclaimer")).toBeNull();
    expect(queryByText("Author")).toBeNull();
    expect(queryByText("Guidance")).toBeNull();
  });

  it("should render the MeasureMetadata component with the supplied author information", () => {
    render(<MeasureMetadataForm measureMetadataType="Author" />);

    const result = getByTestId("measureAuthor");
    expect(result).toBeInTheDocument();

    const input = getByTestId("measureAuthorInput");
    expectInputValue(input, AUTHOR);

    expect(queryByText("Steward/Author")).toBeNull();
    expect(queryByText("Author")).toBeTruthy();
    expect(queryByText("Steward/Author")).toBeNull();
    expect(queryByText("Description")).toBeNull();
    expect(queryByText("Copyright")).toBeNull();
    expect(queryByText("Disclaimer")).toBeNull();
    expect(queryByText("Rationale")).toBeNull();
    expect(queryByText("Guidance")).toBeNull();
  });

  it("should default the measureMetadata if none is supplied", () => {
    mockMeasure.measureMetaData = {};
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);

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

  it("should update the rationale input field when a user types a new value", async () => {
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);

    const input = getByTestId("measureRationaleInput");

    await waitFor(() => expectInputValue(input, RATIONALE));

    fireEvent.change(input, {
      target: { value: NEWVALUE },
    });
    await waitFor(() => expectInputValue(input, NEWVALUE));
  });

  it("should update the author input field when a user types a new value", async () => {
    render(<MeasureMetadataForm measureMetadataType="Author" />);

    const input = getByTestId("measureAuthorInput");
    expectInputValue(input, AUTHOR);
    fireEvent.change(input, {
      target: { value: NEWVALUE },
    });
    await waitFor(() => expectInputValue(input, NEWVALUE));
  });

  it("should save the rationale information when the form is submitted", async () => {
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);
    const input = getByTestId("measureRationaleInput");
    act(() => {
      fireEvent.change(input, {
        target: { value: NEWVALUE },
      });
    });
    const save = getByTestId("measureRationaleSave");
    act(() => {
      fireEvent.click(save);
    });
    await waitFor(async () => {
      const success = await findByTestId("measureRationaleSuccess");
      expect(success).toBeInTheDocument();
      expect(success.textContent).toBe(
        "Measure Rationale Information Saved Successfully"
      );
    });

    expect(mockMeasure.measureMetaData.steward).toBe(STEWARD);
    expect(mockMeasure.measureMetaData.description).toBe(DECRIPTION);
    expect(mockMeasure.measureMetaData.copyright).toBe(COPYRIGHT);
    expect(mockMeasure.measureMetaData.disclaimer).toBe(DISCLAIMER);
    expect(mockMeasure.measureMetaData.rationale).toBe(NEWVALUE);
    expect(mockMeasure.measureMetaData.author).toBe(AUTHOR);
    expect(mockMeasure.measureMetaData.guidance).toBe(GUIDANCE);
  });

  it("should save the author information when the form is submitted", async () => {
    render(<MeasureMetadataForm measureMetadataType="Author" />);
    const input = getByTestId("measureAuthorInput");
    await act(async () => {
      fireEvent.change(input, {
        target: { value: NEWVALUE },
      });
    });
    const save = getByTestId("measureAuthorSave");
    fireEvent.click(save);

    const success = await findByTestId("measureAuthorSuccess");
    expect(success).toBeInTheDocument();
    expect(success.textContent).toBe(
      "Measure Author Information Saved Successfully"
    );

    expect(mockMeasure.measureMetaData.steward).toBe(STEWARD);
    expect(mockMeasure.measureMetaData.description).toBe(DECRIPTION);
    expect(mockMeasure.measureMetaData.copyright).toBe(COPYRIGHT);
    expect(mockMeasure.measureMetaData.disclaimer).toBe(DISCLAIMER);
    expect(mockMeasure.measureMetaData.rationale).toBe(RATIONALE);
    expect(mockMeasure.measureMetaData.author).toBe(NEWVALUE);
    expect(mockMeasure.measureMetaData.guidance).toBe(GUIDANCE);
  });

  it("should render an error message if the measure rationale cannot be saved", async () => {
    serviceApiMock.updateMeasure = jest.fn().mockRejectedValue("Save error");

    render(<MeasureMetadataForm measureMetadataType="Rationale" />);
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

    render(<MeasureMetadataForm measureMetadataType="Author" />);
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

  it("Should have no input field if user is not the measure owner", () => {
    useOktaTokens.mockImplementation(() => ({
      getUserName: () => "AnotherUser@example.com", //#nosec
    }));
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);

    const saveButton = screen.queryByText("measureRationaleSave");
    expect(saveButton).not.toBeInTheDocument();
  });

  it("test - Should have no Save button if user is not the measure owner", () => {
    useOktaTokens.mockImplementation(() => ({
      getUserName: () => "AnotherUser@example.com", //#nosec
    }));
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);

    const input = screen.queryByText("measureRationaleInput");
    expect(input).not.toBeInTheDocument();
  });
});
