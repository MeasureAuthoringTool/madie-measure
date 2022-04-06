import "@testing-library/jest-dom";
import * as React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Route } from "react-router-dom";
import MeasureDetails from "./MeasureDetails";
import { ApiContextProvider, ServiceConfig } from "../../../api/ServiceContext";
import MeasureInformation from "./measureInformation/MeasureInformation";
import MeasureSteward from "./measureSteward/MeasureSteward";
import MeasureDescription from "./measureDescription/MeasureDescription";
import MeasureCopyright from "./measureCopyright/MeasureCopyright";
import MeasureDisclaimer from "./measureDisclaimer/MeasureDisclaimer";
import MeasureRationale from "./measureRationale/MeasureRationale";

jest.mock("./measureInformation/MeasureInformation");
jest.mock("./measureSteward/MeasureSteward");
jest.mock("./measureDescription/MeasureDescription");
jest.mock("./measureCopyright/MeasureCopyright");
jest.mock("./measureDisclaimer/MeasureDisclaimer");
jest.mock("./measureRationale/MeasureRationale");

const MeasureInformationMock = MeasureInformation as jest.Mock<JSX.Element>;
const MeasureStewardMock = MeasureSteward as jest.Mock<JSX.Element>;
const MeasureDescriptionMock = MeasureDescription as jest.Mock<JSX.Element>;
const MeasureCopyrightMock = MeasureCopyright as jest.Mock<JSX.Element>;
const MeasureDisclaimerMock = MeasureDisclaimer as jest.Mock<JSX.Element>;
const MeasureRationaleMock = MeasureRationale as jest.Mock<JSX.Element>;

MeasureInformationMock.mockImplementation(() => {
  return <div>Mock Measure Info</div>;
});

MeasureStewardMock.mockImplementation(() => {
  return <div>Mock Measure Steward</div>;
});

MeasureDescriptionMock.mockImplementation(() => {
  return <div>Mock Measure Description</div>;
});

MeasureCopyrightMock.mockImplementation(() => {
  return <div>Mock Measure Copyright</div>;
});

MeasureDisclaimerMock.mockImplementation(() => {
  return <div>Mock Measure Disclaimer</div>;
});

MeasureRationaleMock.mockImplementation(() => {
  return <div>Mock Measure Rationale</div>;
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
    expect(getByTestId("leftPanelMeasureRationale")).toBeInTheDocument();
  });

  it("should render the MeasureCopyright component for measure-copyright URL", () => {
    const { getByText, getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo/measure-copyright" }]}>
          <Route path="/foo">
            <MeasureDetails />
          </Route>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(getByText("Mock Measure Copyright")).toBeTruthy();
    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureSteward")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureDescription")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureCopyright")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureRationale")).toBeInTheDocument();
  });

  it("should render the MeasureDisclaimer component for measure-disclaimer URL", () => {
    const { getByText, getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter
          initialEntries={[{ pathname: "/foo/measure-disclaimer" }]}
        >
          <Route path="/foo">
            <MeasureDetails />
          </Route>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(getByText("Mock Measure Disclaimer")).toBeTruthy();
    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureSteward")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureDescription")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureDisclaimer")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureRationale")).toBeInTheDocument();
  });
});
