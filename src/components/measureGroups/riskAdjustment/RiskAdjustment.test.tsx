import * as React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, test } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import RiskAdjustment from "./RiskAdjustment";
import { Measure } from "@madie/madie-models";
import { act } from "react-dom/test-utils";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../api/useMeasureServiceApi";
const testMeasure = {
  id: "test measure",
  cql: `library C4r version '0.0.000'
  using QICore version '4.1.1'
  include FHIRHelpers version '4.1.000' called FHIRHelpers
  valueset "Office Visit": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1001'
  valueset "Annual Wellness Visit": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.526.3.1240'
  valueset "Preventive Care Services - Established Office Visit, 18 and Up": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1025'
  valueset "Preventive Care Services-Initial Office Visit, 18 and Up": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1023'
  valueset "Home Healthcare Services": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1016'
  parameter "Measurement Period" Interval<DateTime>
  default Interval[@2019-01-01T00:00:00.0, @2020-01-01T00:00:00.0)
  context Patient
  define "Initial Population":
  exists "Qualifying Encounters"
  define "Qualifying Encounters":
  (
  [Encounter: "Office Visit"]
  union [Encounter: "Annual Wellness Visit"]
  union [Encounter: "Preventive Care Services - Established Office Visit, 18 and Up"]
  union [Encounter: "Preventive Care Services-Initial Office Visit, 18 and Up"]
  union [Encounter: "Home Healthcare Services"]
  ) ValidEncounter
  where ValidEncounter.period during "Measurement Period"
  define "Initial PopulationOne":
  true`,
  createdBy: "matt",
  model: "QI-Core v4.1.1",
  measureName: "the measure for testing",
  cqlLibraryName: "TestCqlLibraryName",
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/01/2022",
  measurementPeriodEnd: "12/02/2022",
  measureSetId: "testMeasureId",
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
  riskAdjustments: [],
} as unknown as Measure;

jest.mock("../../../api/useMeasureServiceApi");
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
}));
const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
let serviceApiMock: MeasureServiceApi;

