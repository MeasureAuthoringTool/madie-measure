import * as React from "react";
import "@testing-library/jest-dom";
import { describe, expect, test } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import EditTestCaseBreadCrumbs from "./EditTestCaseBreadCrumbs";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
// @ts-ignore
import { measureStore } from "@madie/madie-util";
import {
  GroupPopulation,
  Measure,
  MeasureScoring,
  PopulationExpectedValue,
  TestCase,
} from "@madie/madie-models";

const { getByText } = screen;

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
  checkUserCanEdit: jest.fn(),
  useFeatureFlags: () => ({}),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  routeHandlerStore: {
    subscribe: () => {
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: jest.fn((routeObj) => routeObj),
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

const testCases = [
  {
    id: "1",
    description: "Test IPP",
    title: "WhenAllGood",
    series: "IPP-Pass",
    validResource: true,
    json: "{}",
    groupPopulations: [
      {
        groupId: "1",
        scoring: MeasureScoring.PROPORTION,
        populationValues: [
          {
            name: "initialPopulation",
            expected: true,
          },
          {
            name: "denominator",
            expected: false,
          },
          {
            name: "numerator",
            expected: true,
          },
        ] as PopulationExpectedValue[],
      },
    ] as GroupPopulation[],
  },
  {
    id: "2",
    description: "Test IPP Fail when something is wrong",
    title: "WhenSomethingIsWrong",
    series: "IPP-Fail",
    validResource: true,
    json: "{}",
    groupPopulations: [
      {
        groupId: "1",
        scoring: MeasureScoring.PROPORTION,
        populationValues: [
          {
            name: "initialPopulation",
            expected: false,
          },
          {
            name: "denominator",
            expected: false,
          },
          {
            name: "numerator",
            expected: true,
          },
        ] as PopulationExpectedValue[],
      },
    ] as GroupPopulation[],
  },
  {
    id: "3",
    description: "Invalid test case",
    title: "WhenJsonIsInvalid",
    series: "IPP-Fail",
    validResource: false,
    json: "{}",
    groupPopulations: [
      {
        groupId: "1",
        scoring: MeasureScoring.PROPORTION,
        populationValues: [
          {
            name: "initialPopulation",
            expected: false,
          },
          {
            name: "denominator",
            expected: false,
          },
          {
            name: "numerator",
            expected: true,
          },
        ] as PopulationExpectedValue[],
      },
    ] as GroupPopulation[],
  },
] as TestCase[];

const measure = {
  id: "measure ID",
  createdBy: "testuser@example.com",
  model: "QI-Core v4.1.1",
  testCases: testCases,
} as Measure;

describe("EditTestCaseBreadCrumbs", () => {
  beforeEach(() => {
    measureStore.state.mockImplementation(() => measure);
  });

  test("routes to a new route, and navigates back.", async () => {
    render(
      <MemoryRouter>
        <EditTestCaseBreadCrumbs
          testCase={{
            title: "title",
            series: "",
            createdAt: "",
            createdBy: "",
            description: "",
          }}
          measureId="unknown"
        />
      </MemoryRouter>
    );

    fireEvent.click(getByText("Test Cases"));
    await waitFor(() => {
      expect(screen.getByText("Test Cases")).toHaveClass("madie-link");
    });
  });
});
