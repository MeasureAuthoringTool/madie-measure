import { jest } from "@jest/globals";
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
import { checkUserCanEdit, useFeatureFlags } from "@madie/madie-util";
import userEvent from "@testing-library/user-event";

jest.mock("../../../../api/useMeasureServiceApi");
const setErrorMessage = jest.fn();
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
} as unknown as Measure;

jest.mock("@madie/madie-util", () => ({
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
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
  useFeatureFlags: jest.fn(() => {
    return {
      EnhancedTextFormatting: true,
    };
  }),
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

  describe("MeasureMetadataForm EnhancedTextFormatting is off", () => {
    beforeEach(() => {
      (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
        EnhancedTextFormatting: false,
      }));
    });

    it("should render empty titles with empty props", () => {
      render(
        <MeasureMetadataForm
          measureMetadataType=""
          setErrorMessage={setErrorMessage}
        />
      );
      expect(queryByText("Description")).toBeNull();
      expect(queryByText("Copyright")).toBeNull();
      expect(queryByText("Disclaimer")).toBeNull();
      expect(queryByText("Rationale")).toBeNull();
      expect(queryByText("Guidance")).toBeNull();
    });

    it("should render the MeasureMetadata component with the supplied rationale information", async () => {
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );

      expect(screen.getByTestId("measure-rationale")).toBeInTheDocument();

      const input = screen.getByTestId(
        "measure-rationale-input"
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
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );

      const input = getByTestId(
        "measure-rationale-input"
      ) as HTMLTextAreaElement;
      expectInputValue(input, "");

      const save = getByTestId("measure-rationale-save");
      fireEvent.click(save);

      expect(serviceApiMock.updateMeasure).not.toHaveBeenCalledWith({
        id: "test measure",
        measureMetaData: {
          rationale: undefined,
        },
      });
    });

    it("should display Description validation error when input is empty", async () => {
      render(
        <MeasureMetadataForm
          measureMetadataType="Description"
          setErrorMessage={setErrorMessage}
        />
      );

      const input = getByTestId(
        "measure-description-input"
      ) as HTMLTextAreaElement;
      expectInputValue(input, "Test Description");
      const saveBtn = getByTestId("measure-description-save");
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

    it("should not display validation error and save empty input successfully for metadata that does not need validation", async () => {
      render(
        <MeasureMetadataForm
          measureMetadataType="Copyright"
          setErrorMessage={setErrorMessage}
        />
      );

      const input = getByTestId(
        "measure-copyright-input"
      ) as HTMLTextAreaElement;
      expectInputValue(input, "Test Copyright");
      const saveBtn = getByTestId("measure-copyright-save");
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
      const toastCloseButton = await screen.findByTestId("close-error-button");
      expect(toastCloseButton).toBeInTheDocument();
      fireEvent.click(toastCloseButton);
      await waitFor(() => {
        expect(toastCloseButton).not.toBeInTheDocument();
      });
    });

    it("should update the rationale input field when a user types a new value", async () => {
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );

      const input = getByTestId(
        "measure-rationale-input"
      ) as HTMLTextAreaElement;
      await waitFor(() => expectInputValue(input, RATIONALE));

      fireEvent.change(input, {
        target: { value: NEWVALUE },
      });
      await waitFor(() => expectInputValue(input, NEWVALUE));
    });

    it("should save the rationale information when the form is submitted", async () => {
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );
      const input = getByTestId("measure-rationale-input");
      act(() => {
        fireEvent.change(input, {
          target: { value: NEWVALUE },
        });
      });
      const save = getByTestId("measure-rationale-save");
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

      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );
      const input = getByTestId("measure-rationale-input");
      fireEvent.change(input, {
        target: { value: NEWVALUE },
      });
      const save = getByTestId("measure-rationale-save");
      fireEvent.click(save);

      expect(setErrorMessage).toHaveBeenCalled;
    });

    it("should reset form on discard changes", async () => {
      render(
        <MeasureMetadataForm
          measureMetadataType="Clinical Recommendation Statement"
          header="Clinical Recommendation"
          setErrorMessage={setErrorMessage}
        />
      );

      const result = getByTestId("measure-clinical-recommendation-statement");
      expect(result).toBeInTheDocument();
      const discardButton = getByTestId("discard-button");

      const input = getByTestId(
        "measure-clinical-recommendation-statement-input"
      ) as HTMLTextAreaElement;
      expectInputValue(input, "");
      expect(discardButton).toHaveProperty("disabled", true);
      act(() => {
        fireEvent.change(input, {
          target: { value: "test-value" },
        });
      });
      fireEvent.blur(input);
      expectInputValue(input, "test-value");
      expect(discardButton).toHaveProperty("disabled", false);

      fireEvent.click(discardButton);
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
          setErrorMessage={setErrorMessage}
        />
      );

      const result = getByTestId("measure-clinical-recommendation-statement");
      expect(result).toBeInTheDocument();
      const discardButton = getByTestId("discard-button");

      const input = getByTestId(
        "measure-clinical-recommendation-statement-input"
      ) as HTMLTextAreaElement;
      expectInputValue(input, "");
      expect(discardButton).toHaveProperty("disabled", true);
      act(() => {
        fireEvent.change(input, {
          target: { value: "test-value" },
        });
      });
      fireEvent.blur(input);
      expectInputValue(input, "test-value");
      expect(discardButton).toHaveProperty("disabled", false);

      fireEvent.click(discardButton);
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
      (checkUserCanEdit as jest.Mock).mockImplementationOnce(() => {
        return false;
      });
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );

      const saveButton = screen.queryByText("measureRationaleSave");
      expect(saveButton).not.toBeInTheDocument();
    });

    it("Should have no input field if user does not have measure edit permissions", () => {
      (checkUserCanEdit as jest.Mock).mockImplementationOnce(() => {
        return false;
      });
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );

      const input = screen.queryByText("measureRationaleInput");
      expect(input).not.toBeInTheDocument();
    });

    it("Should have Save button if the measure is shared with the user", async () => {
      (checkUserCanEdit as jest.Mock).mockImplementationOnce(() => {
        return false;
      });
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );

      const saveButton = await screen.findByRole("button", { name: "Save" });
      await waitFor(() => expect(saveButton).toBeInTheDocument());
    });

    it("Should have input field if the measure is shared with the user", async () => {
      (checkUserCanEdit as jest.Mock).mockImplementationOnce(() => {
        return false;
      });
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );

      const input = await screen.findByRole("textbox", { name: "Rationale" });
      await waitFor(() => expect(input).toBeInTheDocument());
    });

    it("Should display 'required' when required prop is passed", async () => {
      (checkUserCanEdit as jest.Mock).mockImplementationOnce(() => {
        return false;
      });
      render(
        <MeasureMetadataForm
          required
          measureMetadataType="Description"
          setErrorMessage={setErrorMessage}
        />
      );

      const input = await screen.findByRole("textbox", { name: "Description" });
      await waitFor(() => expect(input).toBeInTheDocument());
      const requiredText = await screen.findByText("Indicates required field");
      expect(requiredText).toBeInTheDocument();
    });
  });
  describe("MeasureMetadataForm when EnhancedTextFormatting is on", () => {
    beforeEach(() => {
      (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
        EnhancedTextFormatting: true,
      }));
    });

    it("should render the rich text editor with the supplied rationale information", () => {
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );

      expect(screen.getByTestId("measure-rationale")).toBeInTheDocument();

      const rationaleEditor = screen.getByRole("textbox");
      expect(rationaleEditor).toHaveTextContent(RATIONALE);

      expect(getAllByText("Rationale")).toBeTruthy();
      expect(queryByText("Description")).toBeNull();
      expect(queryByText("Copyright")).toBeNull();
      expect(queryByText("Disclaimer")).toBeNull();
      expect(queryByText("Guidance")).toBeNull();
    });

    it("should default rich text editor to blank metadata if none is supplied", () => {
      mockMeasure.measureMetaData = {};
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );

      const rationaleEditor = screen.getByRole("textbox");
      expect(rationaleEditor).toHaveTextContent("");

      const saveBtn = getByTestId("measure-rationale-save");
      fireEvent.click(saveBtn);

      expect(serviceApiMock.updateMeasure).not.toHaveBeenCalledWith({
        id: "test measure",
        measureMetaData: {
          rationale: undefined,
        },
      });
    });

    it("should not display validation error and save empty input successfully for metadata that does not need validation", async () => {
      render(
        <MeasureMetadataForm
          measureMetadataType="Copyright"
          setErrorMessage={setErrorMessage}
        />
      );

      const copyRightEditor = screen.getByRole("textbox");
      expect(copyRightEditor).toHaveTextContent("Test Copyright");
      fireEvent.change(copyRightEditor, { target: { innerHTML: "" } });
      await waitFor(() => {
        expect(getByTestId("measure-copyright-save")).toBeEnabled();
      });
      userEvent.click(getByTestId("measure-copyright-save"));
      await waitFor(() =>
        expect(
          getByText("Measure Copyright Information Saved Successfully")
        ).toBeInTheDocument()
      );
      const toastCloseButton = await screen.findByTestId("close-error-button");
      expect(toastCloseButton).toBeInTheDocument();
      fireEvent.click(toastCloseButton);
      await waitFor(() => {
        expect(toastCloseButton).not.toBeInTheDocument();
      });
    });

    it("should update the rationale input field when a user types a new value", async () => {
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );

      const rationaleEditor = screen.getByRole("textbox");
      expect(rationaleEditor).toHaveTextContent(RATIONALE);

      fireEvent.change(rationaleEditor, {
        target: { innerHTML: NEWVALUE },
      });
      expect(rationaleEditor).toHaveTextContent(NEWVALUE);
    });

    it("should render an error message if the measure rationale cannot be saved", async () => {
      serviceApiMock.updateMeasure = jest.fn().mockRejectedValue("Save error");

      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );
      const rationaleEditor = screen.getByRole("textbox");
      fireEvent.change(rationaleEditor, {
        target: { innerHTML: NEWVALUE },
      });
      userEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(setErrorMessage).toHaveBeenCalled;
    });

    it("should reset rich text editor on discard changes", async () => {
      render(
        <MeasureMetadataForm
          measureMetadataType="Clinical Recommendation Statement"
          header="Clinical Recommendation"
          setErrorMessage={setErrorMessage}
        />
      );

      const clinicalRecommendation = getByTestId(
        "measure-clinical-recommendation-statement"
      );
      expect(clinicalRecommendation).toBeInTheDocument();
      const discardButton = getByTestId("discard-button");

      const editor = screen.getByRole("textbox");
      expect(editor).toHaveTextContent("");
      expect(discardButton).toHaveProperty("disabled", true);
      fireEvent.change(editor, {
        target: { innerHTML: "test-value" },
      });
      expect(editor).toHaveTextContent("test-value");
      await waitFor(() => {
        expect(discardButton).toBeEnabled();
      });
      userEvent.click(discardButton);
      await waitFor(() => {
        const discardDialog = screen.getByTestId("discard-dialog");
        expect(discardDialog).toBeInTheDocument();
      });
      const continueButton = screen.getByRole("button", {
        name: "Yes, Discard All Changes",
      });
      expect(continueButton).toBeInTheDocument();
      userEvent.click(continueButton);
      await waitFor(() => {
        // check for old value
        expect(screen.getByRole("textbox")).toHaveTextContent("");
      });
    });

    it("should close dialog on dialog cancel discard changes", async () => {
      render(
        <MeasureMetadataForm
          measureMetadataType="Clinical Recommendation Statement"
          header="Clinical Recommendation"
          setErrorMessage={setErrorMessage}
        />
      );

      const result = getByTestId("measure-clinical-recommendation-statement");
      expect(result).toBeInTheDocument();
      const discardButton = screen.getByRole("button", {
        name: "Discard Changes",
      });

      const editor = screen.getByRole("textbox");
      expect(editor).toHaveTextContent("");
      expect(discardButton).toHaveProperty("disabled", true);
      fireEvent.change(editor, {
        target: { innerHTML: "test-value" },
      });
      expect(editor).toHaveTextContent("test-value");
      await waitFor(() => {
        expect(discardButton).toBeEnabled();
      });
      userEvent.click(discardButton);
      const discardDialog = screen.getByTestId("discard-dialog");
      expect(discardDialog).toBeInTheDocument();

      expect(queryByText("You have unsaved changes.")).toBeVisible();
      const discardDialogCancelButton = screen.getByRole("button", {
        name: "No, Keep Working",
      });
      expect(discardDialogCancelButton).toBeInTheDocument();
      userEvent.click(discardDialogCancelButton);
      await waitFor(() => {
        expect(queryByText("You have unsaved changes.")).not.toBeVisible();
      });
    });

    it("should have no Save button if user does not have measure edit permissions", () => {
      (checkUserCanEdit as jest.Mock).mockImplementationOnce(() => {
        return false;
      });
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );

      const saveButton = screen.getByRole("button", { name: "Save" });
      expect(saveButton).toBeDisabled();
    });

    it("should have no input field if user does not have measure edit permissions", () => {
      (checkUserCanEdit as jest.Mock).mockImplementationOnce(() => {
        return false;
      });
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );

      waitFor(() => {
        const editor = screen.getByRole("textbox");
        expect(editor).not.toBeInTheDocument();
      });
    });

    it("should have Save button if the measure is shared with the user", async () => {
      (checkUserCanEdit as jest.Mock).mockImplementationOnce(() => {
        return false;
      });
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );

      const saveButton = await screen.findByRole("button", { name: "Save" });
      await waitFor(() => expect(saveButton).toBeInTheDocument());
    });

    it("should have input field if the measure is shared with the user", async () => {
      (checkUserCanEdit as jest.Mock).mockImplementationOnce(() => {
        return false;
      });
      render(
        <MeasureMetadataForm
          measureMetadataType="Rationale"
          setErrorMessage={setErrorMessage}
        />
      );

      const input = await screen.findByRole("textbox");
      await waitFor(() => expect(input).toBeInTheDocument());
    });

    it("Should display 'required' when required prop is passed", async () => {
      (checkUserCanEdit as jest.Mock).mockImplementationOnce(() => {
        return false;
      });
      render(
        <MeasureMetadataForm
          required
          measureMetadataType="Description"
          setErrorMessage={setErrorMessage}
        />
      );

      const input = await screen.findByRole("textbox");
      await waitFor(() => expect(input).toBeInTheDocument());
      const requiredText = await screen.findByText("Indicates required field");
      expect(requiredText).toBeInTheDocument();
    });
  });
});
