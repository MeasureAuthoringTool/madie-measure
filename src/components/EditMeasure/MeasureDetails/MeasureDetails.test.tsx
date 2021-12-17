import "@testing-library/jest-dom";
import * as React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Route } from "react-router-dom";
import MeasureDetails from "./MeasureDetails";
import { ApiContextProvider, ServiceConfig } from "../../../api/ServiceContext";
import MeasureInformation from "./MeasureInformation";
import MeasureSteward from "./MeasureSteward";

jest.mock("./MeasureInformation");
jest.mock("./MeasureSteward");

const MeasureInformationMock = MeasureInformation as jest.Mock<JSX.Element>;
const MeasureStewardMock = MeasureSteward as jest.Mock<JSX.Element>;

MeasureInformationMock.mockImplementation(() => {
  return <div>Mock Measure Info</div>;
});

MeasureStewardMock.mockImplementation(() => {
  return <div>Mock Measure Steward</div>;
});

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "base.url",
  },
};

describe("MeasureDetails component", () => {
  it("should render the MeasureInformation component for default URL", () => {
    const { getByText } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo" }]}>
          <Route path="/foo">
            <MeasureDetails />
          </Route>
        </MemoryRouter>
      </ApiContextProvider>
    );
    expect(getByText("Mock Measure Info")).toBeTruthy();
  });

  it("should render the MeasureSteward component for measure-steward URL", () => {
    const { getByText } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo/measure-steward" }]}>
          <Route path="/foo">
            <MeasureDetails />
          </Route>
        </MemoryRouter>
      </ApiContextProvider>
    );
    expect(getByText("Mock Measure Steward")).toBeTruthy();
  });
});
