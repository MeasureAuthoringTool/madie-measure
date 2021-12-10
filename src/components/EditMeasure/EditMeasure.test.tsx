import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { waitFor, render } from "@testing-library/react";
import EditMeasure from "./EditMeasure";
import axios from "axios";
import { Measure } from "../../models/Measure";

jest.mock("axios");

jest.mock("../config/Config", () => ({
  getServiceConfig: () => ({
    measureService: {
      baseUrl: "example-service-url",
    },
  }),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const measure: Measure = {
  id: "1",
  measureName: "MSR001",
  cql: "",
  createdAt: "",
  createdBy: "",
  lastModifiedAt: "",
  lastModifiedBy: "",
  measureHumanReadableId: "",
  measureSetId: "",
  model: "",
  revisionNumber: 0,
  state: "",
  version: 0,
};
mockedAxios.get.mockResolvedValue({ data: measure });

jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useParams: () => ({
    id: "1",
  }),
}));

jest.mock("../InlineEdit/InlineEdit");

test("Renders the Edit measure div", async () => {
  const { getByTestId } = render(<EditMeasure />);
  await waitFor(() => {
    expect(getByTestId("measure-name-edit")).toBeTruthy();
  });
});
