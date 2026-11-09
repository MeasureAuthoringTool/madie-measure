import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReportingTime from "./ReportingTime";
import { measureStore } from "@madie/madie-util";

const mockUpdate = jest.fn();
const mockGetValueSet = jest.fn();
const mockExpand = jest.fn();
const mockSetError = jest.fn();

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: () => ({ updateMeasure: mockUpdate }),
  measureStore: {
    state: {},
    subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
    updateMeasure: jest.fn(),
  },
  routeHandlerStore: { updateRouteHandlerState: jest.fn() },
}));
jest.mock("../../testCases/api/useFhirDefinitionsService", () => () => ({
  getValueSetDefinition: mockGetValueSet,
}));
jest.mock("../../testCases/api/useTerminologyServiceApi", () => () => ({
  getValueSetsExpansionForUrls: mockExpand,
}));

describe("ReportingTime", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (measureStore as any).state = {
      id: "measure-id",
      model: "QI-Core v6.0.0",
      measureMetaData: { description: "Existing" },
    };
    mockGetValueSet.mockResolvedValue({
      expansion: {
        contains: [
          { code: "d", display: "day" },
          { code: "wk", display: "week" },
        ],
      },
    });
    mockUpdate.mockImplementation(async (measure) => ({
      status: 200,
      data: measure,
    }));
  });

  const renderForm = (canEdit = true) =>
    render(
      <ReportingTime setErrorMessage={mockSetError} measureCanEdit={canEdit} />
    );

  it("places field guidance below the inputs and associates it with each field", async () => {
    renderForm();
    const frequency = screen.getByTestId("reporting-frequency");
    const period = screen.getByTestId("reporting-period");
    const frequencyGuidance = screen.getByText("Enter a positive whole number");
    const periodGuidance = screen.getByText("Enter a decimal value");

    expect(
      screen.getByRole("heading", { name: "Reporting Time" })
    ).toBeInTheDocument();
    expect(screen.getByText("Indicates required field")).toBeInTheDocument();
    expect(
      frequency.compareDocumentPosition(frequencyGuidance) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      period.compareDocumentPosition(periodGuidance) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(frequency).toHaveAccessibleDescription(
      "Enter a positive whole number"
    );
    expect(period).toHaveAccessibleDescription("Enter a decimal value");
    await waitFor(() => expect(mockGetValueSet).toHaveBeenCalled());
  });

  it("loads units and saves valid timing while rejecting invalid values", async () => {
    renderForm();
    expect(await waitFor(() => mockGetValueSet)).toHaveBeenCalledWith(
      "http://hl7.org/fhir/ValueSet/units-of-time",
      "QI-Core v6.0.0"
    );
    const frequency = screen.getByTestId("reporting-frequency");
    const period = screen.getByTestId("reporting-period");
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeDisabled();
    userEvent.type(frequency, "1.5");
    userEvent.type(period, "1.5");
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /Period Unit/ }));
    fireEvent.click(await screen.findByRole("option", { name: "day" }));
    expect(save).toBeDisabled();
    userEvent.clear(frequency);
    userEvent.type(frequency, "2");
    userEvent.type(screen.getByTestId("reporting-time-of-day"), "25:00:00");
    expect(save).toBeDisabled();
    userEvent.clear(screen.getByTestId("reporting-time-of-day"));
    userEvent.type(screen.getByTestId("reporting-time-of-day"), "08:30:00");
    await waitFor(() => expect(save).toBeEnabled());
    userEvent.click(save);
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          measureMetaData: {
            description: "Existing",
            reportingTiming: {
              repeat: {
                frequency: 2,
                period: 1.5,
                periodUnit: "d",
                timeOfDay: ["08:30:00"],
              },
            },
          },
        })
      )
    );
    expect(
      await screen.findByText("Reporting Time value saved successfully")
    ).toBeInTheDocument();
    expect(measureStore.updateMeasure).toHaveBeenCalled();
  });

  it("displays saved values and discards edits", async () => {
    (measureStore as any).state.measureMetaData.reportingTiming = {
      repeat: {
        frequency: 1,
        period: 0.5,
        periodUnit: "wk",
        timeOfDay: ["12:00:00"],
      },
    };
    renderForm();
    expect(screen.getByTestId("reporting-frequency")).toHaveValue("1");
    expect(screen.getByTestId("reporting-period")).toHaveValue("0.5");
    expect(screen.getByTestId("reporting-time-of-day")).toHaveValue("12:00:00");
    userEvent.clear(screen.getByTestId("reporting-frequency"));
    userEvent.type(screen.getByTestId("reporting-frequency"), "3");
    userEvent.click(screen.getByRole("button", { name: "Discard Changes" }));
    userEvent.click(screen.getByTestId("discard-dialog-continue-button"));
    expect(screen.getByTestId("reporting-frequency")).toHaveValue("1");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("does not offer editing actions in read-only mode", () => {
    renderForm(false);
    expect(screen.getByLabelText(/Frequency/)).toHaveAttribute("readonly");
    expect(
      screen.queryByRole("button", { name: "Save" })
    ).not.toBeInTheDocument();
  });

  it("shows a loading failure and does not allow saving without units", async () => {
    mockGetValueSet.mockResolvedValue(null);
    renderForm();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load period units"
    );
    userEvent.type(screen.getByTestId("reporting-frequency"), "1");
    userEvent.type(screen.getByTestId("reporting-period"), "1");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("uses value set concepts and saves without an optional time", async () => {
    mockGetValueSet.mockResolvedValue({
      expansion: { contains: [] },
      compose: { include: [{ concept: [{ code: "h", display: "hour" }] }] },
    });
    renderForm();
    userEvent.type(screen.getByTestId("reporting-frequency"), "1");
    userEvent.type(screen.getByTestId("reporting-period"), "0");
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /Period Unit/ }));
    fireEvent.click(await screen.findByRole("option", { name: "hour" }));
    const save = screen.getByRole("button", { name: "Save" });
    await waitFor(() => expect(save).toBeEnabled());
    userEvent.click(save);
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          measureMetaData: {
            description: "Existing",
            reportingTiming: {
              repeat: { frequency: 1, period: 0, periodUnit: "h" },
            },
          },
        })
      )
    );
  });

  it("reports save errors without marking the measure saved", async () => {
    mockUpdate.mockRejectedValue({
      response: { data: { message: "Save failed" } },
    });
    (measureStore as any).state.measureMetaData.reportingTiming = {
      repeat: { frequency: 1, period: 1, periodUnit: "d" },
    };
    renderForm();
    userEvent.clear(screen.getByTestId("reporting-frequency"));
    userEvent.type(screen.getByTestId("reporting-frequency"), "2");
    const save = screen.getByRole("button", { name: "Save" });
    await waitFor(() => expect(save).toBeEnabled());
    userEvent.click(save);
    await waitFor(() =>
      expect(mockSetError).toHaveBeenCalledWith("Save failed")
    );
    expect(measureStore.updateMeasure).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId("reporting-time-success")
    ).not.toBeInTheDocument();
  });
});
