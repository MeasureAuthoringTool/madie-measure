import "@testing-library/jest-dom";
import * as React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Route } from "react-router-dom";
import MeasureDetails from "./MeasureDetails";
import { ApiContextProvider, ServiceConfig } from "../../../api/ServiceContext";
import MeasureInformation from "./measureInformation/MeasureInformation";
import MeasureSteward from "./measureSteward/MeasureSteward";
import MeasureDescription from "./MeasureDescription/MeasureDescription";

jest.mock("./measureInformation/MeasureInformation");
jest.mock("./measureSteward/MeasureSteward");
jest.mock("./MeasureDescription/MeasureDescription");

const MeasureInformationMock = MeasureInformation as jest.Mock<JSX.Element>;
const MeasureStewardMock = MeasureSteward as jest.Mock<JSX.Element>;
const MeasureDescriptionMock = MeasureDescription as jest.Mock<JSX.Element>;

MeasureInformationMock.mockImplementation(() => {
  return <div>Mock Measure Info</div>;
});

MeasureStewardMock.mockImplementation(() => {
  return <div>Mock Measure Steward</div>;
});

MeasureDescriptionMock.mockImplementation(() => {
  return <div>Mock Measure Description</div>;
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

  it("should render the MeasureDescription component for measure-description URL", () => {
    const { getByText, getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter
          initialEntries={[{ pathname: "/foo/measure-description" }]}
        >
          <Route path="/foo">
            <MeasureDetails />
          </Route>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(getByText("Mock Measure Description")).toBeTruthy();
    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureSteward")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureDescription")).toBeInTheDocument();
  });
});
