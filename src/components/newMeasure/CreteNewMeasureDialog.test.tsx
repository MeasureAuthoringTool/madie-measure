import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MeasureRoutes } from "../measureLanding/MeasureLanding";
import { MeasureServiceApi } from "../../api/useMeasureServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { act, Simulate } from "react-dom/test-utils";
import { mockPaginationResponses } from "../measureLanding/mockMeasureResponses";
import { describe, expect, test } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import {
  mockLibraryName,
  mockMeasureName,
} from "../createNewMeasure/bulkCreate";
import axios from "axios";

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  elmTranslationService: {
    baseUrl: "test-elm-service",
  },
};
jest.mock("../config/Config", () => ({
  getServiceConfig: () => ({
    measureService: {
      baseUrl: "example-service-url",
    },
  }),
}));
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;
let postData: object = { status: 201 };
let getData: object = { status: 200 };
mockedAxios.post.mockReturnValueOnce({ data: postData });
mockedAxios.get.mockReturnValueOnce({ data: getData });
jest.mock("../../hooks/useOktaTokens", () => () => ({
  getAccessToken: () => "test.jwt",
}));

const mockMeasureServiceApi = {
  fetchMeasures: jest.fn(mockPaginationResponses),
} as unknown as MeasureServiceApi;

jest.mock("../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);
const mockLib = mockLibraryName();
const mockName = mockMeasureName();

const mockFormikInfo = {
  measureName: mockName,
  model: "QI-Core",
  cqlLibraryName: mockLib,
  measureScoring: "Cohort",
};

describe("Measures Create Dialog", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Clicking on create opens up the create dialog", async () => {
    await act(async () => {
      const { findByTestId } = await render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter
            initialEntries={[
              {
                pathname: "/measures",
                search: "",
                hash: "",
                state: undefined,
                key: "1fewtg",
              },
            ]}
          >
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      const dialogButton = await findByTestId("create-new-measure-button");
      expect(dialogButton).toBeTruthy();
      fireEvent.click(dialogButton);
      const dialog = await findByTestId("create-dialog");
      expect(dialog).toBeTruthy();
    });
  });

  test("Form items are all there except for our hidden item", async () => {
    await act(async () => {
      const { findByTestId, queryByTestId } = await render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter
            initialEntries={[
              {
                pathname: "/measures",
                search: "",
                hash: "",
                state: undefined,
                key: "1fewtg",
              },
            ]}
          >
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      const dialogButton = await findByTestId("create-new-measure-button");
      expect(dialogButton).toBeTruthy();
      fireEvent.click(dialogButton);
      expect(await findByTestId("measure-name-text-field")).toBeInTheDocument();
      expect(await findByTestId("measure-model-select")).toBeInTheDocument();
      expect(await findByTestId("model-version-select")).toBeInTheDocument();
      expect(await findByTestId("cql-library-name")).toBeInTheDocument();
      expect(await findByTestId("eqcm-text-field")).toBeInTheDocument();
      expect(await findByTestId("auto-generate-checkbox")).toBeInTheDocument();
      expect(
        await findByTestId("manual-generate-checkbox")
      ).toBeInTheDocument();
      expect(await findByTestId("CMSID-text-field")).toBeInTheDocument();
      expect(
        await findByTestId("measure-scoring-select-field")
      ).toBeInTheDocument();
      expect(await findByTestId("subject-select")).toBeInTheDocument();
      expect(
        await findByTestId("create-new-measure-save-button")
      ).toBeInTheDocument();
      expect(queryByTestId("CMSID-text-field")).not.toBeVisible();
    });
  });

  test("checking the checkbox for manual entry makes cmsid visible", async () => {
    await act(async () => {
      const { findByTestId, queryByTestId } = await render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter
            initialEntries={[
              {
                pathname: "/measures",
                search: "",
                hash: "",
                state: undefined,
                key: "1fewtg",
              },
            ]}
          >
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      const dialogButton = await findByTestId("create-new-measure-button");
      expect(dialogButton).toBeTruthy();
      fireEvent.click(dialogButton);
      const manualCheck = await findByTestId("manual-generate-checkbox");
      fireEvent.click(manualCheck);
      expect(queryByTestId("CMSID-text-field")).toBeVisible();
    });
  });

  test("our submission works as intended", async () => {
    await act(async () => {
      const { findByTestId, queryByTestId, getByTestId } = await render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter
            initialEntries={[
              {
                pathname: "/measures",
                search: "",
                hash: "",
                state: undefined,
                key: "1fewtg",
              },
            ]}
          >
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );

      const dialogButton = await findByTestId("create-new-measure-button");
      expect(queryByTestId("create-dialog")).not.toBeInTheDocument();
      expect(dialogButton).toBeTruthy();
      fireEvent.click(dialogButton);
      // we gotta hit the input to change the value of material ui components. make sure they have ids
      const nameNode = await getByTestId("measure-name-input");
      userEvent.type(nameNode, mockFormikInfo.measureName);
      expect(nameNode.value).toBe(mockFormikInfo.measureName);
      Simulate.change(nameNode);

      fireEvent.click(getByTestId("measure-name-text-field"));
      fireEvent.blur(getByTestId("measure-name-text-field"));

      const libraryNode = await getByTestId("cql-library-name-input");
      userEvent.type(libraryNode, mockFormikInfo.cqlLibraryName);
      expect(libraryNode.value).toBe(mockFormikInfo.cqlLibraryName);
      Simulate.change(libraryNode);

      const modelSelect = await getByTestId("measure-model-select");
      fireEvent.click(modelSelect);
      const modelNode = await getByTestId("measure-model-input");
      fireEvent.select(modelNode, { target: { value: mockFormikInfo.model } });
      expect(modelNode.value).toBe(mockFormikInfo.model);
      Simulate.change(modelNode);

      const scoringSelect = await getByTestId("measure-scoring-select-field");
      fireEvent.click(scoringSelect);
      const scoringNode = await getByTestId("measure-scoring-input");
      fireEvent.select(scoringNode, {
        target: { value: mockFormikInfo.measureScoring },
      });
      expect(scoringNode.value).toBe(mockFormikInfo.measureScoring);
      Simulate.change(scoringNode);

      const submitButton = await findByTestId("create-new-measure-save-button");
      await waitFor(() => expect(submitButton).not.toBeDisabled(), {
        timeout: 5000,
      });
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalled(),
          {
            timeout: 5000,
          };
      });
      await waitFor(() => expect(submitButton).not.toBeDisabled(), {
        timeout: 5000,
      });
      await waitFor(() => {
        expect(queryByTestId("server-error-alerts")).not.toBeInTheDocument();
      });
    });
  });
});
