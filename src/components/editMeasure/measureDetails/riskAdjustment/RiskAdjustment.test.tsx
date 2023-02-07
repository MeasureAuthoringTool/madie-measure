import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import RiskAdjustment from "./RiskAdjustment";
import { Measure } from "@madie/madie-models";

jest.mock("../../../../api/useMeasureServiceApi");

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
      set(testMeasure);
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: true, pendingPath: "" },
    initialState: { canTravel: true, pendingPath: "" },
  },
}));

describe("MetaDataWrapper", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const { getByTestId, getByText, queryByText } = screen;

  const RenderRiskAdjustment = () => {
    return render(<RiskAdjustment />);
  };

  test("RiskAdjustment renders with props, props trigger as expected", async () => {
    await waitFor(() => RenderRiskAdjustment());
    const riskAdjustmentSelect = screen.getByTestId("risk-adjustment-dropdown");
    expect(riskAdjustmentSelect).toBeInTheDocument();
    const measureGroupTypeSelectButton = screen.getByRole("button", {
      name: "Open",
    });

    userEvent.click(measureGroupTypeSelectButton);

    expect(screen.getByText("Initial Population")).toBeInTheDocument();
    expect(screen.getByText("Initial PopulationOne")).toBeInTheDocument();
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();

    userEvent.type(measureGroupTypeSelectButton, "Qua");
    expect(screen.getByText("Qualifying Encounters")).toBeInTheDocument();
    const target = screen.getByText("Qualifying Encounters");
    userEvent.click(target);
    await waitFor(() => {
      expect(
        getByTestId("Qualifying Encounters-description")
      ).toBeInTheDocument();
    });
  });
});
