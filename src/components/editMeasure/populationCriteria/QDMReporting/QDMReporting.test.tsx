import * as React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import { Measure } from "@madie/madie-models";
import QDMReporting from "./QDMReporting";

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

describe("QDMReporting component", () => {
  const { getByText, getByRole } = screen;

  test("QDMReporting renders to correctly with defaults", async () => {
    render(<QDMReporting />);

    const rateAggregation = getByRole("textbox", {
      name: "Rate Aggregation",
    }) as HTMLInputElement;

    expect(rateAggregation).toHaveValue("");
  });

  test("Change enables Discard button and click Discard resets the form", async () => {
    render(<QDMReporting />);

    const rateAggregation = getByRole("textbox", {
      name: "Rate Aggregation",
    }) as HTMLInputElement;

    fireEvent.change(rateAggregation, {
      target: { value: "Test" },
    });
    expect(rateAggregation.value).toBe("Test");

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
      expect(rateAggregation.value).toBe("Test");
    });
  });

  test("Discard change then click Keep Working", async () => {
    render(<QDMReporting />);

    const rateAggregation = getByRole("textbox", {
      name: "Rate Aggregation",
    }) as HTMLInputElement;

    fireEvent.change(rateAggregation, {
      target: { value: "Test" },
    });
    expect(rateAggregation.value).toBe("Test");

    const cancelButton = getByRole("button", {
      name: "Discard Changes",
    });
    expect(cancelButton).toBeInTheDocument();
    await waitFor(() => expect(cancelButton).toBeEnabled());
    act(() => {
      fireEvent.click(cancelButton);
    });

    const discardDialog = await getByRole("dialog", {
      name: "Discard Changes?",
    });
    expect(discardDialog).toBeInTheDocument();

    const discardCancelButton = await getByRole("button", {
      name: "Yes, Discard All Changes",
    });
    fireEvent.click(discardCancelButton);
    await waitFor(() => {
      expect(rateAggregation.value).toBe("");
    });
  });

  test("Changes enables Save button and saving successfully displays success message", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

    render(<QDMReporting />);

    const rateAggregation = getByRole("textbox", {
      name: "Rate Aggregation",
    }) as HTMLInputElement;

    fireEvent.change(rateAggregation, {
      target: { value: "Test" },
    });
    expect(rateAggregation.value).toBe("Test");

    const saveButton = getByRole("button", {
      name: "Save",
    });
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);
    await waitFor(() =>
      expect(serviceApiMock.updateMeasure).toBeCalledWith({
        ...measure,
        rateAggregation: "Test",
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

    const rateAggregation = getByRole("textbox", {
      name: "Rate Aggregation",
    }) as HTMLInputElement;

    fireEvent.change(rateAggregation, {
      target: { value: "Test" },
    });
    expect(rateAggregation.value).toBe("Test");

    const saveButton = getByRole("button", {
      name: "Save",
    });
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);
    await waitFor(() =>
      expect(serviceApiMock.updateMeasure).toBeCalledWith({
        ...measure,
        rateAggregation: "Test",
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
});
