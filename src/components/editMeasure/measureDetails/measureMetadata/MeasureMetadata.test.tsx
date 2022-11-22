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

jest.mock("../../../../api/useMeasureServiceApi");
const testUser = "john doe";
const mockMetaData = {
  steward: "Test Steward",
  description: "Test Description",
  copyright: "Test Copyright",
  disclaimer: "Test Disclaimer",
  rationale: "Test Rationale",
  guidance: "Test Guidance",
  riskAdjustment: "Test Risk Adjustment",
};

const mockMeasure = {
  id: "TestMeasureId",
  measureName: "The Measure for Testing",
  createdBy: testUser,
  measureMetaData: { ...mockMetaData },
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
} as Measure;

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: jest.fn(() => ({
    getUserName: jest.fn(() => testUser), //#nosec
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
  routeHandlerStore: {
    subscribe: (set) => {
      set({ canTravel: false, pendingPath: "" });
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

describe("MeasureRationale component", () => {
  let serviceApiMock: MeasureServiceApi;
  const DESCRIPTION = "Test Description";
  const COPYRIGHT = "Test Copyright";
  const DISCLAIMER = "Test Disclaimer";
  const RATIONALE = "Test Rationale";
  const GUIDANCE = "Test Guidance";
  const NEWVALUE = "Test New Value";
  const RISKADJUSTMENT = "Test Risk Adjustment";

  afterEach(cleanup);

  beforeEach(() => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValue(undefined),
    } as unknown as MeasureServiceApi;

    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
    mockMeasure.measureMetaData = { ...mockMetaData };
  });

  const expectInputValue = (
    element: HTMLTextAreaElement,
    value: string
  ): void => {
    expect(element).toBeInstanceOf(HTMLTextAreaElement);
    const inputEl = element as HTMLTextAreaElement;
    expect(inputEl.value).toBe(value);
  };
  const { queryByText, getByText, getByTestId, findByTestId, getAllByText } =
    screen;

  it("Should render empty titles with empty props", () => {
    render(<MeasureMetadataForm measureMetadataType="" />);
    expect(queryByText("Description")).toBeNull();
    expect(queryByText("Copyright")).toBeNull();
    expect(queryByText("Disclaimer")).toBeNull();
    expect(queryByText("Rationale")).toBeNull();
    expect(queryByText("Guidance")).toBeNull();
  });

  it("should render the MeasureMetadata component with the supplied rationale information", async () => {
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);

    expect(screen.getByTestId("measureRationale")).toBeInTheDocument();

    const input = screen.getByTestId(
      "measureRationaleInput"
    ) as HTMLTextAreaElement;
    expectInputValue(input, RATIONALE);

    expect(getAllByText("Rationale")).toBeTruthy();
    expect(queryByText("Description")).toBeNull();
    expect(queryByText("Copyright")).toBeNull();
    expect(queryByText("Disclaimer")).toBeNull();
    expect(queryByText("Guidance")).toBeNull();
  });

  it("should default the measureMetadata if none is supplied", () => {
    mockMeasure.measureMetaData = {};
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);

    const input = getByTestId("measureRationaleInput") as HTMLTextAreaElement;
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

  it("Should display Description validation error when input is empty", async () => {
    render(<MeasureMetadataForm measureMetadataType="Description" />);

    const input = getByTestId("measureDescriptionInput") as HTMLTextAreaElement;
    expectInputValue(input, "Test Description");
    const saveBtn = getByTestId("measureDescriptionSave");
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).not.toBeEnabled();

    act(() => {
      fireEvent.change(input, {
        target: { value: "" },
      });
    });

    act(() => {
      fireEvent.click(saveBtn);
    });
  });

  it("Should not display validation error and save empty input successfully for metadata that does not need validation", async () => {
    render(<MeasureMetadataForm measureMetadataType="Copyright" />);

    const input = getByTestId("measureCopyrightInput") as HTMLTextAreaElement;
    expectInputValue(input, "Test Copyright");
    const saveBtn = getByTestId("measureCopyrightSave");
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).not.toBeEnabled();

    act(() => {
      fireEvent.change(input, {
        target: { value: "" },
      });
    });

    act(() => {
      fireEvent.click(saveBtn);
    });
    await waitFor(() =>
      expect(
        getByText("Measure Copyright Information Saved Successfully")
      ).toBeInTheDocument()
    );
    const toastCloseButton = await screen.findByRole("button", {
      name: "close",
    });
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    expect(toastCloseButton).not.toBeInTheDocument();
  });

  it("should update the rationale input field when a user types a new value", async () => {
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);

    const input = getByTestId("measureRationaleInput") as HTMLTextAreaElement;
    await waitFor(() => expectInputValue(input, RATIONALE));

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

    expect(mockMeasure.measureMetaData.description).toBe(DESCRIPTION);
    expect(mockMeasure.measureMetaData.copyright).toBe(COPYRIGHT);
    expect(mockMeasure.measureMetaData.disclaimer).toBe(DISCLAIMER);
    expect(mockMeasure.measureMetaData.rationale).toBe(NEWVALUE);
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

  it("should reset form on discard changes", async () => {
    render(
      <MeasureMetadataForm
        measureMetadataType="Clinical Recommendation Statement"
        header="Clinical Recommendation"
      />
    );

    const result = getByTestId("measureClinical Recommendation Statement");
    expect(result).toBeInTheDocument();
    const cancelButton = getByTestId("cancel-button");

    const input = getByTestId(
      "measureClinical Recommendation StatementInput"
    ) as HTMLTextAreaElement;
    expectInputValue(input, "");
    expect(cancelButton).toHaveProperty("disabled", true);
    act(() => {
      fireEvent.change(input, {
        target: { value: "test-value" },
      });
    });
    fireEvent.blur(input);
    expectInputValue(input, "test-value");
    expect(cancelButton).toHaveProperty("disabled", false);

    fireEvent.click(cancelButton);
    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const continueButton = await screen.getByTestId(
      "discard-dialog-continue-button"
    );
    expect(continueButton).toBeInTheDocument();
    fireEvent.click(continueButton);
    await waitFor(() => {
      // check for old value
      expect(input.value).toBe("");
    });
  });

  it("should close dialog on dialog cancel discard changes", async () => {
    render(
      <MeasureMetadataForm
        measureMetadataType="Clinical Recommendation Statement"
        header="Clinical Recommendation"
      />
    );

    const result = getByTestId("measureClinical Recommendation Statement");
    expect(result).toBeInTheDocument();
    const cancelButton = getByTestId("cancel-button");

    const input = getByTestId(
      "measureClinical Recommendation StatementInput"
    ) as HTMLTextAreaElement;
    expectInputValue(input, "");
    expect(cancelButton).toHaveProperty("disabled", true);
    act(() => {
      fireEvent.change(input, {
        target: { value: "test-value" },
      });
    });
    fireEvent.blur(input);
    expectInputValue(input, "test-value");
    expect(cancelButton).toHaveProperty("disabled", false);

    fireEvent.click(cancelButton);
    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();

    expect(queryByText("You have unsaved changes.")).toBeVisible();
    const discardDialogCancelButton = screen.getByTestId(
      "discard-dialog-cancel-button"
    );
    expect(discardDialogCancelButton).toBeInTheDocument();
    fireEvent.click(discardDialogCancelButton);
    await waitFor(() => {
      expect(queryByText("You have unsaved changes.")).not.toBeVisible();
    });
  });

  it("Should have no Save button if user does not have measure edit permissions", () => {
    useOktaTokens.mockImplementation(() => ({
      getUserName: () => "AnotherUser@example.com", //#nosec
    }));
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);

    const saveButton = screen.queryByText("measureRationaleSave");
    expect(saveButton).not.toBeInTheDocument();
  });

  it("Should have no input field if user does not have measure edit permissions", () => {
    useOktaTokens.mockImplementation(() => ({
      getUserName: () => "AnotherUser@example.com", //#nosec
    }));
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);

    const input = screen.queryByText("measureRationaleInput");
    expect(input).not.toBeInTheDocument();
  });

  it("Should have Save button if the measure is shared with the user", async () => {
    useOktaTokens.mockImplementation(() => ({
      getUserName: () => "othertestuser@example.com", //#nosec
    }));
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);

    const saveButton = await screen.findByRole("button", { name: "Save" });
    await waitFor(() => expect(saveButton).toBeInTheDocument());
  });

  it("Should have input field if the measure is shared with the user", async () => {
    useOktaTokens.mockImplementation(() => ({
      getUserName: () => "othertestuser@example.com", //#nosec
    }));
    render(<MeasureMetadataForm measureMetadataType="Rationale" />);

    const input = await screen.findByRole("textbox", { name: "Rationale" });
    await waitFor(() => expect(input).toBeInTheDocument());
  });
});
