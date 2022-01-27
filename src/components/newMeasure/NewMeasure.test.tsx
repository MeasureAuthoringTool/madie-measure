import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import NewMeasure from "./NewMeasure";
import axios from "axios";
import { MeasureScoring } from "../../models/MeasureScoring";
import { Model } from "../../models/Model";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../api/useMeasureServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const measures = [
  {
    id: "ab123",
    measureHumanReadableId: "ab123",
    measureSetId: null,
    version: 1.2,
    revisionNumber: 12,
    state: "NA",
    measureName: "TestMeasure1",
    cqlLibraryName: "TestLib1",
    measureScoring: MeasureScoring.COHORT,
    cql: null,
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: Model.QICORE,
    measureMetaData: null,
  },
];

// const useMeasureServiceApiMock =
//   useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
//
// const serviceApiMock = {
//   fetchMeasure: jest.fn().mockResolvedValue(measures),
// } as unknown as MeasureServiceApi;
//
// useMeasureServiceApiMock.mockImplementation(() => {
//   return serviceApiMock;
// });

// jest.mock("../config/Config", () => ({
//   getServiceConfig: jest.fn(() =>
//     Promise.resolve({
//       measureService: {
//         baseUrl: "example-service-url",
//       },
//     })
//   ),
// }));

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  elmTranslationService: {
    baseUrl: "test-elm-service",
  },
};

jest.mock("../../hooks/useOktaTokens", () => () => ({
  getAccessToken: () => "test.jwt",
}));

const mockMeasureServiceApi = {
  fetchMeasures: jest.fn().mockResolvedValue(measures),
} as unknown as MeasureServiceApi;

jest.mock("../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);

describe("Measure Page", () => {
  test("shows the children when the checkbox is checked", async () => {
    mockedAxios.get.mockResolvedValue({
      data: measures,
    });
    render(
      <ApiContextProvider value={serviceConfig}>
        <NewMeasure />
      </ApiContextProvider>
    );
    expect(screen.getByTestId("create-new-measure-button")).toBeTruthy();
    // await waitFor(
    //   () => {
    //     expect(screen.getByText("TestMeasure1")).toBeInTheDocument();
    //   },
    //   { timeout: 5000 }
    // );
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(true);
  });
});
