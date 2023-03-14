import * as React from "react";
import ReviewInfo from "./ReviewInfo";
import { render, screen, waitFor } from "@testing-library/react";
import { Measure } from "@madie/madie-models";

const testMeasure = {
  id: "testMeasureId",
  createdBy: "testCreatedBy",
  model: "QI-Core v4.1.1",
  measureName: "the measure for testing",
  cqlLibraryName: "TestCqlLibraryName",
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/01/2023",
  measurementPeriodEnd: "12/31/2023",
  reviewMetaData: {
    approvalDate: "2029-02-12T08:00:00.000+00:00",
    lastReviewDate: "2021-01-11T08:00:00.000+00:00",
  },
  measureSetId: "testMeasureSetId",
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }], //#nosec
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

  const { getByTestId, queryByText } = screen;

  const RenderReviewInfo = () => {
    return render(<ReviewInfo />);
  };

  test("Renders items to the screen", async () => {
    await waitFor(() => RenderReviewInfo());
    expect(queryByText("Approval Date")).toBeVisible();
    expect(queryByText("Last Review Date")).toBeVisible();
    expect(getByTestId("approval-date-input").value).toBe("1/1/2023");
    expect(getByTestId("review-date-input").value).toBe("12/31/2023");
  });
});
