import * as React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  within,
  act,
} from "@testing-library/react";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import { Measure } from "@madie/madie-models";
import QDMReporting from "./QDMReporting";
import userEvent from "@testing-library/user-event";
import {
  checkUserCanEdit,
  measureStore,
  useFeatureFlags,
} from "@madie/madie-util";

jest.mock("../../../../api/useMeasureServiceApi");

const measure = {
  id: "test measure",
  measureName: "the measure for testing",
  cqlLibraryName: "TestCqlLibraryName",
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/01/2022",
  measurementPeriodEnd: "12/02/2022",
  createdBy: "john doe",
  measureSetId: "testMeasureId",
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }], //#nosec
  rateAggregation: "",
} as unknown as Measure;

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
  useKeyPress: jest.fn(() => false),
  measureStore: {
    updateMeasure: jest.fn(),
    state: measure,
    initialState: jest.fn(),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  routeHandlerStore: {
    subscribe: (set) => {
      set();
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: true, pendingPath: "" },
    initialState: { canTravel: true, pendingPath: "" },
  },
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
}));

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

let serviceApiMock: MeasureServiceApi;
const increasedNotation = "Increased score indicates improvement";
const decreasedNotation = "Decreased score indicates improvement";
const otherNotation = "Other";

describe("QDMReporting component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    measureStore.state = jest.fn().mockImplementation(() => measure);
  });
  afterEach(() => {
    // Clean up after each test
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  const { getByText, getByRole, getByLabelText } = screen;

  test("QDMReporting renders to correctly with defaults", async () => {
    render(<QDMReporting />);

    const rateAggregation = await screen.getByTestId(
      "rate-aggregation-rich-text-editor"
    );
    expect(rateAggregation).toBeInTheDocument();
    expect(rateAggregation).toHaveTextContent("Rate Aggregation");

    const improvementNotation = getByLabelText(
      "Improvement Notation"
    ) as HTMLSelectElement;
    expect(improvementNotation).toHaveTextContent(
      "Select Improvement Notation"
    );
  });

  test("QDMReporting renders values correctly from measureStore", async () => {
    const newMeasure = {
      ...measure,
      rateAggregation: "Example Rate Aggregation",
      improvementNotation: "Increased score indicates improvement",
    };
    measureStore.state = jest.fn().mockImplementation(() => newMeasure);
    render(<QDMReporting />);

    const rateAggregation = await screen.getByTestId(
      "rate-aggregation-rich-text-editor"
    );
    expect(rateAggregation).toBeInTheDocument();
    expect(rateAggregation).toHaveTextContent("Example Rate Aggregation");

    const improvementNotation = getByLabelText(
      "Improvement Notation"
    ) as HTMLSelectElement;
    expect(improvementNotation).toHaveTextContent(
      "Increased score indicates improvement"
    );
  });

  test("Change enables Discard button and Keep working action should retain changes", async () => {
    render(<QDMReporting />);
    const descriptionEditor = screen.getByTestId(
      "rate-aggregation-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();

    const editableContent = within(descriptionEditor).getByRole("textbox");
    expect(editableContent).toHaveAttribute("contenteditable", "true");

    await act(async () => {
      fireEvent.focus(editableContent);
      editableContent.innerHTML = "test description";
      fireEvent.input(editableContent, {
        target: { innerHTML: "test description" },
      });
      fireEvent.blur(editableContent);
    });

    await selectAnOptionForImprovementNotation(decreasedNotation);

    const cancelButton = getByRole("button", {
      name: "Discard Changes",
    });
    expect(cancelButton).toBeInTheDocument();
    await waitFor(() => expect(cancelButton).toBeEnabled());
    fireEvent.click(cancelButton);

    const discardDialog = await getByRole("dialog", {
      name: "Discard Changes?",
    });
    expect(discardDialog).toBeInTheDocument();

    const continueButton = await getByRole("button", {
      name: "No, Keep Working",
    });
    expect(continueButton).toBeInTheDocument();
    fireEvent.click(continueButton);
    await waitFor(() => {
      expect(editableContent).toHaveTextContent("test");
      expect(getByLabelText("Improvement Notation")).toHaveTextContent(
        "Decreased score indicates improvement"
      );
    });
  });

  test("Change enables Discard button and Discard changes action should discard changes", async () => {
    render(<QDMReporting />);

    const descriptionEditor = screen.getByTestId(
      "rate-aggregation-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();

    const editableContent = within(descriptionEditor).getByRole("textbox");
    expect(editableContent).toHaveAttribute("contenteditable", "true");

    await act(async () => {
      fireEvent.focus(editableContent);
      editableContent.innerHTML = "test description";
      fireEvent.input(editableContent, {
        target: { innerHTML: "test description" },
      });
      fireEvent.blur(editableContent);
    });

    // Wait for debounced update to take effect (250ms delay from TextEditor component)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    await selectAnOptionForImprovementNotation(decreasedNotation);

    const cancelButton = getByRole("button", {
      name: "Discard Changes",
    });
    expect(cancelButton).toBeInTheDocument();
    await waitFor(() => expect(cancelButton).toBeEnabled());
    userEvent.click(cancelButton);
    const discardDialog = getByRole("dialog", {
      name: "Discard Changes?",
    });
    expect(discardDialog).toBeInTheDocument();

    const discardCancelButton = getByRole("button", {
      name: "Yes, Discard All Changes",
    });
    fireEvent.click(discardCancelButton);
    await waitFor(() => {
      expect(editableContent).toHaveTextContent("");
    });
    expect(getByLabelText("Improvement Notation")).toHaveTextContent(
      "Select Improvement Notation"
    );
  });

  test("Changes enables Save button and saving successfully displays success message", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

    render(<QDMReporting />);

    const descriptionEditor = screen.getByTestId(
      "rate-aggregation-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();

    const editableContent = within(descriptionEditor).getByRole("textbox");
    expect(editableContent).toHaveAttribute("contenteditable", "true");

    await act(async () => {
      fireEvent.focus(editableContent);
      editableContent.innerHTML = "Test";
      fireEvent.input(editableContent, {
        target: { innerHTML: "Test" },
      });
      fireEvent.blur(editableContent);
    });

    // Wait for debounced update to take effect (250ms delay from TextEditor component)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    await selectAnOptionForImprovementNotation(decreasedNotation);

    const saveButton = getByRole("button", {
      name: "Save",
    });
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);
    await waitFor(() =>
      expect(serviceApiMock.updateMeasure).toBeCalledWith({
        ...measure,
        rateAggregation: "<p>Test</p>",
        improvementNotation: "Decreased score indicates improvement",
        improvementNotationDescription: "",
      })
    );

    expect(
      await getByText("Measure Reporting Updated Successfully")
    ).toBeInTheDocument();

    const toastCloseButton = await getByRole("button", {
      name: "",
    });
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  test("Save with failure will display error message", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockRejectedValueOnce({
        status: 500,
        response: { data: { message: "update failed" } },
      }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

    render(<QDMReporting />);

    const descriptionEditor = screen.getByTestId(
      "rate-aggregation-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();

    const editableContent = within(descriptionEditor).getByRole("textbox");
    expect(editableContent).toHaveAttribute("contenteditable", "true");

    await act(async () => {
      fireEvent.focus(editableContent);
      editableContent.innerHTML = "Test";
      fireEvent.input(editableContent, {
        target: { innerHTML: "Test" },
      });
      fireEvent.blur(editableContent);
    });

    // Wait for debounced update to take effect (250ms delay from TextEditor component)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    await selectAnOptionForImprovementNotation(decreasedNotation);

    const saveButton = getByRole("button", {
      name: "Save",
    });
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);
    await waitFor(() =>
      expect(serviceApiMock.updateMeasure).toBeCalledWith({
        ...measure,
        rateAggregation: "<p>Test</p>",
        improvementNotation: "Decreased score indicates improvement",
        improvementNotationDescription: "",
      })
    );

    expect(
      await getByText("Error updating Measure Reporting: update failed")
    ).toBeInTheDocument();
    const toastCloseButton = await getByRole("button", {
      name: "",
    });
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  test("Improvement Notation description is mandatory for 'Other' Improvement Notation", async () => {
    render(<QDMReporting />);

    const descriptionEditor = screen.getByTestId(
      "improvement-notation-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();
    await selectAnOptionForImprovementNotation(otherNotation);
    const saveButton = getByRole("button", {
      name: "Save",
    });
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeDisabled());

    const editableContent = within(descriptionEditor).getByRole("textbox");
    expect(editableContent).toHaveAttribute("contenteditable", "true");

    await act(async () => {
      fireEvent.focus(editableContent);
      editableContent.innerHTML = "test description<";
      fireEvent.input(editableContent, {
        target: { innerHTML: "test description" },
      });
      fireEvent.blur(editableContent);
    });

    // Wait for debounced update to take effect (250ms delay from TextEditor component)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    await waitFor(() => expect(saveButton).toBeEnabled());
  });

  test("Improvement Notation description is not mandatory for Increased Improvement Notation", async () => {
    render(<QDMReporting />);
    const descriptionEditor = screen.getByTestId(
      "improvement-notation-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();
    await selectAnOptionForImprovementNotation(increasedNotation);
    // save btn should not be disabled
    await waitFor(() =>
      expect(
        getByRole("button", {
          name: "Save",
        })
      ).toBeEnabled()
    );
  });

  test("Improvement Notation description is not mandatory for 'Increased Improvement Notation'", async () => {
    render(<QDMReporting />);

    let editor = within(
      screen.getByTestId("improvement-notation-description-rich-text-editor")
    ).getByRole("textbox");
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute("contenteditable", "false");

    await selectAnOptionForImprovementNotation(increasedNotation);

    await waitFor(() => {
      editor = within(
        screen.getByTestId("improvement-notation-description-rich-text-editor")
      ).getByRole("textbox");
    });

    expect(editor).toHaveAttribute("contenteditable", "true");

    const saveButton = screen.getByRole("button", {
      name: "Save",
    });
    expect(saveButton).toBeInTheDocument();

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  });

  test("Improvement Notation description is mandatory for 'Other'", async () => {
    render(<QDMReporting />);

    let editor = within(
      screen.getByTestId("improvement-notation-description-rich-text-editor")
    ).getByRole("textbox");
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute("contenteditable", "false");

    await selectAnOptionForImprovementNotation(otherNotation);

    await waitFor(() => {
      editor = within(
        screen.getByTestId("improvement-notation-description-rich-text-editor")
      ).getByRole("textbox");
    });

    expect(editor).toHaveAttribute("contenteditable", "true");

    const saveButton = screen.getByRole("button", {
      name: "Save",
    });
    expect(saveButton).toBeInTheDocument();

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });

    fireEvent.input(editor, {
      target: { textContent: "Test description" },
    });

    expect(editor).toHaveTextContent("Test description");

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  });

  test("Improvement Notation and Increased Notation Description are both read only fields when checkUserCanEdit returns false", async () => {
    checkUserCanEdit.mockReturnValue(false);

    render(<QDMReporting />);

    const improvementNotationSelect = screen.getByTestId(
      "improvement-notation-select"
    ) as HTMLInputElement;
    expect(improvementNotationSelect).toHaveProperty("readOnly", true);
    expect(improvementNotationSelect).toHaveTextContent("-");

    const description = screen.getByTestId(
      "improvement-notation-description-rich-text-editor"
    );
    expect(description).toHaveTextContent("-");
  });
});

const selectAnOptionForImprovementNotation = async (notationValue) => {
  // verifies default value and selects a new value from options
  const improvementNotation = screen.getByLabelText(
    "Improvement Notation"
  ) as HTMLSelectElement;
  expect(improvementNotation).toHaveTextContent("Select Improvement Notation");
  userEvent.click(improvementNotation);
  const improvementNotationOptions = await screen.findByRole("listbox", {
    name: "Improvement Notation",
  });
  userEvent.click(
    within(improvementNotationOptions).getByRole("option", {
      name: notationValue,
    })
  );
  expect(improvementNotation).toHaveTextContent(notationValue);
};
