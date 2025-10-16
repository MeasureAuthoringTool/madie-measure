import * as React from "react";
import {
  act,
  waitFor,
  render,
  cleanup,
  fireEvent,
  screen,
} from "@testing-library/react";

import {
  useMeasureServiceApi,
  MeasureServiceApi,
  checkUserCanEdit,
  measureStore,
} from "@madie/madie-util";
import { Measure } from "@madie/madie-models";
import MeasureMetadataForm from "./MeasureMetadata";

import userEvent from "@testing-library/user-event";

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

const mockMeasureServiceApi = {
  updateMeasure: jest.fn().mockResolvedValue(undefined),
} as unknown as MeasureServiceApi;

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
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

  describe("MeasureMetadataForm tests", () => {
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