describe("MetaDataWrapper", () => {
  beforeEach(() => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValue(undefined),
    } as unknown as MeasureServiceApi;

    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
    // mockMeasure.measureMetaData = { ...mockMetaData };
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  const { getByTestId, getByText, queryByText } = screen;

  const RenderRiskAdjustment = () => {
    return render(<RiskAdjustment />);
  };

  test("RiskAdjustment renders with props, props trigger as expected, basic add remove work", async () => {
    await waitFor(() => RenderRiskAdjustment());
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    const riskAdjustmentButton = screen.getByRole("button", {
      name: "Open",
    });

    act(() => {
      userEvent.click(riskAdjustmentButton);
    });

    expect(screen.getByText("Initial Population")).toBeInTheDocument();
    expect(screen.getByText("Initial PopulationOne")).toBeInTheDocument();
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();

    userEvent.type(riskAdjustmentButton, "Qua");
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();
    const target = screen.getByText("Qualifying Encounters");
    act(() => {
      userEvent.click(target);
    });
    await waitFor(() => {
      expect(
        getByTestId("Qualifying Encounters-description")
      ).toBeInTheDocument();
    });
    const cancelIcon = getByTestId("CancelIcon");
    act(() => {
      userEvent.click(cancelIcon);
    });
    await waitFor(() => {
      expect(
        queryByText("Qualifying Encounters - Description")
      ).not.toBeInTheDocument();
    });
  });

  test("RiskAdjustment renders with props, props trigger as expected clear works", async () => {
    await waitFor(() => RenderRiskAdjustment());
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    const riskAdjustmentButton = screen.getByRole("button", {
      name: "Open",
    });

    act(() => {
      userEvent.click(riskAdjustmentButton);
    });

    expect(screen.getByText("Initial Population")).toBeInTheDocument();
    expect(screen.getByText("Initial PopulationOne")).toBeInTheDocument();
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();

    userEvent.type(riskAdjustmentButton, "Qua");
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();
    const target = screen.getByText("Qualifying Encounters");
    act(() => {
      userEvent.click(target);
    });
    await waitFor(() => {
      expect(
        getByTestId("Qualifying Encounters-description")
      ).toBeInTheDocument();
    });
    userEvent.click(riskAdjustmentButton);
    const closeIcon = getByTestId("CloseIcon");
    act(() => {
      userEvent.click(closeIcon);
    });
    await waitFor(() => {
      expect(
        queryByText("Qualifying Encounters - Description")
      ).not.toBeInTheDocument();
    });
  });

  test("RiskAdjustment description writing works.", async () => {
    await waitFor(() => RenderRiskAdjustment());
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    const riskAdjustmentButton = screen.getByRole("button", {
      name: "Open",
    });

    act(() => {
      userEvent.click(riskAdjustmentButton);
    });
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();
    userEvent.type(riskAdjustmentButton, "Qua");
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();
    const target = screen.getByText("Qualifying Encounters");

    act(() => {
      userEvent.click(target);
    });
    await waitFor(() => {
      expect(
        getByTestId("Qualifying Encounters-description")
      ).toBeInTheDocument();
    });

    const label = getByText("Qualifying Encounters - Description");
    expect(label).toBeInTheDocument();
    const textArea = getByTestId("Qualifying Encounters-description");
    expect(textArea.value).toEqual("");
    act(() => {
      userEvent.type(textArea, "p");
    });
    expect(textArea.value).toEqual("p");
  });

  test("Risk adjustment cancel discard works..", async () => {
    await waitFor(() => RenderRiskAdjustment());
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    const riskAdjustmentButton = screen.getByRole("button", {
      name: "Open",
    });

    act(() => {
      fireEvent.click(riskAdjustmentButton);
    });
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();
    userEvent.type(riskAdjustmentButton, "Qua");
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();
    const target = screen.getByText("Qualifying Encounters");

    act(() => {
      fireEvent.click(target);
    });
    await waitFor(() => {
      expect(
        getByTestId("Qualifying Encounters-description")
      ).toBeInTheDocument();
    });

    const label = getByText("Qualifying Encounters - Description");
    expect(label).toBeInTheDocument();
    const textArea = getByTestId("Qualifying Encounters-description");
    expect(textArea.value).toEqual("");
    act(() => {
      userEvent.type(textArea, "p");
    });
    expect(textArea.value).toEqual("p");
    const cancelButton = getByTestId("cancel-button");
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

  test("It should reset after discarding changes", async () => {
    await waitFor(() => RenderRiskAdjustment());
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    const riskAdjustmentButton = screen.getByRole("button", {
      name: "Open",
    });

    act(() => {
      fireEvent.click(riskAdjustmentButton);
    });
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();
    userEvent.type(riskAdjustmentButton, "Qua");
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();
    const target = screen.getByText("Qualifying Encounters");

    act(() => {
      fireEvent.click(target);
    });
    await waitFor(() => {
      expect(
        getByTestId("Qualifying Encounters-description")
      ).toBeInTheDocument();
    });

    const label = getByText("Qualifying Encounters - Description");
    expect(label).toBeInTheDocument();
    const textArea = getByTestId("Qualifying Encounters-description");
    expect(textArea.value).toEqual("");

    act(() => {
      fireEvent.change(textArea, {
        target: { value: "test-value" },
      });
    });
    expect(textArea.value).toEqual("test-value");
    const cancelButton = getByTestId("cancel-button");
    const saveButton = getByTestId(`measure-Risk Adjustment-save`);

    expect(cancelButton).toHaveProperty("disabled", false);
    expect(saveButton).toHaveProperty("disabled", false);

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
      expect(cancelButton).toHaveProperty("disabled", true);
      expect(saveButton).toHaveProperty("disabled", true);
    });
  });

  it("Save fails as expected", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockRejectedValueOnce({
        status: 500,
        response: { data: { message: "Sand in disk drive" } },
      }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
    await waitFor(() => RenderRiskAdjustment());
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    const riskAdjustmentButton = screen.getByRole("button", {
      name: "Open",
    });

    act(() => {
      fireEvent.click(riskAdjustmentButton);
    });
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();
    userEvent.type(riskAdjustmentButton, "Qua");
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();
    const target = screen.getByText("Qualifying Encounters");

    act(() => {
      fireEvent.click(target);
    });
    await waitFor(() => {
      expect(
        getByTestId("Qualifying Encounters-description")
      ).toBeInTheDocument();
    });

    const label = getByText("Qualifying Encounters - Description");
    expect(label).toBeInTheDocument();
    const textArea = getByTestId("Qualifying Encounters-description");
    act(() => {
      fireEvent.change(textArea, {
        target: { value: "test-value" },
      });
    });
    expect(textArea.value).toEqual("test-value");
    const cancelButton = getByTestId("cancel-button");
    const saveButton = getByTestId(`measure-Risk Adjustment-save`);

    expect(cancelButton).toHaveProperty("disabled", false);
    expect(saveButton).toHaveProperty("disabled", false);

    act(() => {
      fireEvent.click(saveButton);
    });
    await waitFor(
      () => expect(getByTestId("risk-adjustment-error")).toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );
  });

  it("Save works as expected", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValueOnce({
        status: 200,
        response: { data: { message: "update suceeded" } },
      }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
    await waitFor(() => RenderRiskAdjustment());
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    const riskAdjustmentButton = screen.getByRole("button", {
      name: "Open",
    });

    act(() => {
      fireEvent.click(riskAdjustmentButton);
    });
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();
    userEvent.type(riskAdjustmentButton, "Qua");
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();
    const target = screen.getByText("Qualifying Encounters");

    act(() => {
      fireEvent.click(target);
    });
    await waitFor(() => {
      expect(
        getByTestId("Qualifying Encounters-description")
      ).toBeInTheDocument();
    });

    const label = getByText("Qualifying Encounters - Description");
    expect(label).toBeInTheDocument();
    const textArea = getByTestId("Qualifying Encounters-description");
    act(() => {
      fireEvent.change(textArea, {
        target: { value: "test-value" },
      });
    });
    expect(textArea.value).toEqual("test-value");
    const cancelButton = getByTestId("cancel-button");
    const saveButton = getByTestId(`measure-Risk Adjustment-save`);

    expect(cancelButton).toHaveProperty("disabled", false);
    expect(saveButton).toHaveProperty("disabled", false);

    act(() => {
      fireEvent.click(saveButton);
    });
    await waitFor(
      () => expect(getByTestId("risk-adjustment-success")).toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );
  });

  // save fails
});
