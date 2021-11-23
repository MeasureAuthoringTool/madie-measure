import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react";
import EditMeasure from "../EditMeasure";
import axios from "axios";

interface Measure {
  id: string;
  name: string;
}

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;
const measures: Measure[] = [
  { id: "1", name: "John" },
  { id: "2", name: "Andrew" },
];
mockedAxios.get.mockResolvedValueOnce(measures);
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useParams: () => ({
    connectionId: "12",
  }),
}));
jest.mock("../InlineEdit");

test("Renders the Edit measure div", () => {
  act(() => {
    render(<EditMeasure />);
    expect(screen.getByTestId("measure-name-edit")).toBeTruthy();
  });
});
