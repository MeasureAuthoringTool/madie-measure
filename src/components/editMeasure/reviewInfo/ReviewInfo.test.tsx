import * as React from "react";
import ReviewInfo from "./ReviewInfo";
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from "@testing-library/react";
import { Measure } from "@madie/madie-models";
import { act } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";

const testMeasure = {
  id: "testMeasureId",
  createdBy: "testCreatedBy",
  model: "QI-Core v4.1.1",
  measureName: "the measure for testing",
  cqlLibraryName: "TestCqlLibraryName",
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/01/2023",
  measurementPeriodEnd: "12/31/2023",
  measureSetId: "testMeasureSetId",
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
  programUseContext: {
    code: "ep-ec",
    display: "EP/EC",
    codeSystem:
      "http://hl7.org/fhir/us/cqfmeasures/CodeSystem/quality-programs",
  },
} as unknown as Measure;

jest.mock("@madie/madie-util", () => ({
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
  useKeyPress: jest.fn(() => false),
  measureStore: {
    updateMeasure: jest.fn((measure) => testMeasure),
    state: jest.fn().mockImplementation(() => testMeasure),
    initialState: jest.fn().mockImplementation(() => testMeasure),
    subscribe: (set) => {
      // set(measure)
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
  PROGRAM_USE_CONTEXTS: [
    {
      code: "mips",
      display: "MIPS",
      codeSystem:
        "http://hl7.org/fhir/us/cqfmeasures/CodeSystem/quality-programs",
    },
    {
      code: "ep-ec",
      display: "EP/EC",
      codeSystem:
        "http://hl7.org/fhir/us/cqfmeasures/CodeSystem/quality-programs",
    },
  ],
}));

describe("Review Info component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const { getByTestId, getByText, queryByText, getByRole } = screen;

  const RenderReviewInfo = () => {
    return render(<ReviewInfo />);
  };

  test("Renders ReviewInfo with Discard and Save buttons disabled", async () => {
    await waitFor(() => RenderReviewInfo());

    const reviewInfo = getByTestId("review-info");
    expect(reviewInfo).toBeInTheDocument();

    const programUseContextSelect = screen.getByTestId("programUseContext");
    expect(programUseContextSelect).toBeInTheDocument();
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    }) as HTMLButtonElement;
    expect(discardButton).toBeDisabled();
    const saveButton = screen.getByRole("button", {
      name: "Save",
    }) as HTMLButtonElement;
    expect(saveButton).toBeDisabled();
  });

  test("Click on dropdown displays different options", async () => {
    await waitFor(() => RenderReviewInfo());

    const reviewInfo = getByTestId("review-info");
    expect(reviewInfo).toBeInTheDocument();

    const programUseContextSelect = screen.getByTestId("programUseContext");
    expect(programUseContextSelect).toBeInTheDocument();
    const programUseContextButton = screen.getByRole("button", {
      name: "Open",
    });

    act(() => {
      userEvent.click(programUseContextButton);
    });

    expect(getByText("MIPS")).toBeInTheDocument();
    expect(getByText("EP/EC")).toBeInTheDocument();
  });

  test("Change value enables Discard and Save buttons", async () => {
    await waitFor(() => RenderReviewInfo());

    const reviewInfo = getByTestId("review-info");
    expect(reviewInfo).toBeInTheDocument();

    const programUseContextSelect = screen.getByTestId("programUseContext");
    expect(programUseContextSelect).toBeInTheDocument();
    const programUseContextButton = screen.getByRole("button", {
      name: "Open",
    });

    act(() => {
      userEvent.click(programUseContextButton);
    });

    expect(getByText("MIPS")).toBeInTheDocument();
    expect(getByText("EP/EC")).toBeInTheDocument();

    const changed = screen.getByText("MIPS");

    act(() => {
      userEvent.click(changed);
    });

    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    }) as HTMLButtonElement;
    expect(discardButton).toBeEnabled();
    const saveButton = screen.getByRole("button", {
      name: "Save",
    }) as HTMLButtonElement;
    expect(saveButton).toBeEnabled();
  });

  test("Click Discard button, discard dialog shows. Click Continue and changes will be discarded", async () => {
    await waitFor(() => RenderReviewInfo());

    const reviewInfo = getByTestId("review-info");
    expect(reviewInfo).toBeInTheDocument();

    const programUseContextSelect = screen.getByTestId("programUseContext");
    expect(programUseContextSelect).toBeInTheDocument();
    const programUseContextButton = screen.getByRole("button", {
      name: "Open",
    });

    act(() => {
      userEvent.click(programUseContextButton);
    });

    expect(getByText("MIPS")).toBeInTheDocument();
    expect(getByText("EP/EC")).toBeInTheDocument();

    const changed = screen.getByText("MIPS");

    act(() => {
      userEvent.click(changed);
    });

    const cancelButton = getByTestId("cancel-button");
    const saveButton = getByTestId(`measure-Review Info-save`);
    act(() => {
      userEvent.click(cancelButton);
    });
    await waitFor(() => {
      expect(queryByText("MIPS")).not.toBeInTheDocument();
    });
    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    expect(queryByText("You have unsaved changes.")).toBeVisible();

    const continueButton = await screen.getByTestId(
      "discard-dialog-continue-button"
    );
    expect(continueButton).toBeInTheDocument();
    fireEvent.click(continueButton);
    await waitFor(() => {
      // check for old value
      expect(cancelButton).toHaveProperty("disabled", true);
      expect(saveButton).toHaveProperty("disabled", true);
    });
  });

  test("Click Discard button, discard dialog shows. Click Keep Working button and original value remains", async () => {
    await waitFor(() => RenderReviewInfo());

    const reviewInfo = getByTestId("review-info");
    expect(reviewInfo).toBeInTheDocument();

    const programUseContextSelect = screen.getByTestId("programUseContext");
    expect(programUseContextSelect).toBeInTheDocument();
    const programUseContextButton = screen.getByRole("button", {
      name: "Open",
    });

    act(() => {
      userEvent.click(programUseContextButton);
    });

    expect(getByText("MIPS")).toBeInTheDocument();
    expect(getByText("EP/EC")).toBeInTheDocument();

    const changed = screen.getByText("MIPS");

    act(() => {
      userEvent.click(changed);
    });

    const cancelButton = getByTestId("cancel-button");
    act(() => {
      userEvent.click(cancelButton);
    });
    await waitFor(() => {
      expect(queryByText("MIPS")).not.toBeInTheDocument();
    });
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

  test("Click Clear icon clears selected value and Discard and Save buttons are disabled", async () => {
    await waitFor(() => RenderReviewInfo());

    const reviewInfo = getByTestId("review-info");
    expect(reviewInfo).toBeInTheDocument();

    const programUseContextSelect = getByTestId("programUseContext");
    expect(programUseContextSelect).toBeInTheDocument();
    const programUseContextButton = getByRole("button", {
      name: "Open",
    });

    act(() => {
      userEvent.click(programUseContextButton);
    });

    expect(getByText("MIPS")).toBeInTheDocument();
    expect(getByText("EP/EC")).toBeInTheDocument();
    const programUseContextOptions = await screen.findAllByRole("option");
    expect(programUseContextOptions.length).toBe(2);

    const programUseContextComboBox = within(programUseContextSelect).getByRole(
      "combobox"
    );
    expect(programUseContextComboBox).toHaveValue("EP/EC");

    const closeIcon = getByTestId("CloseIcon");
    act(() => {
      userEvent.click(closeIcon);
    });
    expect(programUseContextComboBox).not.toHaveValue("EP/EC");
  });

  test("Click Save button will save the change", async () => {
    await waitFor(() => RenderReviewInfo());

    const reviewInfo = getByTestId("review-info");
    expect(reviewInfo).toBeInTheDocument();

    const programUseContextSelect = getByTestId("programUseContext");
    expect(programUseContextSelect).toBeInTheDocument();
    const programUseContextButton = getByRole("button", {
      name: "Open",
    });

    act(() => {
      userEvent.click(programUseContextButton);
    });

    expect(getByText("MIPS")).toBeInTheDocument();
    expect(getByText("EP/EC")).toBeInTheDocument();
    const programUseContextOptions = await screen.findAllByRole("option");
    expect(programUseContextOptions.length).toBe(2);

    const programUseContextComboBox = within(programUseContextSelect).getByRole(
      "combobox"
    );
    expect(programUseContextComboBox).toHaveValue("EP/EC");

    const changed = screen.getByText("MIPS");

    act(() => {
      userEvent.click(changed);
    });
    expect(programUseContextComboBox).not.toHaveValue("EP/EC");
    expect(programUseContextComboBox).toHaveValue("MIPS");

    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    }) as HTMLButtonElement;
    expect(discardButton).toBeEnabled();
    const saveButton = screen.getByRole("button", {
      name: "Save",
    }) as HTMLButtonElement;
    expect(saveButton).toBeEnabled();
    act(() => {
      fireEvent.click(saveButton);
    });
  });
});
