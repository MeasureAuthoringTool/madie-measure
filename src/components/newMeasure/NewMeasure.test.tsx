import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import NewMeasure from "./NewMeasure";
import axios from "axios";
import { MeasureScoring } from "../../models/MeasureScoring";
import { Model } from "../../models/Model";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../config/Config", () => ({
  getServiceConfig: jest.fn(() =>
    Promise.resolve({
      measureService: {
        baseUrl: "example-service-url",
      },
    })
  ),
}));

jest.mock("../../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  }))
);

describe("Measure Page", () => {
  test("shows the children when the checkbox is checked", async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        {
          id: "ab123",
          measureHumanReadableId: "ab123",
          measureName: "TestMeasure1",
          model: Model.QICORE,
          measureScoring: MeasureScoring.COHORT,
          measureState: "NA",
          version: 1.2,
          revisionNumber: 12,
        },
      ],
    });
    render(<NewMeasure />);
    expect(screen.getByTestId("create-new-measure-button")).toBeTruthy();
    // await waitFor(() => {
    //   expect(screen.getByText("TestMeasure1")).toBeInTheDocument();
    // });
    // const measure1 = await screen.findByText("TestMeasure1");
    // expect(measure1).toBeInTheDocument();
  });
});
